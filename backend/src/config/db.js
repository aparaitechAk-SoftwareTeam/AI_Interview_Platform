import mongoose from 'mongoose';
import dns from 'dns';

// Override default DNS servers for Node's c-ares library to bypass local IPv6 DNS SRV resolution issues
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  console.log('[DNS System] Configured native Node DNS servers: [8.8.8.8, 8.8.4.4, 1.1.1.1]');
} catch (err) {
  console.warn('[DNS System] Warning: Could not set global custom DNS servers:', err.message);
}

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai_interview';
  try {
    console.log(`Connecting to MongoDB at: ${connStr}`);
    await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`✅ MongoDB Connected: ${mongoose.connection.name}`);
  } catch (err) {
    console.warn(`⚠️ MongoDB connection failed: ${err.message}`);
    if (process.env.NODE_ENV === 'test') {
      try {
        if (mongoose.connection.readyState === 0) {
          console.log('🔄 Attempting fallback to mongodb-memory-server...');
          const { MongoMemoryServer } = await import('mongodb-memory-server');
          const mongod = await MongoMemoryServer.create();
          const memoryUri = mongod.getUri();
          await mongoose.connect(memoryUri);
          console.log('✅ Connected to MongoMemoryServer fallback at:', memoryUri);
        }
      } catch (memErr) {
        console.error('❌ Failed to connect to MongoMemoryServer fallback:', memErr.message);
        throw err;
      }
    } else {
      console.error(`❌ FATAL: Database connection failed. Please ensure MongoDB is running and MONGODB_URI is correctly configured in .env. connection error: ${err.message}`);
      process.exit(1);
    }
  }
}
