// seed-debug.mjs
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;
console.log('Attempting to connect...');
if (MONGODB_URI) {
    const hiddenUri = MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.log('URI:', hiddenUri);
}

try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected successfully');
    process.exit(0);
} catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
}
