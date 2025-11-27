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
  // Return cached connection if available and still connected
  if (cachedClient && cachedDb) {
    try {
      // Ping the database to check if connection is still alive
      await cachedDb.admin().ping();
      return { client: cachedClient, db: cachedDb };
    } catch (error) {
      // Connection is stale, reset cache and reconnect
      console.log('[MongoDB] Cached connection is stale, reconnecting...');
      const staleClient = cachedClient;
      cachedClient = null;
      cachedDb = null;
      // Close the stale connection
      try {
        await staleClient.close();
      } catch (e) {
        // Ignore errors when closing stale connection
      }
    }
  }

  // Get connection string from environment variable
  const uri = process.env.CONNECTION_STRING;
  
  if (!uri) {
    throw new Error('CONNECTION_STRING environment variable is not defined');
  }

  // Create new MongoDB client with proper SSL/TLS configuration for Vercel serverless
  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 15000, // Increased timeout for serverless cold starts
    socketTimeoutMS: 45000,
    connectTimeoutMS: 15000,
    // Connection pool options
    minPoolSize: 0,
    maxIdleTimeMS: 30000,
    // Retry configuration
    retryWrites: true,
    retryReads: true,
    // Direct connection for faster initial connection (MongoDB Atlas handles load balancing)
    directConnection: false,
  });

  // Connect to MongoDB with retry logic
  let retries = 3;
  let lastError;
  
  while (retries > 0) {
    try {
      await client.connect();
      console.log('[MongoDB] Successfully connected to DEMO database');
      break;
    } catch (error) {
      lastError = error;
      retries--;
      console.error(`[MongoDB] Connection attempt failed, ${retries} retries left:`, error.message);
      
      if (retries > 0) {
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        // Close the client if all retries failed
        await client.close().catch(() => {});
        throw new Error(`Failed to connect to MongoDB after 3 attempts: ${error.message}`);
      }
    }
  }
  
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

