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
    const { itemId, targetRole, action } = body;
    
    if (!itemId || !targetRole || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const userRole = req.headers.get("x-user-role") || "";
    const isSuperAdmin = userRole === "Super Admin" || userRole.includes("Super") || userRole.includes("Admin");
    const baseRole = userRole.split("_")[0];

    const item = await DriveItem.findById(itemId);
    
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (!isSuperAdmin && item.role !== baseRole) {
      return NextResponse.json({ error: "Forbidden: You cannot modify permissions of files from another department" }, { status: 403 });
    }

    // Get item and all its descendants to apply the change recursively
    let idsToUpdate = [itemId];
    if (item.type === "folder") {
      const descendantIds = await getDescendantIds(itemId);
      idsToUpdate = idsToUpdate.concat(descendantIds);
    }

    if (action === "share") {
      await DriveItem.updateMany(
        { _id: { $in: idsToUpdate } },
        { $addToSet: { sharedWith: targetRole } } // $addToSet prevents duplicates
      );
    } else if (action === "unshare") {
      await DriveItem.updateMany(
        { _id: { $in: idsToUpdate } },
        { $pull: { sharedWith: targetRole } }
      );
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `Successfully ${action}d with ${targetRole}` });
  } catch (error) {
    console.error("Error sharing drive item:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
