import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import UserLeaveBalance from "@/models/UserLeaveBalance";
import User from "@/models/User";
import * as jose from "jose";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("cookie")?.split("auth_token=")[1]?.split(";")[0];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");
    const { payload } = await jose.jwtVerify(token, secret);
    
    // Only HR and Super Admin should access this
    const roleStr = payload.role as string;
    if (!roleStr || (!roleStr.includes("HR") && !roleStr.includes("Super"))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const currentYear = yearParam ? parseInt(yearParam) : new Date().getFullYear();

    await connectToDatabase();

    // Fetch all active users
    const users = await User.find({ isActive: true }).select("name email role").lean();
    
    // Fetch all leave balances for the given year
    const balances = await UserLeaveBalance.find({ year: currentYear }).lean();

    const result = users.map((u: any) => {
      const userBalance = balances.find((b: any) => b.userId.toString() === u._id.toString());
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        allocated: userBalance ? userBalance.allocated : {},
      };
    });

    return NextResponse.json({ year: currentYear, allocations: result }, { status: 200 });
  } catch (error: any) {
    console.error("GET Leave Allocations Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get("cookie")?.split("auth_token=")[1]?.split(";")[0];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");
    const { payload } = await jose.jwtVerify(token, secret);
    
    const roleStr = payload.role as string;
    if (!roleStr || (!roleStr.includes("HR") && !roleStr.includes("Super"))) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { targetUserId, year, type, incrementBy, amount, mode = "adjust" } = body;
    const valueToUse = amount !== undefined ? parseFloat(amount) : (incrementBy !== undefined ? parseFloat(incrementBy) : 0);

    if (!targetUserId || !year || !type) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    await connectToDatabase();

    // Find existing balance doc
    let userBalanceDoc = await UserLeaveBalance.findOne({
      userId: targetUserId,
      year: parseInt(year),
    });

    if (!userBalanceDoc) {
      const initialVal = mode === "set" ? Math.max(0, valueToUse) : Math.max(0, valueToUse);
      userBalanceDoc = new UserLeaveBalance({
        userId: targetUserId,
        year: parseInt(year),
        allocated: { [type]: initialVal }
      });
    } else {
      if (mode === "set") {
        userBalanceDoc.allocated.set(type, Math.max(0, valueToUse));
      } else {
        const currentVal = userBalanceDoc.allocated.get(type) || 0;
        userBalanceDoc.allocated.set(type, Math.max(0, currentVal + valueToUse));
      }
    }

    await userBalanceDoc.save();

    return NextResponse.json({ message: "Leave allocated successfully", updatedBalance: userBalanceDoc }, { status: 200 });
  } catch (error: any) {
    console.error("POST Leave Allocations Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
