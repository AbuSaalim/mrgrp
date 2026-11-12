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
    const { workerId, action, siteName, remark, time, date } = body;

    if (!workerId || !action || !siteName) {
      return NextResponse.json({ message: "Missing required fields (workerId, action, siteName)" }, { status: 400 });
    }

    const validActions = ["IN", "TRANSFER", "OUT"];
    if (!validActions.includes(action)) {
      return NextResponse.json({ message: "Invalid action type" }, { status: 400 });
    }

    await connectToDatabase();

    const actionTime = time ? new Date(time) : new Date();
    // Strict Indian Timezone (IST: Asia/Kolkata)
    const dateStr = date || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(actionTime);

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

    // Smart shift management:
    // Sort existing logs chronologically
    const existingLogs = [...dailyLog.logs].sort(
      (a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime()
    );

    const lastLog = existingLogs.length > 0 ? existingLogs[existingLogs.length - 1] : null;

    if (action === "IN") {
      // If the last action was already IN (i.e. shift currently unclosed), 
      // the supervisor is correcting the IN time of the current shift
      if (lastLog && lastLog.action === "IN") {
        lastLog.time = actionTime;
        lastLog.siteName = siteName;
        lastLog.remark = remark || lastLog.remark;
        lastLog.updatedBy = new mongoose.Types.ObjectId(user.userId as string);
        dailyLog.logs = existingLogs;
      } else {
        // First IN of the day or new split shift after previous OUT
        dailyLog.logs.push(newLogEntry);
      }
    } else if (action === "OUT") {
      // If the last action was already OUT, update the latest OUT time
      if (lastLog && lastLog.action === "OUT") {
        lastLog.time = actionTime;
        lastLog.siteName = siteName;
        lastLog.remark = remark || lastLog.remark;
        lastLog.updatedBy = new mongoose.Types.ObjectId(user.userId as string);
        dailyLog.logs = existingLogs;
      } else {
        dailyLog.logs.push(newLogEntry);
      }
    } else {
      // TRANSFER: Always preserve transfer so all site movements are tracked
      dailyLog.logs.push(newLogEntry);
    }

    // Recalculate total hours and payment for the day based on chronological work segments
    let totalHours = 0;
    const sortedLogs = [...dailyLog.logs].sort(
      (a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime()
    );

    let currentWorkStartTime: number | null = null;

    for (const log of sortedLogs) {
      const logTime = new Date(log.time).getTime();

      if (log.action === "IN") {
        currentWorkStartTime = logTime;
      } else if (log.action === "TRANSFER") {
        // Transfer keeps worker actively working at the new site
        if (currentWorkStartTime === null) {
          currentWorkStartTime = logTime;
        }
      } else if (log.action === "OUT") {
        if (currentWorkStartTime !== null) {
          const diffInHours = (logTime - currentWorkStartTime) / (1000 * 60 * 60);
          if (diffInHours > 0) {
            totalHours += diffInHours;
          }
          currentWorkStartTime = null; // shift closed
        }
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
