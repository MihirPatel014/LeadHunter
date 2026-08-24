import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { prisma } from '../config/prisma.js';
import { ReplyRepository } from '../repositories/reply.repository.js';
import { config } from '../config/env.js';

export interface ImapSyncResult {
  threadsChecked: number;
  repliesFound: number;
  leadsUpdated: number;
  source: 'imap';
}

export class ImapService {
  private replyRepo: ReplyRepository;

  constructor() {
    this.replyRepo = new ReplyRepository();
  }

  isConfigured(): boolean {
    return Boolean(config.smtpUser && config.smtpPass);
  }

  private createClient(): ImapFlow {
    return new ImapFlow({
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
      logger: false,
    });
  }

  /**
   * Test IMAP connection status
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'SMTP/IMAP credentials not configured in .env' };
    }

    const client = this.createClient();
    try {
      await client.connect();
      await client.logout();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to connect to IMAP server' };
    }
  }

  /**
   * Sync inbox messages via IMAP to detect replies to outreach campaigns
   */
  async syncReplies(): Promise<ImapSyncResult> {
    if (!this.isConfigured()) {
      throw new Error('IMAP credentials not configured. Please set SMTP_USER and SMTP_PASS in .env');
    }

    // 1. Fetch recent sent outreach messages & active leads with emails
    const sentMessages = await prisma.sentMessage.findMany({
      where: {
        channel: 'EMAIL',
        status: 'SENT',
      },
      orderBy: { sentAt: 'desc' },
      take: 100,
    });

    const leads = await prisma.lead.findMany({
      where: {
        email: { not: null },
      },
    });

    const leadEmailMap = new Map<string, typeof leads[0]>();
    for (const lead of leads) {
      if (lead.email) {
        leadEmailMap.set(lead.email.trim().toLowerCase(), lead);
      }
    }

    const result: ImapSyncResult = {
      threadsChecked: sentMessages.length,
      repliesFound: 0,
      leadsUpdated: 0,
      source: 'imap',
    };

    const client = this.createClient();

    try {
      await client.connect();

      // Open INBOX in read-only mode
      const mailbox = await client.mailboxOpen('INBOX', { readOnly: true });

      if (mailbox.exists === 0) {
        await client.logout();
        return result;
      }

      // Fetch last 50 emails from INBOX
      const startSeq = Math.max(1, mailbox.exists - 50);
      const seqRange = `${startSeq}:*`;

      // Fetch message envelopes & raw sources
      for await (const msg of client.fetch(seqRange, { envelope: true, source: true })) {
        if (!msg.source) continue;

        try {
          const parsed = await simpleParser(msg.source);
          const rawMessageId = parsed.messageId || (msg.envelope && msg.envelope.messageId) || `imap_${msg.uid}`;
          const cleanMessageId = rawMessageId.replace(/^<|>$/g, '');

          // Check if already processed
          const existing = await this.replyRepo.findByMessageId(cleanMessageId);
          if (existing) continue;

          const senderAddress = (parsed.from?.value?.[0]?.address || msg.envelope?.from?.[0]?.address || '').toLowerCase().trim();
          const senderName = parsed.from?.value?.[0]?.name || msg.envelope?.from?.[0]?.name || senderAddress;
          const subject = parsed.subject || msg.envelope?.subject || '(No Subject)';
          const replyDate = parsed.date || (msg.envelope?.date ? new Date(msg.envelope.date) : new Date());
          const bodyText = parsed.text || parsed.html ? (parsed.text || 'Email content received in HTML format') : 'No message preview available';

          // Match against our sent messages / leads
          // 1. By In-Reply-To / References headers
          const inReplyTo = (parsed.inReplyTo ? parsed.inReplyTo.replace(/^<|>$/g, '') : '').trim();
          const references = Array.isArray(parsed.references) 
            ? parsed.references.map(r => r.replace(/^<|>$/g, '').trim())
            : (typeof parsed.references === 'string' ? [parsed.references.replace(/^<|>$/g, '').trim()] : []);

          let matchedSentMessage = sentMessages.find(sent => {
            if (sent.messageId) {
              const cleanSentMsgId = sent.messageId.replace(/^<|>$/g, '').trim();
              if (inReplyTo && inReplyTo === cleanSentMsgId) return true;
              if (references.includes(cleanSentMsgId)) return true;
            }
            return false;
          });

          // 2. If no In-Reply-To match, match by sender email address
          if (!matchedSentMessage && senderAddress) {
            matchedSentMessage = sentMessages.find(
              sent => sent.recipient.trim().toLowerCase() === senderAddress
            );
          }

          // 3. Find matched lead
          let matchedLead = matchedSentMessage?.leadId 
            ? leads.find(l => l.id === matchedSentMessage!.leadId)
            : leadEmailMap.get(senderAddress);

          // If the email is from someone we never contacted or lead is not found, skip or record as unlinked
          // Only process as reply if we found a matching sent message or lead
          if (matchedSentMessage || matchedLead) {
            const threadId = matchedSentMessage?.threadId || `imap_thread_${Date.now()}_${msg.uid}`;

            // Create reply record
            await this.replyRepo.create({
              leadId: matchedLead?.id ?? matchedSentMessage?.leadId ?? undefined,
              sentMessageId: matchedSentMessage?.id,
              threadId,
              messageId: cleanMessageId,
              sender: senderName ? `${senderName} <${senderAddress}>` : senderAddress,
              subject,
              body: bodyText,
              replyAt: replyDate,
            });

            result.repliesFound++;

            // Update lead status to REPLIED and stop further follow-ups
            if (matchedLead && matchedLead.status !== 'REPLIED') {
              await prisma.lead.update({
                where: { id: matchedLead.id },
                data: {
                  status: 'REPLIED',
                  nextFollowUpAt: null,
                },
              });
              result.leadsUpdated++;
            }
          }
        } catch (msgErr: any) {
          console.warn(`[ImapService] Error processing message seq ${msg.seq}:`, msgErr.message);
        }
      }

      await client.logout();
    } catch (err: any) {
      console.error('[ImapService] IMAP sync error:', err.message);
      try {
        await client.logout();
      } catch {
        // ignore logout errors on failed connection
      }
      throw new Error(`Failed to sync replies via IMAP: ${err.message}`);
    }

    return result;
  }
}
