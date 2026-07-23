import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import DailyWagerLog from "@/models/DailyWagerLog";
import Worker from "@/models/Worker";
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
    if (!user || !user.userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { workerId, action, siteName, remark, time } = body;

    if (!workerId || !action || !siteName) {
      return NextResponse.json({ message: "Missing required fields (workerId, action, siteName)" }, { status: 400 });
    }

    const validActions = ["IN", "TRANSFER", "OUT"];
    if (!validActions.includes(action)) {
      return NextResponse.json({ message: "Invalid action type" }, { status: 400 });
    }

    await connectToDatabase();

    const actionTime = time ? new Date(time) : new Date();
    // Use local date formatting (e.g., IST) or stick to UTC based on your app's timezone requirements. 
    // Here we use a simple ISO slice for YYYY-MM-DD based on the actionTime.
    const dateStr = actionTime.toISOString().split("T")[0];

    // Find the worker to ensure they exist and to get their perHourRate if needed
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return NextResponse.json({ message: "Worker not found" }, { status: 404 });
    }

    // Upsert the daily log document
    let dailyLog = await DailyWagerLog.findOne({ workerId, date: dateStr });

    if (!dailyLog) {
      dailyLog = new DailyWagerLog({
        workerId,
        date: dateStr,
        logs: [],
        totalHoursCalculated: 0,
        totalPaymentCalculated: 0,
      });
    }

    const newLogEntry = {
      time: actionTime,
      action,
      siteName,
      updatedBy: new mongoose.Types.ObjectId(user.userId as string),
      remark: remark || "",
    };

    // Ensure only one log entry per action type for the day to match the UI's 1-shift constraint
    // This cleans up any duplicates and fixes chronological calculation bugs
    const filteredLogs = dailyLog.logs.filter((l: any) => l.action !== action);
    filteredLogs.push(newLogEntry);
    dailyLog.logs = filteredLogs;

    // Recalculate total hours and payment for the day based on all IN and OUT pairs
    let totalHours = 0;
    
    // Sort logs chronologically to accurately pair INs and OUTs
    const sortedLogs = [...dailyLog.logs].sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime());
    
    let lastInTime: number | null = null;
    
    for (const log of sortedLogs) {
      if (log.action === "IN") {
        lastInTime = new Date(log.time).getTime();
      } else if (log.action === "OUT" && lastInTime !== null) {
        const outTime = new Date(log.time).getTime();
        const diffInHours = (outTime - lastInTime) / (1000 * 60 * 60);
        if (diffInHours > 0) {
          totalHours += diffInHours;
        }
        lastInTime = null; // Reset to await next IN
      }
    }

    const totalPayment = totalHours * (worker.perHourRate || 0);
    dailyLog.totalHoursCalculated = Number(totalHours.toFixed(2));
    dailyLog.totalPaymentCalculated = Number(totalPayment.toFixed(2));

    await dailyLog.save();

    return NextResponse.json({ message: `Log ${action} recorded successfully`, log: dailyLog }, { status: 201 });
  } catch (error: any) {
    console.error("POST Daily Wager Log Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
