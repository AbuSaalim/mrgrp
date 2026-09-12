const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://83b50ce2c1fa5fde18a72aec4cb65b9a.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: "81b6a4f96941583786e6d0edaec61210",
    secretAccessKey: "55b77619d05075451bef8b55a13e2e72fba386a778ab124d8e2426a58387ece8",
  },
});

async function run() {
  try {
    console.log("Generating presigned URL...");
    const command = new PutObjectCommand({
      Bucket: "mrgrp-document-module-storage",
      Key: "test-upload.txt",
      ContentType: "text/plain",
    });
    
    const url = await getSignedUrl(r2, command, { expiresIn: 60 });
    console.log("Generated URL:", url);
    
    console.log("Uploading file via Node fetch...");
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "text/plain" },
      body: "Hello from R2 test!"
    });
    
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Upload failed: ${res.status} ${text}`);
    }
    
    console.log("Upload successful!");
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
