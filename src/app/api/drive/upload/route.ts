import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import DriveItem from "@/models/DriveItem";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await req.json();
    const { fileKey, name, parentId, department, fileType, size } = body;
    
    if (!fileKey || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const finalParentId = parentId === "null" || !parentId ? null : parentId;

    const tokenRole = req.headers.get("x-user-role") || "";
    const baseRole = tokenRole.split("_")[0];
    const isSuperAdmin = tokenRole === "Super Admin" || tokenRole.includes("Super") || tokenRole.includes("Admin");
    const ownerId = req.headers.get("x-user-id") || undefined;

    let targetRole = department || baseRole;
    if (!isSuperAdmin) {
      targetRole = baseRole;
    }

    let sharedWith: string[] = [];
    if (finalParentId) {
      const parent = await DriveItem.findById(finalParentId);
      if (parent) {
        const parentSharedWith = parent.sharedWith || [];
        const allRolesToShare = new Set([...parentSharedWith, parent.role]);
        allRolesToShare.delete(targetRole); // The creator owns it, doesn't need it in sharedWith
        sharedWith = Array.from(allRolesToShare);
      }
    }

    const newItem = await DriveItem.create({
      name,
      type: "file",
      parentId: finalParentId,
      fileType,
      size,
      url: fileKey, // Store the R2 Key as the URL
      role: targetRole,
      ownerId,
      sharedWith,
    });
    
    return NextResponse.json({
      ...newItem.toObject(),
      _id: newItem._id.toString(),
      parentId: newItem.parentId ? newItem.parentId.toString() : null,
    });

  } catch (error) {
    console.error("Error creating file record:", error);
    return NextResponse.json({ error: "Failed to create file record" }, { status: 500 });
  }
}
