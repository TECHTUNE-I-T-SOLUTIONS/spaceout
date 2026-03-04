import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI as string, opts)
      .then((mongoose) => {
        return mongoose;
      });
  }

  try {
    cached.conn = await cached.promise;
    
    // Clean up old indexes that may cause conflicts
    try {
      const db = cached.conn.connection.db;
      const collections = await db.listCollections().toArray();
      const paymentCollectionExists = collections.some((c: any) => c.name === 'payments');
      
      if (paymentCollectionExists) {
        const collection = db.collection('payments');
        const indexes = await collection.listIndexes().toArray();
        
        // Drop the old paymentReference index if it exists
        const oldIndex = indexes.find((idx: any) => idx.name === 'paymentReference_1');
        if (oldIndex) {
          await collection.dropIndex('paymentReference_1');
          console.log('Dropped old paymentReference index');
        }
      }
    } catch (indexError: any) {
      // Silently fail if index cleanup fails - it's not critical
      console.log('Index cleanup status:', indexError.message);
    }
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;

declare global {
  var mongoose: any;
}
