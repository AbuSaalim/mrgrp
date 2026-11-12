import { connectToDatabase } from "@/lib/mongodb";
import ChatMessage from "@/models/ChatMessage";
import { r2 } from "@/lib/r2";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

let lastCleanupRun = 0;

/**
 * Sweeps expired chat images (older than 24 hours / 1 day).
 * Deletes the files from Cloudflare R2 and updates the database records.
 */
export async function cleanupExpiredChatMedia() {
  const now = Date.now();
  // Throttle so cleanup runs at most once every 60 seconds
  if (now - lastCleanupRun < 60 * 1000) {
    return;
  }
  lastCleanupRun = now;

  try {
    await connectToDatabase();
    const nowIso = new Date();

    // Query messages that have an active mediaKey and have expired
    const expiredMessages = await ChatMessage.find({
      mediaKey: { $exists: true, $ne: null },
      mediaExpiresAt: { $lte: nowIso },
    }).limit(100);

    if (!expiredMessages || expiredMessages.length === 0) {
      return;
    }

    const bucketName = process.env.R2_BUCKET_NAME || "mrgrp-document-module-storage";

    for (const msg of expiredMessages) {
      if (msg.mediaKey) {
        try {
          await r2.send(
            new DeleteObjectCommand({
              Bucket: bucketName,
              Key: msg.mediaKey,
            })
          );
        } catch (r2Err) {
          console.error(`[Chat Cleanup] Failed to delete R2 file ${msg.mediaKey}:`, r2Err);
        }
      }

      // Update message record in MongoDB
      msg.mediaKey = null;
      msg.mediaUrl = null;
      msg.mediaDeleted = true;
      if (!msg.message || msg.message.trim() === "") {
        msg.message = "Photo expired and was deleted (24h limit)";
      }
      await msg.save();
    }
  } catch (error) {
    console.error("[Chat Cleanup] Error sweeping expired chat media:", error);
  }
}
