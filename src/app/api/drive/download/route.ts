import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import DriveItem from "@/models/DriveItem";
import JSZip from "jszip";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Item ID is required" }, { status: 400 });
    }

    const item = await DriveItem.findById(id);
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Security check: Prevent non-Super Admin from downloading locked items
    const userRole = req.headers.get("x-user-role") || "";
    const isSuperAdmin = userRole === "Super Admin" || userRole.includes("Super") || userRole.includes("Admin");
    
    if (item.isLocked && !isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden: This item is locked by Super Admin" }, { status: 403 });
    }

    // Single File Download
    if (item.type === "file") {
      if (!item.url) {
        return NextResponse.json({ error: "File URL not found" }, { status: 404 });
      }

      const fileKey = item.url.replace(/^\/uploads\/drive\//, "");

      const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
      const { GetObjectCommand } = await import("@aws-sdk/client-s3");
      const { r2 } = await import("@/lib/r2");

      const command = new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME || "mrgrp-document-module-storage",
        Key: fileKey,
        ResponseContentDisposition: `attachment; filename="${item.name}"`,
      });

      try {
        const presignedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });
        return NextResponse.redirect(presignedUrl);
      } catch (err) {
        console.error("Error generating download URL:", err);
        return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 });
      }
    }

    // Folder Download
    if (item.type === "folder") {
      const zip = new JSZip();
      
      const { GetObjectCommand } = await import("@aws-sdk/client-s3");
      const { r2 } = await import("@/lib/r2");

      // Recursive function to add files to zip
      const addFolderToZip = async (folderId: string, currentZipFolder: JSZip) => {
        const children = await DriveItem.find({ parentId: folderId });
        
        for (const child of children) {
          if (child.type === "file") {
            if (!child.url) continue;
            const fileKey = child.url.replace(/^\/uploads\/drive\//, "");
            
            try {
              const command = new GetObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME || "mrgrp-document-module-storage",
                Key: fileKey,
              });
              const response = await r2.send(command);
              if (response.Body) {
                const byteArray = await response.Body.transformToByteArray();
                currentZipFolder.file(child.name, byteArray);
              }
            } catch (err) {
              console.error(`Failed to read file ${child.name} from R2:`, err);
              // continue without this file
            }
          } else if (child.type === "folder") {
            const subFolder = currentZipFolder.folder(child.name);
            if (subFolder) {
              await addFolderToZip(child._id.toString(), subFolder);
            }
          }
        }
      };

      await addFolderToZip(item._id.toString(), zip);

      const zipBuffer = await zip.generateAsync({ type: "uint8array" });

      return new NextResponse(zipBuffer as any, {
        headers: {
          "Content-Disposition": `attachment; filename="${item.name}.zip"`,
          "Content-Type": "application/zip",
        },
      });
    }

    return NextResponse.json({ error: "Invalid item type" }, { status: 400 });

  } catch (error) {
    console.error("Error downloading item:", error);
    return NextResponse.json({ error: "Failed to download item" }, { status: 500 });
  }
}
