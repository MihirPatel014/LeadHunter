import app from './app.js';
import { config } from './config/env.js';

app.listen(config.port, () => {
  console.log(`🚀 LeadHunter API listening on port ${config.port} [${config.nodeEnv}]`);
});
