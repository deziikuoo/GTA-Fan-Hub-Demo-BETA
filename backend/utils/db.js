// MongoDB connection handler for Railway
import { MongoClient } from 'mongodb';

// Cache the client and database connection
let cachedClient = null;
let cachedDb = null;

/**
 * Connect to MongoDB Atlas DEMO database
 * @returns {Promise<{client: MongoClient, db: Db}>}
 */
export async function connectToDatabase() {
  // Return cached connection if available and still connected
  if (cachedClient && cachedDb) {
    try {
      await cachedDb.admin().ping();
      return { client: cachedClient, db: cachedDb };
    } catch (error) {
      console.log('[MongoDB] Cached connection is stale, reconnecting...');
      const staleClient = cachedClient;
      cachedClient = null;
      cachedDb = null;
      try {
        await staleClient.close();
      } catch (e) {
        // Ignore errors when closing stale connection
      }
    }
  }

  const uri = process.env.CONNECTION_STRING;
  
  if (!uri) {
    throw new Error('CONNECTION_STRING environment variable is not defined');
  }

  console.log('[MongoDB] Connecting to database...');

  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    retryWrites: true,
    retryReads: true,
  });

  try {
    await client.connect();
    const db = client.db('DEMO');
    
    cachedClient = client;
    cachedDb = db;
    
    console.log('[MongoDB] Successfully connected to DEMO database');
    return { client, db };
  } catch (error) {
    console.error('[MongoDB] Connection failed:', error.message);
    throw error;
  }
}

/**
 * Get the newsletter_subscribers collection
 */
export async function getSubscribersCollection() {
  const { db } = await connectToDatabase();
  return db.collection('newsletter_subscribers');
}

