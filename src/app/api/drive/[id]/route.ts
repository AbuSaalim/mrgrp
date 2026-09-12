import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import DriveItem from "@/models/DriveItem";

// Recursive function to get all descendant IDs
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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    const userRole = req.headers.get("x-user-role") || "";
    const isSuperAdmin = userRole === "Super Admin" || userRole.includes("Super") || userRole.includes("Admin");
    const baseRole = userRole.split("_")[0];
    
    // Fetch first to check permissions
    const existingItem = await DriveItem.findById(id);
    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (!isSuperAdmin && existingItem.role !== baseRole) {
      return NextResponse.json({ error: "Forbidden: You cannot modify files from another department" }, { status: 403 });
    }
    
    // We can update name, parentId (for move), etc.
    const updatedData: any = {};
    if (body.name !== undefined) updatedData.name = body.name;
    if (body.parentId !== undefined) updatedData.parentId = body.parentId === "null" ? null : body.parentId;
    
    // Only Super Admin can lock/unlock
    if (body.isLocked !== undefined) {
      if (!isSuperAdmin) {
        return NextResponse.json({ error: "Forbidden: Only Super Admin can lock/unlock folders" }, { status: 403 });
      }
      updatedData.isLocked = body.isLocked;
    }

    const item = await DriveItem.findByIdAndUpdate(id, updatedData, { new: true });
    
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...item.toObject(),
      _id: item._id.toString(),
      parentId: item.parentId ? item.parentId.toString() : null,
    });
  } catch (error) {
    console.error("Error updating drive item:", error);
    return NextResponse.json({ error: "Failed to update drive item" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const userRole = req.headers.get("x-user-role") || "";
    const isSuperAdmin = userRole === "Super Admin" || userRole.includes("Super") || userRole.includes("Admin");
    const baseRole = userRole.split("_")[0];

    const item = await DriveItem.findById(id);
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (!isSuperAdmin && item.role !== baseRole) {
      return NextResponse.json({ error: "Forbidden: You cannot delete files from another department" }, { status: 403 });
    }

    // If it's a folder, we should also delete all descendants
    let idsToDelete = [id];
    if (item.type === "folder") {
      const descendantIds = await getDescendantIds(id);
      idsToDelete = idsToDelete.concat(descendantIds);
    }

    // Fetch all items to get their URLs before deleting
    const itemsToDelete = await DriveItem.find({ _id: { $in: idsToDelete } });

    // Delete files from Cloudflare R2
    if (itemsToDelete.some(item => item.type === "file" && item.url)) {
      const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
      const { r2 } = await import("@/lib/r2");
      
      for (const itemToDelete of itemsToDelete) {
        if (itemToDelete.type === "file" && itemToDelete.url) {
          try {
            // Check if it's an R2 key or old local file path
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

    await DriveItem.deleteMany({ _id: { $in: idsToDelete } });

    return NextResponse.json({ success: true, deletedIds: idsToDelete });
  } catch (error) {
    console.error("Error deleting drive item:", error);
    return NextResponse.json({ error: "Failed to delete drive item" }, { status: 500 });
  }
}
