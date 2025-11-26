import mongoose from "mongoose";
import { fetchRssFeeds } from "./rssServer.mjs";
import { NewsArticle } from "./generalServer.mjs";

// Development script for manually fetching RSS feeds
// Run this file when you want to manually update news sources during development

async function manualRssFetch() {
  try {
    console.log("=== MANUAL RSS FETCH INITIATED ===");
    console.log("Connecting to MongoDB...");

    // Connect to MongoDB
    await mongoose.connect(process.env.CONNECTION_STRING, {
      retryWrites: true,
      retryReads: true,
    });

    console.log("MongoDB connected successfully");
    console.log("Starting manual RSS feed fetch...");

    // Fetch RSS feeds
    const { stats, executionTime } = await fetchRssFeeds();

    console.log("=== MANUAL RSS FETCH COMPLETED ===");
    console.log(`Execution time: ${(executionTime / 1000).toFixed(2)} seconds`);
    console.log(`Fetched ${stats.newArticles} new articles:`);

    // Log articles per source
    for (const [url, count] of Object.entries(stats.sources)) {
      if (count > 0) {
        console.log(`- ${count} articles from ${url}`);
      }
    }

    console.log(`Skipped ${stats.skipped} articles (already exist).`);
    console.log(`Encountered ${stats.errors} errors during fetch/save.`);

    // Show total article count
    const totalArticles = await NewsArticle.countDocuments();
    console.log(`Total articles in database: ${totalArticles}`);
  } catch (error) {
    console.error("Error during manual RSS fetch:", error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
    process.exit(0);
  }
}

// Run the manual fetch
manualRssFetch();
