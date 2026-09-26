// src/app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as jose from "jose";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");
    const { payload } = await jose.jwtVerify(token, secret);
    
    await connectToDatabase();
    const user = await User.findById(payload.userId).select("name email");

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Role ko clean karna (e.g., "Store_abc@xyz.com" -> "Store")
    let baseRole = payload.role as string;
    if (baseRole.includes("Super") || baseRole.includes("System") || baseRole.includes("Admin")) {
      baseRole = "Super Admin";
    } else {
      baseRole = baseRole.split("_")[0];
    }

    return NextResponse.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: baseRole,
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }
}