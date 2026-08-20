import app from './app.js';
import { config } from './config/env.js';

const server = app.listen(config.port, () => {
  console.log(`🚀 LeadHunter API listening on port ${config.port} [${config.nodeEnv}]`);
});

// Handle server startup errors (e.g. port already in use)
server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${config.port} is already in use by another process.`);
    console.error(`💡 Tip: Another instance of LeadHunter API might be running. Please close it, or run this to free the port on Windows:`);
    console.error(`   Get-Process -Id (Get-NetTCPConnection -LocalPort ${config.port}).OwningProcess | Stop-Process -Force\n`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
