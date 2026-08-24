import { FollowUpService } from './follow-up.service.js';
import { ReplyDetectionService } from './reply-detection.service.js';

export class FollowUpSchedulerService {
  private static instance: FollowUpSchedulerService;
  private intervalId: NodeJS.Timeout | null = null;
  private followUpService: FollowUpService;
  private replyService: ReplyDetectionService;
  private isRunning: boolean = false;

  private constructor() {
    this.followUpService = new FollowUpService();
    this.replyService = new ReplyDetectionService();
  }

  public static getInstance(): FollowUpSchedulerService {
    if (!FollowUpSchedulerService.instance) {
      FollowUpSchedulerService.instance = new FollowUpSchedulerService();
    }
    return FollowUpSchedulerService.instance;
  }

  /**
   * Start periodic follow-up checking every intervalMs (defaults to 60 seconds)
   */
  public start(intervalMs: number = 60000) {
    if (this.intervalId) {
      console.log('[FollowUpScheduler] Scheduler already running.');
      return;
    }

    console.log(`[FollowUpScheduler] Starting background follow-up worker (interval: ${intervalMs / 1000}s)`);

    // Run initial tick after 5s
    setTimeout(() => {
      this.tick();
    }, 5000);

    this.intervalId = setInterval(() => {
      this.tick();
    }, intervalMs);
  }

  /**
   * Stop background scheduler
   */
  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[FollowUpScheduler] Scheduler stopped.');
    }
  }

  private async tick() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      // 1. Check for newly arrived replies first so follow-ups are halted for responding leads
      try {
        const syncResult = await this.replyService.syncGmailReplies();
        if (syncResult.repliesFound > 0) {
          console.log(
            `[FollowUpScheduler] Discovered ${syncResult.repliesFound} inbound replies via ${syncResult.source}. Updated ${syncResult.leadsUpdated} leads to REPLIED.`
          );
        }
      } catch (syncErr: any) {
        // Log sync warning without halting follow-up processor
        console.warn('[FollowUpScheduler] Background reply sync warning:', syncErr.message);
      }

      // 2. Process pending follow-ups
      const result = await this.followUpService.processDueFollowUps();
      if (result.processed > 0) {
        console.log(
          `[FollowUpScheduler] Processed ${result.processed} due follow-ups -> ${result.queuedForApproval} queued for approval, ${result.stopped} stopped, ${result.errors} errors.`
        );
      }
    } catch (err: any) {
      console.error('[FollowUpScheduler] Error in worker tick:', err.message);
    } finally {
      this.isRunning = false;
    }
  }
}
