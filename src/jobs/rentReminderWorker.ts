import dotenv from "dotenv";
dotenv.config();

import { initRentWorker, executeRentReminderBatch } from "../lib/queue/rentQueue";

console.log("🚀 Starting StaySphere BullMQ Background Rent Reminder Worker...");

try {
  const worker = initRentWorker();
  if (worker) {
    console.log("BullMQ worker successfully connected to Redis queue.");
  } else {
    console.log("🟡 Redis not connected, running one-off direct scan...");
    executeRentReminderBatch().then(() => {
      console.log("Batch scan completed.");
    });
  }
} catch (e) {
  console.error("Worker error:", e);
}
