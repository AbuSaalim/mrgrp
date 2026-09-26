import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as jose from "jose";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");
    const { payload } = await jose.jwtVerify(token, secret);

    let baseRole = payload.role as string;
    if (baseRole.includes("Super") || baseRole.includes("System") || baseRole.includes("Admin")) {
       baseRole = "Super Admin";
    } else {
       baseRole = baseRole.split("_")[0];
    }

    const { targetRole, isTyping } = await req.json();

    await pusherServer.trigger("global-chat", "user-typing", {
      senderRole: baseRole,
      targetRole,
      isTyping
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
