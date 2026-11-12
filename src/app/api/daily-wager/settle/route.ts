import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import DailyWagerLog from "@/models/DailyWagerLog";
import * as jose from "jose";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

async function authenticate(request: Request) {
  const token = request.headers.get("cookie")?.split("auth_token=")[1]?.split(";")[0];
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");
    const { payload } = await jose.jwtVerify(token, secret);
    return payload;
  } catch (err) {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const user = await authenticate(request);
    if (!user || !user.userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { workerId, date, status } = body;

    if (!workerId || !date || !status) {
      return NextResponse.json({ message: "Missing required fields (workerId, date, status)" }, { status: 400 });
    }

    if (status !== "Paid" && status !== "Pending") {
      return NextResponse.json({ message: "Invalid status. Must be 'Paid' or 'Pending'" }, { status: 400 });
    }

    await connectToDatabase();

    const dailyLog = await DailyWagerLog.findOne({ workerId, date });
    if (!dailyLog) {
      return NextResponse.json({ message: "No daily wager record found for this worker on this date" }, { status: 404 });
    }

    dailyLog.paymentStatus = status;
    if (status === "Paid") {
      dailyLog.paidAt = new Date();
      dailyLog.paidBy = new mongoose.Types.ObjectId(user.userId as string);
    } else {
      dailyLog.paidAt = undefined;
      dailyLog.paidBy = undefined;
    }

    await dailyLog.save();

    return NextResponse.json({
      message: `Payment status marked as ${status}`,
      paymentStatus: dailyLog.paymentStatus,
      paidAt: dailyLog.paidAt,
    }, { status: 200 });

  } catch (error: any) {
    console.error("POST Daily Wager Settle Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
