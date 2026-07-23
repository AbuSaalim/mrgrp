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

export async function GET(request: Request) {
  try {
    const user = await authenticate(request);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    // Default to today in YYYY-MM-DD
    const targetDate = dateParam || new Date().toISOString().split("T")[0];

    await connectToDatabase();

    // Fetch all active workers
    const workers = await Worker.find({ currentStatus: "Active" }).sort({ createdAt: -1 }).lean();
    
    // Fetch logs for the target date
    const logs = await DailyWagerLog.find({ date: targetDate })
      .populate("logs.updatedBy", "name email role")
      .lean();

    // Aggregate data
    const summary = workers.map((worker: any) => {
      const workerLog = logs.find((l: any) => l.workerId.toString() === worker._id.toString());
      
      let latestAction = null;
      let inTime = null;
      let outTime = null;
      let currentSite = "N/A";
      let updatedByRole = "N/A";

      if (workerLog && workerLog.logs.length > 0) {
        const sortedLogs = [...workerLog.logs].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
        
        // Find IN time
        const inLog = sortedLogs.find(l => l.action === "IN");
        if (inLog) inTime = inLog.time;
        
        // Find OUT time
        const outLog = sortedLogs.find(l => l.action === "OUT");
        if (outLog) outTime = outLog.time;

        // Latest log for current status
        const latest = sortedLogs[sortedLogs.length - 1];
        latestAction = latest.action;
        currentSite = latest.siteName;
        
        if (latest.updatedBy && (latest.updatedBy as any).name) {
          updatedByRole = (latest.updatedBy as any).name;
        } else {
          updatedByRole = "Manager";
        }
      }

      return {
        _id: worker._id,
        name: worker.name,
        skill: worker.skill,
        perHourRate: worker.perHourRate,
        currentStatus: latestAction || "NOT LOGGED IN", // IN, TRANSFER, OUT, or NOT LOGGED IN
        currentSite,
        inTime,
        outTime,
        totalHours: workerLog?.totalHoursCalculated || 0,
        totalPayment: workerLog?.totalPaymentCalculated || 0,
        updatedRole: updatedByRole,
      };
    });

    return NextResponse.json({ date: targetDate, summary }, { status: 200 });
  } catch (error: any) {
    console.error("GET Workers Summary Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
