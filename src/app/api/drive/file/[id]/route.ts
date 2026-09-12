import { NextRequest, NextResponse } from "next/server";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/lib/r2";
import { connectToDatabase } from "@/lib/mongodb";
import DriveItem from "@/models/DriveItem";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    
    // Auth checking is handled by middleware
    const item = await DriveItem.findById(id);
    if (!item || item.type !== "file" || !item.url) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // item.url stores the R2 file key
    const fileKey = item.url.replace(/^\/uploads\/drive\//, ""); // Fallback in case of old local files

    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || "mrgrp-document-module-storage",
      Key: fileKey,
    });

    const presignedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 }); // 1 hour expiry
    
    return NextResponse.redirect(presignedUrl);
  } catch (error) {
    console.error("Error generating view URL:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
