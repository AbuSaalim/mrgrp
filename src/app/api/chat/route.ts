import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ChatMessage from "@/models/ChatMessage";
import { pusherServer } from "@/lib/pusher";
import * as jose from "jose";
import User from "@/models/User";

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
    const userPayload = await getUserData(req);
    if (!userPayload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let baseRole = userPayload.role as string;
    if (baseRole.includes("Super") || baseRole.includes("System") || baseRole.includes("Admin")) {
       baseRole = "Super Admin";
    } else {
       baseRole = baseRole.split("_")[0];
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const targetRole = searchParams.get("targetRole") || "All";
    const limit = 50;
    const skip = (page - 1) * limit;

    await connectToDatabase();
    
    let query: any = { targetRole: "All" };

    if (targetRole !== "All") {
       query = {
         $or: [
           { senderRole: baseRole, targetRole: targetRole },
           { senderRole: targetRole, targetRole: baseRole }
         ]
       };
    }

    // Fetch messages sorted by createdAt ascending (oldest first for chat UI is reversed later)
    const messages = await ChatMessage.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
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

    const { message, taggedRoles, targetRole } = await req.json();

    if (!message || message.trim() === "") {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findById(userPayload.userId || userPayload.id).select("name");
    const senderName = user?.name || "Unknown User";

    let baseRole = userPayload.role as string;
    if (baseRole.includes("Super") || baseRole.includes("System") || baseRole.includes("Admin")) {
       baseRole = "Super Admin";
    } else {
       baseRole = baseRole.split("_")[0];
    }

    const newMessage = await ChatMessage.create({
      senderId: (userPayload.userId as string) || (userPayload.id as string),
      senderName: senderName,
      senderRole: baseRole,
      message: message.trim(),
      targetRole: targetRole || "All",
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
