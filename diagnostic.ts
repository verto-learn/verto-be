#!/usr/bin/env ts-node
/**
 * Redis Connection Diagnostic Script
 * Run this to check if Redis is working properly
 */

// Load environment variables from .env before importing app modules
import 'dotenv/config';
import config from "./src/config/config";
import { chapterQueue } from "./src/shared/chapterQueue";

console.log("\n========== REDIS CONNECTION DIAGNOSTIC ==========\n");

console.log("📋 Configuration:");
console.log(`   Host: ${config.redisHost}`);
console.log(`   Port: ${config.redisPort}`);
console.log(`   Username: ${config.redisUsername}`);
console.log(`   Password: ${"*".repeat(config.redisPassword.length)}`);
console.log(`   DB: ${config.redisDb}\n`);

const testConnection = async () => {
  try {
    console.log("🔍 Testing queue connection...");
    
    // Check if queue client can ping
    const pong = await chapterQueue.client.ping();
    console.log(`✅ Ping response: ${pong}`);
    
    // Check queue info
    const count = await chapterQueue.count();
    console.log(`✅ Queue count: ${count} jobs`);
    
    // Check delayed jobs
    const delayed = await chapterQueue.getDelayedCount();
    console.log(`✅ Delayed jobs: ${delayed}`);
    
    // Check failed jobs
    const failed = await chapterQueue.getFailedCount();
    console.log(`✅ Failed jobs: ${failed}`);
    
    // Check completed jobs
    const completed = await chapterQueue.getCompletedCount();
    console.log(`✅ Completed jobs: ${completed}`);
    
    console.log("\n✅ All tests passed! Redis is connected properly.\n");
    
    await chapterQueue.close();
    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Connection test failed!");
    console.error(`Error: ${error.message}`);
    console.error("\nPossible issues:");
    console.error("1. Redis server is not running");
    console.error("2. Wrong Redis credentials in .env");
    console.error("3. Network connectivity issue");
    console.error("4. Redis port is blocked by firewall\n");
    
    try {
      await chapterQueue.close();
    } catch (e) {}
    process.exit(1);
  }
};

testConnection();
