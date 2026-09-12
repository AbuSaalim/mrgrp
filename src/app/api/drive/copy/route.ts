import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import DriveItem from "@/models/DriveItem";
import { r2 } from "@/lib/r2";
import { CopyObjectCommand } from "@aws-sdk/client-s3";

async function getUniqueName(originalName: string, type: "folder" | "file", parentId: string | null) {
  const siblings = await DriveItem.find({ parentId, type });
  let name = originalName;
  let counter = 1;

  if (type === "folder") {
    while (siblings.some((s) => s.name === name)) {
      name = `${originalName} (${counter})`;
      counter++;
    }
  } else {
    const extMatch = originalName.match(/\.([^.]+)$/);
    const ext = extMatch ? `.${extMatch[1]}` : "";
    const base = extMatch ? originalName.slice(0, -ext.length) : originalName;

    while (siblings.some((s) => s.name === name)) {
      name = `${base} (${counter})${ext}`;
      counter++;
    }
  }
  return name;
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { itemId, targetParentId, department } = await req.json();

    if (!itemId) {
      return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
    }

    const sourceItem = await DriveItem.findById(itemId);
    if (!sourceItem) {
      return NextResponse.json({ error: "Source item not found" }, { status: 404 });
    }

    const bucketName = process.env.R2_BUCKET_NAME;
    if (!bucketName) {
      throw new Error("R2_BUCKET_NAME is not set");
    }

    // Prepare role and sharedWith for the target directory
    let targetRole = sourceItem.role;
    let targetSharedWith: string[] = [];

    if (targetParentId) {
      const parent = await DriveItem.findById(targetParentId);
      if (parent) {
        targetRole = parent.role;
        const allRolesToShare = new Set([...(parent.sharedWith || []), parent.role]);
        allRolesToShare.delete(targetRole);
        targetSharedWith = Array.from(allRolesToShare);
      }
    } else if (department) {
      targetRole = department;
    }

    const copiedItems: any[] = [];

    // Recursive function to deep copy folders
    const copyItem = async (item: any, currentParentId: string | null, isRoot: boolean = false) => {
      let newName = item.name;
      if (isRoot) {
        newName = await getUniqueName(item.name, item.type, currentParentId);
      }

      if (item.type === "file") {
        let newFileKey = item.url;
        
        // Deep copy the file in R2
        if (item.url) {
          const newKeyId = Math.random().toString(36).substring(2, 15);
          newFileKey = `copied-${newKeyId}-${item.name}`;
          
          try {
            const copyCmd = new CopyObjectCommand({
              Bucket: bucketName,
              CopySource: `${bucketName}/${item.url}`,
              Key: newFileKey,
            });
            await r2.send(copyCmd);
          } catch (e) {
             console.error("Failed to copy object in R2", e);
             // fallback to original url if copy fails, though not ideal
             newFileKey = item.url; 
          }
        }

        const newFile = await DriveItem.create({
          name: newName,
          type: "file",
          parentId: currentParentId,
          fileType: item.fileType,
          size: item.size,
          url: newFileKey,
          role: targetRole,
          ownerId: item.ownerId,
          sharedWith: targetSharedWith,
        });
        
        const doc = { ...newFile.toObject(), _id: newFile._id.toString(), parentId: newFile.parentId ? newFile.parentId.toString() : null };
        copiedItems.push(doc);
        return doc;

      } else if (item.type === "folder") {
        const newFolder = await DriveItem.create({
          name: newName,
          type: "folder",
          parentId: currentParentId,
          role: targetRole,
          ownerId: item.ownerId,
          sharedWith: targetSharedWith,
        });

        const doc = { ...newFolder.toObject(), _id: newFolder._id.toString(), parentId: newFolder.parentId ? newFolder.parentId.toString() : null };
        copiedItems.push(doc);

        // Fetch children and copy them recursively
        const children = await DriveItem.find({ parentId: item._id });
        for (const child of children) {
          await copyItem(child, doc._id, false);
        }

        return doc;
      }
    };

    await copyItem(sourceItem, targetParentId, true);

    return NextResponse.json({ message: "Copied successfully", copiedItems });
  } catch (error) {
    console.error("Error during copy:", error);
    return NextResponse.json({ error: "Failed to copy item" }, { status: 500 });
  }
}
