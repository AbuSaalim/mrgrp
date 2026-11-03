import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import * as jose from "jose";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("cookie")?.split("auth_token=")[1]?.split(";")[0];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");
    const { payload } = await jose.jwtVerify(token, secret);
    const userId = payload.userId;

    const body = await request.json();
    const { action, location } = body; // action: "IN" | "OUT"

    if (!location || !location.latitude || !location.longitude) {
      return NextResponse.json({ message: "Location coordinates are required!" }, { status: 400 });
    }

    await connectToDatabase();
    // Strict IST Timezone
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    const currentTime = new Date();

    // Auto-resolve any past unclosed shifts to "Missed Out"
    await Attendance.updateMany(
      { userId, date: { $lt: today }, status: "In Progress" },
      { $set: { status: "Missed Out" } }
    );

    if (action === "IN") {
      const existing = await Attendance.findOne({ userId, date: today });
      if (existing && existing.punchIn?.time) {
        return NextResponse.json(
          { message: "You have already punched in for today!", record: existing },
          { status: 400 }
        );
      }

      const newRecord = await Attendance.findOneAndUpdate(
        { userId, date: today },
        {
          punchIn: { time: currentTime, location },
          status: "In Progress"
        },
        { new: true, upsert: true }
      );
      return NextResponse.json({ message: "Punched IN successfully", record: newRecord });
    } 
    else if (action === "OUT") {
      const existing = await Attendance.findOne({ userId, date: today });
      if (!existing || !existing.punchIn?.time) {
        return NextResponse.json(
          { message: "You must punch in first before punching out!" },
          { status: 400 }
        );
      }

      if (existing.punchOut?.time) {
        return NextResponse.json(
          { message: "You have already punched out for today!", record: existing },
          { status: 400 }
        );
      }

      existing.punchOut = { time: currentTime, location };
      existing.status = "Present";
      await existing.save();

      return NextResponse.json({ message: "Punched OUT successfully", record: existing });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("PUNCH API ERROR:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}