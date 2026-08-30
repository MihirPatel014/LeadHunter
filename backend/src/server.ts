import app from './app.js';
import { config } from './config/env.js'; // OpenWA configured
import { FollowUpSchedulerService } from './services/follow-up-scheduler.service.js';
import { appSettingsService } from './services/app-settings.service.js';
import { loadGmailCredentialsFromDB } from './services/gmail.service.js';

// ── Global error handlers — catch anything that slips through ──
process.on('uncaughtException', (err) => {
  console.error('\n🔥 UNCAUGHT EXCEPTION — App crashing!');
  console.error(`   Error: ${err.message}`);
  console.error(`   Stack: ${err.stack}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  console.error('\n⚠️  UNHANDLED PROMISE REJECTION:');
  console.error(`   Reason: ${reason?.message || reason}`);
  if (reason?.stack) console.error(`   Stack: ${reason.stack}`);
  // Don't exit — log it so you can see the issue while developing
});

const server = app.listen(config.port, async () => {
  console.log(`\n🚀 LeadHunter API listening on port ${config.port} [${config.nodeEnv}]`);
  console.log(`   Local:  http://localhost:${config.port}`);
  console.log(`   Health: http://localhost:${config.port}/api/health\n`);

  // Seed default AppSettings on first run
  try {
    await appSettingsService.seed();
    console.log('  ✅ AppSettings seeded');
  } catch (err: any) {
    console.warn('  ⚠️  AppSettings seed warning:', err.message);
  }

  // Load persisted Gmail OAuth credentials from DB into memory
  // (so refresh tokens & connected email survive server restarts)
  try {
    await loadGmailCredentialsFromDB();
    console.log('  ✅ Gmail credentials loaded from DB');
  } catch (err: any) {
    console.warn('  ⚠️  Gmail credentials load warning:', err.message);
  }

  // Start background follow-up scheduler
  FollowUpSchedulerService.getInstance().start();
});

// Handle server startup errors (e.g. port already in use)
server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${config.port} is already in use by another process.`);
    console.error(`💡 Tip: Another instance of LeadHunter API might be running. Please close it, or run this to free the port on Windows:`);
    console.error(`   Get-Process -Id (Get-NetTCPConnection -LocalPort ${config.port}).OwningProcess | Stop-Process -Force\n`);
    process.exit(1);
  } else {
    console.error('\n❌ Server error:');
    console.error(`   Code: ${err.code}`);
    console.error(`   Message: ${err.message}`);
    console.error(`   Stack: ${err.stack}`);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  FollowUpSchedulerService.getInstance().stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

