import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredChatMedia } from "@/lib/chatCleanup";

export async function GET(req: NextRequest) {
  try {
    await cleanupExpiredChatMedia();
    return NextResponse.json({ success: true, message: "Chat media cleanup executed successfully" });
  } catch (error) {
    console.error("Error executing chat media cleanup:", error);
    return NextResponse.json({ error: "Failed to run cleanup" }, { status: 500 });
  }
}

