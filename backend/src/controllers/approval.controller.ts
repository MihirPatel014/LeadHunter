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
      const validated = rejectApprovalSchema.parse(req.body);
      const data = await this.approvalService.reject(Number(req.params.id), validated.note);
      res.status(200).json({ success: true, message: 'Approval rejected', data });
    } catch (e) { next(e); }
  };
}
