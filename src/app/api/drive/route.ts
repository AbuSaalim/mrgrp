import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import DriveItem from "@/models/DriveItem";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const tokenRole = req.headers.get("x-user-role") || "";
    const baseRole = tokenRole.split("_")[0];
    const isSuperAdmin = tokenRole === "Super Admin" || tokenRole.includes("Super") || tokenRole.includes("Admin");
    
    // Get requested department from query
    let requestedDepartment = req.nextUrl.searchParams.get("department") || baseRole;
    
    // Security check: if not super admin, strictly enforce own base role
    if (!isSuperAdmin) {
      requestedDepartment = baseRole;
    }

    const query = { 
      $or: [
        { role: requestedDepartment },
        { sharedWith: requestedDepartment }
      ]
    };

    const items = await DriveItem.find(query).lean();
    
    const ownerIds = items.map((item: any) => item.ownerId).filter(Boolean);
    const uniqueOwnerIds = [...new Set(ownerIds)];

    let userMap = new Map();
    if (uniqueOwnerIds.length > 0) {
      const users = await User.find({ _id: { $in: uniqueOwnerIds } }).select("name").lean();
      users.forEach((u: any) => userMap.set(u._id.toString(), u.name));
    }

    const mappedItems = items.map((item: any) => ({
      ...item,
      _id: item._id.toString(),
      parentId: item.parentId ? item.parentId.toString() : null,
      ownerName: item.ownerId ? userMap.get(item.ownerId.toString()) || "Unknown User" : "System",
    }));
    
    return NextResponse.json(mappedItems);
  } catch (error) {
    console.error("Error fetching drive items:", error);
    return NextResponse.json({ error: "Failed to fetch drive items" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    
    const tokenRole = req.headers.get("x-user-role") || "";
    const baseRole = tokenRole.split("_")[0];
    const isSuperAdmin = tokenRole === "Super Admin" || tokenRole.includes("Super") || tokenRole.includes("Admin");
    const ownerId = req.headers.get("x-user-id") || undefined;
    
    const { name, parentId, type, fileType, size, url, department } = body;
    
    let targetRole = department || baseRole;
    if (!isSuperAdmin) {
      targetRole = baseRole;
    }

    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 });
    }

    const finalParentId = parentId === "null" || !parentId ? null : parentId;
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
      type,
      parentId: finalParentId,
      fileType,
      size,
      url,
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
    console.error("Error creating drive item:", error);
    return NextResponse.json({ error: "Failed to create drive item" }, { status: 500 });
  }
}
