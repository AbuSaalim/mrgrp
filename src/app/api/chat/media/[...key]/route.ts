import { NextRequest, NextResponse } from "next/server";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/lib/r2";
import { connectToDatabase } from "@/lib/mongodb";
import ChatMessage from "@/models/ChatMessage";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const { key } = await params;
    const fullKey = Array.isArray(key) ? key.join("/") : key;

    if (!fullKey) {
      return new NextResponse("Not Found", { status: 404 });
    }

    await connectToDatabase();
    const bucketName = process.env.R2_BUCKET_NAME || "mrgrp-document-module-storage";

    // Check message expiry in database
    const message = await ChatMessage.findOne({ mediaKey: fullKey });
    if (message) {
      const isExpired =
        message.isDeleted ||
        message.mediaDeleted ||
        (message.mediaExpiresAt && new Date(message.mediaExpiresAt).getTime() <= Date.now());

      if (isExpired) {
        // Ensure deleted from Cloudflare R2
        try {
          await r2.send(
            new DeleteObjectCommand({
              Bucket: bucketName,
              Key: fullKey,
            })
          );
        } catch {}

        message.mediaKey = null;
        message.mediaUrl = null;
        message.mediaDeleted = true;
        await message.save();

        return new NextResponse("Photo expired and was deleted (24h limit)", { status: 410 });
      }
    }

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fullKey,
    });

    const presignedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });

    return NextResponse.redirect(presignedUrl, {
      headers: {
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error serving chat media:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

