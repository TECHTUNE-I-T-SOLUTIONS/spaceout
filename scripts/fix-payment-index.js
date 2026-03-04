/**
 * Migration script to fix MongoDB E11000 duplicate key error on Payment collection
 * This drops the problematic index and recreates it properly
 * 
 * Run this once to fix the issue:
 * node scripts/fix-payment-index.js
 */

const mongoose = require('mongoose');

async function fixPaymentIndex() {
  try {
    console.log('Connecting to MongoDB...');
    // Get MongoDB URI from environment or use default
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/spaceout';
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('payments');

    // Get all indexes
    const indexes = await collection.getIndexes();
    console.log('Current indexes:', Object.keys(indexes));

    // Drop the problematic index if it exists
    if (indexes.paymentReference_1) {
      console.log('Dropping old paymentReference index...');
      await collection.dropIndex('paymentReference_1');
      console.log('Old index dropped');
    }

    // Recreate with the correct field name and sparse option
    console.log('Creating new reference index (sparse)...');
    await collection.createIndex(
      { reference: 1 },
      { unique: true, sparse: true }
    );
    console.log('New index created successfully');

    // Verify the new indexes
    const newIndexes = await collection.getIndexes();
    console.log('Updated indexes:', Object.keys(newIndexes));

    console.log('Migration completed successfully!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

fixPaymentIndex();
