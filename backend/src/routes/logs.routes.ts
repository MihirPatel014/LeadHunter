import { Router } from 'express';
import { LogsController } from '../controllers/logs.controller.js';

const router = Router();
const logsController = new LogsController();

router.get('/logs', logsController.getLogs);
router.post('/logs/client', logsController.ingestClientLog);
router.delete('/logs', logsController.clearLogs);
router.post('/logs/simulate', logsController.simulateLog);

export default router;
