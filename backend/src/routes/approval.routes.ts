import { Router } from 'express';
import { ApprovalController } from '../controllers/approval.controller.js';

const router = Router();
const ctrl = new ApprovalController();

router.get('/approvals', ctrl.list);
router.post('/approvals', ctrl.create);
router.post('/approvals/bulk-approve', ctrl.bulkApprove);
router.post('/approvals/bulk-reject', ctrl.bulkReject);
router.get('/approvals/:id', ctrl.getById);
router.patch('/approvals/:id', ctrl.update);
router.post('/approvals/:id/approve', ctrl.approve);
router.post('/approvals/:id/reject', ctrl.reject);

export default router;

