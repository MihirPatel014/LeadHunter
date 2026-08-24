import { prisma } from '../config/prisma.js';
import { ReplyRepository } from '../repositories/reply.repository.js';
import { GmailService } from './gmail.service.js';
import { ImapService } from './imap.service.js';

export interface SyncRepliesResult {
  threadsChecked: number;
  repliesFound: number;
  leadsUpdated: number;
  source: 'imap' | 'gmail_api' | 'mock_or_unconfigured';
}

export interface SimulateReplyInput {
  leadId: number;
  sender?: string;
  subject?: string;
  body: string;
}

export class ReplyDetectionService {
  private replyRepo: ReplyRepository;
  private gmailService: GmailService;
  private imapService: ImapService;

  constructor() {
    this.replyRepo = new ReplyRepository();
    this.gmailService = new GmailService();
    this.imapService = new ImapService();
  }

  /**
   * List all tracked replies
   */
  async listReplies(filters: { leadId?: number; sender?: string } = {}) {
    return this.replyRepo.findMany(filters);
  }

  /**
   * Sync replies by checking active inbox via IMAP (App Password) or Gmail OAuth API
   */
  async syncGmailReplies(): Promise<SyncRepliesResult> {
    // 1. If IMAP (App Password) is configured, prioritize IMAP sync
    if (this.imapService.isConfigured()) {
      try {
        return await this.imapService.syncReplies();
      } catch (err: any) {
        console.error('[ReplyDetectionService] IMAP sync failed:', err.message);
        throw err;
      }
    }

    // 2. Fall back to Gmail OAuth API sync
    return this.syncGmailOAuthReplies();
  }

  /**
   * Sync replies by checking active threads in Gmail OAuth API
   */
  private async syncGmailOAuthReplies(): Promise<SyncRepliesResult> {
    const creds = this.gmailService.getCredentials();
    const hasLiveCreds = Boolean(creds.clientId && creds.clientSecret && creds.refreshToken);

    // Find all sent messages with a threadId
    const sentMessages = await prisma.sentMessage.findMany({
      where: {
        status: 'SENT',
        threadId: { not: null },
      },
      orderBy: { sentAt: 'desc' },
      take: 50,
    });

    const result: SyncRepliesResult = {
      threadsChecked: sentMessages.length,
      repliesFound: 0,
      leadsUpdated: 0,
      source: hasLiveCreds ? 'gmail_api' : 'mock_or_unconfigured',
    };

    if (!hasLiveCreds || sentMessages.length === 0) {
      return result;
    }

    // Refresh Google OAuth token
    let accessToken = '';
    try {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: creds.clientId,
          client_secret: creds.clientSecret,
          refresh_token: creds.refreshToken,
          grant_type: 'refresh_token',
        }).toString(),
      });

      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        accessToken = tokenData.access_token;
      }
    } catch (err: any) {
      console.warn('[ReplyDetectionService] Could not refresh Gmail token:', err.message);
      return result;
    }

    if (!accessToken) {
      return result;
    }

    // Check each unique thread
    const checkedThreads = new Set<string>();

    for (const sent of sentMessages) {
      if (!sent.threadId || checkedThreads.has(sent.threadId)) continue;
      checkedThreads.add(sent.threadId);

      try {
        const threadRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/threads/${sent.threadId}?format=full`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (!threadRes.ok) continue;
        const threadData = await threadRes.json();
        const messages: any[] = threadData.messages || [];

        for (const msg of messages) {
          // If message is not our sent message, it's an incoming reply
          if (msg.id !== sent.messageId) {
            const existing = await this.replyRepo.findByMessageId(msg.id);
            if (existing) continue; // Already processed

            // Parse headers
            const headers = msg.payload?.headers || [];
            const fromHeader = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || sent.recipient;
            const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || sent.subject;
            const dateHeader = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value;
            const replyDate = dateHeader ? new Date(dateHeader) : new Date(Number(msg.internalDate) || Date.now());

            const bodySnippet = msg.snippet || 'No message preview available';

            // Save reply
            await this.replyRepo.create({
              leadId: sent.leadId ?? undefined,
              sentMessageId: sent.id,
              threadId: sent.threadId,
              messageId: msg.id,
              sender: fromHeader,
              subject: subjectHeader,
              body: bodySnippet,
              replyAt: replyDate,
            });

            result.repliesFound++;

            // Update matched Lead status to REPLIED
            if (sent.leadId) {
              await prisma.lead.update({
                where: { id: sent.leadId },
                data: {
                  status: 'REPLIED',
                  nextFollowUpAt: null, // Halts follow-ups automatically
                },
              });
              result.leadsUpdated++;
            }
          }
        }
      } catch (err: any) {
        console.error(`[ReplyDetectionService] Error inspecting thread ${sent.threadId}:`, err.message);
      }
    }

    return result;
  }

  /**
   * Simulate a test reply for a lead (useful for testing & demos without requiring live incoming emails)
   */
  async simulateReply(input: SimulateReplyInput) {
    const lead = await prisma.lead.findUnique({ where: { id: input.leadId } });
    if (!lead) {
      const err: any = new Error(`Lead #${input.leadId} not found`);
      err.statusCode = 404;
      throw err;
    }

    // Find recent sent message for lead if available
    const sentMessage = await prisma.sentMessage.findFirst({
      where: { leadId: lead.id, status: 'SENT' },
      orderBy: { sentAt: 'desc' },
    });

    const threadId = sentMessage?.threadId || `sim_thread_${Date.now()}`;
    const messageId = `sim_msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sender = input.sender || lead.email || `${lead.businessName} Owner <owner@${lead.website || 'example.com'}>`;
    const subject = input.subject || `Re: Quick question for ${lead.businessName}`;

    // Create Reply
    const reply = await this.replyRepo.create({
      leadId: lead.id,
      sentMessageId: sentMessage?.id,
      threadId,
      messageId,
      sender,
      subject,
      body: input.body,
      replyAt: new Date(),
    });

    // Update Lead status to REPLIED & cancel future follow-ups
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: 'REPLIED',
        nextFollowUpAt: null,
      },
    });

    return reply;
  }
}
