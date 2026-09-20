import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ChatMessage from "@/models/ChatMessage";
import { pusherServer } from "@/lib/pusher";
import * as jose from "jose";

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

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Fetch last 100 messages sorted by createdAt ascending (oldest first for chat UI)
    const messages = await ChatMessage.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    
    return NextResponse.json(messages.reverse());
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userPayload = await getUserData(req);
    if (!userPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, taggedRoles } = await req.json();

    if (!message || message.trim() === "") {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

    await connectToDatabase();

    const senderRole = (userPayload.role as string) || "User";
    
    // Strip "Admin" or "Super Admin" and normalize if needed, but since we are tagging roles, we use base role
    // For simplicity, we just use the role from JWT directly, or split by underscore if it's "Department_Role"
    let baseRole = senderRole;
    if (senderRole !== "Super Admin" && senderRole !== "Admin") {
       baseRole = senderRole.split("_")[0];
    }

    const newMessage = await ChatMessage.create({
      senderId: (userPayload.userId as string) || (userPayload.id as string),
      senderName: (userPayload.name as string) || "Unknown User",
      senderRole: baseRole,
      message: message.trim(),
      taggedRoles: Array.isArray(taggedRoles) ? taggedRoles : [],
    });

    // Broadcast to Pusher
    await pusherServer.trigger("global-chat", "new-message", newMessage);

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
