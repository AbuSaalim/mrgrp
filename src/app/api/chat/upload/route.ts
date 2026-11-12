import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/lib/r2";
import * as jose from "jose";

const MAX_IMAGE_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB limit

async function getUserPayload(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");
    const { payload } = await jose.jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const userPayload = await getUserPayload(req);
    if (!userPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    // 1 MB limit validation
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      return NextResponse.json(
        { error: `Image size must be less than 1 MB (Uploaded: ${sizeMb} MB)` },
        { status: 400 }
      );
    }

    // Image MIME type validation
    if (!file.type || !file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files (JPG, PNG, WebP) are allowed" },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueKey = `chat/${Date.now()}-${Math.random().toString(36).substring(7)}-${sanitizedName}`;

    const bucketName = process.env.R2_BUCKET_NAME || "mrgrp-document-module-storage";

    await r2.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: uniqueKey,
        Body: fileBuffer,
        ContentType: file.type,
      })
    );

    // 1 day (24 hours) expiry time
    const mediaExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return NextResponse.json({
      mediaKey: uniqueKey,
      mediaName: file.name,
      mediaType: file.type,
      mediaSize: file.size,
      mediaExpiresAt: mediaExpiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Error uploading chat image:", error);
    return NextResponse.json(
      { error: "Failed to upload image to storage" },
      { status: 500 }
    );
  }
}
