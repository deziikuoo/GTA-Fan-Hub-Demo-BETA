// MongoDB connection handler for Vercel serverless functions
import { MongoClient } from 'mongodb';

// Cache the client and database connection for reuse across invocations
let cachedClient = null;
let cachedDb = null;

/**
 * Connect to MongoDB Atlas DEMO database
 * Uses connection caching for Vercel serverless optimization
 * @returns {Promise<{client: MongoClient, db: Db}>}
 */
export async function connectToDatabase() {
  // Return cached connection if available
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // Get connection string from environment variable
  const uri = process.env.CONNECTION_STRING;
  
  if (!uri) {
    throw new Error('CONNECTION_STRING environment variable is not defined');
  }

  // Create new MongoDB client
  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  // Connect to MongoDB
  await client.connect();
  
  // Connect to DEMO database (separate from production)
  const db = client.db('DEMO');
  
  // Cache the connection
  cachedClient = client;
  cachedDb = db;

  console.log('[MongoDB] Connected to DEMO database');

  return { client, db };
}

/**
 * Get the newsletter_subscribers collection
 * @returns {Promise<Collection>}
 */
export async function getSubscribersCollection() {
  const { db } = await connectToDatabase();
  return db.collection('newsletter_subscribers');
}

/**
 * Initialize collection indexes (call once during setup)
 */
export async function initializeIndexes() {
  const collection = await getSubscribersCollection();
  
  // Create indexes for efficient queries
  await collection.createIndex({ email: 1 }, { unique: true });
  await collection.createIndex({ confirmationToken: 1 });
  await collection.createIndex({ status: 1 });
  await collection.createIndex({ subscribedAt: -1 });
  
  console.log('[MongoDB] Indexes created for newsletter_subscribers collection');
}

