import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ChatMessage from "@/models/ChatMessage";
import { pusherServer } from "@/lib/pusher";
import * as jose from "jose";
import mongoose from "mongoose";

async function getUserData(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");
    const { payload } = await jose.jwtVerify(token, secret);
    return payload;
  } catch (err) {
    return null;
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userPayload = await getUserData(req);
    if (!userPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await connectToDatabase();
    
    const message = await ChatMessage.findById(id);
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    let baseRole = userPayload.role as string;
    if (baseRole.includes("Super") || baseRole.includes("System") || baseRole.includes("Admin")) {
       baseRole = "Super Admin";
    } else {
       baseRole = baseRole.split("_")[0];
    }
    const userId = (userPayload.userId as string) || (userPayload.id as string);

    // Allow deletion if the user is the original sender OR if the user is a Super Admin
    const isSender = message.senderId.toString() === userId.toString();
    const isSuperAdmin = baseRole === "Super Admin";

    if (!isSender && !isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden: You can only delete your own messages" }, { status: 403 });
    }

    // Soft delete
    message.isDeleted = true;
    message.message = "This message was deleted";
    await message.save();

    // Broadcast delete event
    await pusherServer.trigger("global-chat", "delete-message", { id: message._id });

    return NextResponse.json({ success: true, message: "Message deleted" });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
