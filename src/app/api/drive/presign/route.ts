import { NextRequest, NextResponse } from "next/server";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/lib/r2";
import { connectToDatabase } from "@/lib/mongodb";
import * as jose from "jose";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Auth check
    const token = req.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");
    const { payload } = await jose.jwtVerify(token, secret);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { fileName, fileType } = body;

    if (!fileName || !fileType) {
      return NextResponse.json({ error: "fileName and fileType are required" }, { status: 400 });
    }

    // Unique filename for R2
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(7)}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || "mrgrp-document-module-storage",
      Key: uniqueFilename,
      ContentType: fileType,
    });

    // URL expires in 15 minutes
    const presignedUrl = await getSignedUrl(r2, command, { expiresIn: 900 });

    return NextResponse.json({
      presignedUrl,
      fileKey: uniqueFilename, // The identifier to save in DB later
    });

  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json({ error: "Failed to generate presigned URL" }, { status: 500 });
  }
}
