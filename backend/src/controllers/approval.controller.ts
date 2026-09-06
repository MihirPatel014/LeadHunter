import { Request, Response, NextFunction } from 'express';
import { ApprovalService } from '../services/approval.service.js';
import {
  createApprovalSchema,
  updateApprovalSchema,
  rejectApprovalSchema,
} from '../validators/approval.validator.js';

export class ApprovalController {
  private approvalService: ApprovalService;
  constructor() { this.approvalService = new ApprovalService(); }

  /** GET /api/approvals */
  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = req.query.status as string | undefined;
      const leadId = req.query.leadId ? Number(req.query.leadId) : undefined;
      const data = await this.approvalService.list({ status, leadId });
      res.status(200).json({ success: true, data });
    } catch (e) { next(e); }
  };

  /** GET /api/approvals/:id */
  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.approvalService.getById(Number(req.params.id));
      res.status(200).json({ success: true, data });
    } catch (e) { next(e); }
  };

  /** POST /api/approvals */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = createApprovalSchema.parse(req.body);
      const data = await this.approvalService.create(validated);
      res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  };

  /** PATCH /api/approvals/:id - only editable in DRAFT or PENDING_APPROVAL */
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = updateApprovalSchema.parse(req.body);
      const data = await this.approvalService.update(Number(req.params.id), validated);
      res.status(200).json({ success: true, data });
    } catch (e) { next(e); }
  };

  /** POST /api/approvals/:id/approve - ONLY entry point to Gmail */
  approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.approvalService.approve(Number(req.params.id));
      res.status(200).json({
        success: true,
        message: 'Approval processed and email dispatched',
        data: result,
      });
    } catch (e) { next(e); }
  };

  /** POST /api/approvals/:id/reject */
  reject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { note } = req.body;
      const data = await this.approvalService.reject(Number(req.params.id), note);
      res.status(200).json({ success: true, message: 'Approval rejected', data });
    } catch (e) { next(e); }
  };

  /** POST /api/approvals/bulk-approve */
  bulkApprove = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ success: false, message: 'Array of approval IDs is required' });
        return;
      }
      const result = await this.approvalService.bulkApprove(ids.map(Number));
      res.status(200).json({
        success: true,
        message: `Bulk approve complete: ${result.approved} approved, ${result.failed} failed`,
        data: result,
      });
    } catch (e) { next(e); }
  };

  /** POST /api/approvals/bulk-reject */
  bulkReject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ids, note } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ success: false, message: 'Array of approval IDs is required' });
        return;
      }
      const result = await this.approvalService.bulkReject(ids.map(Number), note);
      res.status(200).json({
        success: true,
        message: `Bulk reject complete: ${result.rejected} rejected`,
        data: result,
      });
    } catch (e) { next(e); }
  };
}

