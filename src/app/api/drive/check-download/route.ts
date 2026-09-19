import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import DriveItem from "@/models/DriveItem";

// Recursive function to get all descendant file sizes
async function getFolderSize(folderId: string): Promise<number> {
  const children = await DriveItem.find({ parentId: folderId });
  let totalSize = 0;
  
  for (const child of children) {
    if (child.type === "file") {
      totalSize += child.size || 0;
    } else if (child.type === "folder") {
      totalSize += await getFolderSize(child._id.toString());
    }
  }
  return totalSize;
}

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

    if (item.type === "file") {
      return NextResponse.json({ allowed: true, size: item.size || 0 });
    }

    // It's a folder, calculate total size
    const totalSize = await getFolderSize(id);
    const MAX_DOWNLOAD_SIZE_MB = 100; // 100 MB limit
    const MAX_DOWNLOAD_SIZE_BYTES = MAX_DOWNLOAD_SIZE_MB * 1024 * 1024;

    if (totalSize > MAX_DOWNLOAD_SIZE_BYTES) {
      return NextResponse.json({ 
        allowed: false, 
        size: totalSize,
        message: `Folder is too large to download at once (${(totalSize / 1024 / 1024).toFixed(2)} MB). Please open the folder and download files individually.`
      });
    }

    return NextResponse.json({ allowed: true, size: totalSize });
  } catch (error) {
    console.error("Error checking download size:", error);
    return NextResponse.json({ error: "Failed to check size" }, { status: 500 });
  }
}
