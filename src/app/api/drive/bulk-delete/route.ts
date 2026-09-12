import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import DriveItem from "@/models/DriveItem";

async function getDescendantIds(parentId: string): Promise<string[]> {
  const children = await DriveItem.find({ parentId });
  let ids: string[] = [];
  
  for (const child of children) {
    ids.push(child._id.toString());
    if (child.type === "folder") {
      const descendantIds = await getDescendantIds(child._id.toString());
      ids = ids.concat(descendantIds);
    }
  }
  return ids;
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await req.json();
    const { ids } = body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No items selected" }, { status: 400 });
    }

    const userRole = req.headers.get("x-user-role") || "";
    const isSuperAdmin = userRole === "Super Admin" || userRole.includes("Super") || userRole.includes("Admin");
    const baseRole = userRole.split("_")[0];

    const items = await DriveItem.find({ _id: { $in: ids } });
    
    if (items.length === 0) {
      return NextResponse.json({ error: "No items found" }, { status: 404 });
    }

    // Verify permissions
    for (const item of items) {
      if (!isSuperAdmin && item.role !== baseRole) {
        return NextResponse.json({ error: "Forbidden: You cannot delete files from another department" }, { status: 403 });
      }
    }

    let allIdsToDelete = [...ids];
    
    // Find all descendants for any folders being deleted
    for (const item of items) {
      if (item.type === "folder") {
        const descendantIds = await getDescendantIds(item._id.toString());
        allIdsToDelete = allIdsToDelete.concat(descendantIds);
      }
    }

    // Remove duplicates if any
    const uniqueIdsToDelete = [...new Set(allIdsToDelete)];

    const allItemsToDelete = await DriveItem.find({ _id: { $in: uniqueIdsToDelete } });

    // Delete files from Cloudflare R2
    if (allItemsToDelete.some(item => item.type === "file" && item.url)) {
      const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
      const { r2 } = await import("@/lib/r2");

      for (const itemToDelete of allItemsToDelete) {
        if (itemToDelete.type === "file" && itemToDelete.url) {
          try {
            const fileKey = itemToDelete.url.replace(/^\/uploads\/drive\//, "");
            const command = new DeleteObjectCommand({
              Bucket: process.env.R2_BUCKET_NAME || "mrgrp-document-module-storage",
              Key: fileKey,
            });
            await r2.send(command);
          } catch (err) {
            console.error("Failed to delete file from R2:", err);
          }
        }
      }
    }

    await DriveItem.deleteMany({ _id: { $in: uniqueIdsToDelete } });

    return NextResponse.json({ success: true, deletedIds: uniqueIdsToDelete });
  } catch (error) {
    console.error("Error bulk deleting drive items:", error);
    return NextResponse.json({ error: "Failed to delete items" }, { status: 500 });
  }
}
