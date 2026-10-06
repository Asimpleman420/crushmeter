import "dotenv/config";
import { connectDB } from './lib/db.js';
import { createApp } from './app.js';

const app = createApp();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

try {
  await connectDB();
  app.listen(PORT, HOST, () => {
    console.log(`CrushMeter API is running on ${HOST}:${PORT}`);
  });
} catch (error) {
  console.error('Unable to start the API:', error.message);
  process.exit(1);
}
