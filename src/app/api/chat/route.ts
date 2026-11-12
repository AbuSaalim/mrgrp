import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ChatMessage from "@/models/ChatMessage";
import { pusherServer } from "@/lib/pusher";
import * as jose from "jose";
import User from "@/models/User";
import { cleanupExpiredChatMedia } from "@/lib/chatCleanup";

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
    const targetUserId = searchParams.get("targetUserId");
    const currentUserId = (userPayload.userId || userPayload.id) as string;
    const limit = 50;
    const skip = (page - 1) * limit;

    await connectToDatabase();
    
    let query: any = { targetRole: "All", targetUserId: null };

    if (targetUserId) {
      // 1-on-1 Direct Messaging query between current user and target user
      query = {
        $or: [
          { senderId: currentUserId, targetUserId: targetUserId },
          { senderId: targetUserId, targetUserId: currentUserId },
        ],
      };
    } else if (targetRole !== "All") {
      // Department channel query
      query = {
        targetUserId: null,
        $or: [
          { senderRole: baseRole, targetRole: targetRole },
          { senderRole: targetRole, targetRole: baseRole },
        ],
      };
    }

    // Trigger background sweep for expired chat photos (> 24 hours)
    cleanupExpiredChatMedia().catch(console.error);

    // Fetch messages sorted by createdAt ascending (oldest first for chat UI is reversed later)
    const rawMessages = await ChatMessage.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const now = Date.now();
    const sanitizedMessages = rawMessages.map((msg: any) => {
      if (
        msg.mediaKey &&
        msg.mediaExpiresAt &&
        new Date(msg.mediaExpiresAt).getTime() <= now
      ) {
        return {
          ...msg,
          mediaKey: null,
          mediaUrl: null,
          mediaDeleted: true,
          message: msg.message || "Photo expired and was deleted (24h limit)",
        };
      }
      return msg;
    });
    
    return NextResponse.json(sanitizedMessages.reverse());
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

    const {
      message,
      taggedRoles,
      targetRole,
      targetUserId,
      targetUserName,
      mediaKey,
      mediaName,
      mediaType,
      mediaSize,
    } = await req.json();

    const trimmedMsg = message ? message.trim() : "";

    if (!trimmedMsg && !mediaKey) {
      return NextResponse.json({ error: "Message or image is required" }, { status: 400 });
    }

    await connectToDatabase();
    const currentUserId = (userPayload.userId as string) || (userPayload.id as string);
    const user = await User.findById(currentUserId).select("name");
    const senderName = user?.name || "Unknown User";

    let baseRole = userPayload.role as string;
    if (baseRole.includes("Super") || baseRole.includes("System") || baseRole.includes("Admin")) {
       baseRole = "Super Admin";
    } else {
       baseRole = baseRole.split("_")[0];
    }

    let recipientName = targetUserName;
    if (targetUserId && !recipientName) {
      const recipient = await User.findById(targetUserId).select("name");
      recipientName = recipient?.name || "Direct Message";
    }

    // Auto-expiry exactly 24 hours (1 day) from send time
    const mediaExpiresAt = mediaKey ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;

    const newMessage = await ChatMessage.create({
      senderId: currentUserId,
      senderName: senderName,
      senderRole: baseRole,
      message: trimmedMsg,
      targetRole: targetUserId ? "DM" : (targetRole || "All"),
      targetUserId: targetUserId || null,
      targetUserName: recipientName || null,
      taggedRoles: Array.isArray(taggedRoles) ? taggedRoles : [],
      mediaKey: mediaKey || null,
      mediaUrl: mediaKey ? `/api/chat/media/${mediaKey}` : null,
      mediaName: mediaName || null,
      mediaType: mediaType || null,
      mediaSize: mediaSize || null,
      mediaExpiresAt: mediaExpiresAt,
      mediaDeleted: false,
    });

    // Broadcast to Pusher
    await pusherServer.trigger("global-chat", "new-message", newMessage);

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
