import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Worker from "@/models/Worker";
import DailyWagerLog from "@/models/DailyWagerLog";
import User from "@/models/User"; // Ensure User is loaded for populate
import * as jose from "jose";

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

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await authenticate(request);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const resolvedParams = await context.params;
    const workerId = resolvedParams.id;
    if (!workerId) {
      return NextResponse.json({ message: "Worker ID is required" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const targetDate = dateParam || new Date().toISOString().split("T")[0];

    await connectToDatabase();

    const worker = await Worker.findById(workerId).lean();
    if (!worker) {
      return NextResponse.json({ message: "Worker not found" }, { status: 404 });
    }

    const dailyLog = await DailyWagerLog.findOne({ workerId, date: targetDate })
      .populate("logs.updatedBy", "name email role")
      .lean();

    // Sort logs chronologically
    let sortedLogs = [];
    if (dailyLog && dailyLog.logs) {
      sortedLogs = dailyLog.logs.sort(
        (a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime()
      );
    }

    // Calculate Monthly Summary
    const targetMonth = targetDate.substring(0, 7);
    const monthlyLogs = await DailyWagerLog.find({
      workerId,
      date: { $regex: `^${targetMonth}` }
    }).lean();

    const monthlySummary = monthlyLogs.reduce((acc: any, log: any) => {
      return {
        totalHours: acc.totalHours + (log.totalHoursCalculated || 0),
        totalPayment: acc.totalPayment + (log.totalPaymentCalculated || 0),
      };
    }, { totalHours: 0, totalPayment: 0 });

    return NextResponse.json({
      worker,
      date: targetDate,
      logSummary: {
        totalHours: dailyLog?.totalHoursCalculated || 0,
        totalPayment: dailyLog?.totalPaymentCalculated || 0,
        logs: sortedLogs,
      },
      monthlySummary,
    }, { status: 200 });

  } catch (error: any) {
    console.error("GET Worker Details Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
