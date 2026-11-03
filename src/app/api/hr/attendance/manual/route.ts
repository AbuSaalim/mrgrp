import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import * as jose from "jose";

function parseTimeToISTDate(dateStr: string, timeStr: string): Date {
  if (timeStr.includes("T")) {
    return new Date(timeStr.endsWith("Z") || timeStr.includes("+") ? timeStr : `${timeStr}+05:30`);
  }
  const timeFormatted = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  return new Date(`${dateStr}T${timeFormatted}+05:30`);
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get("cookie")?.split("auth_token=")[1]?.split(";")[0];
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");
    await jose.jwtVerify(token, secret);

    await connectToDatabase();
    
    const body = await request.json();
    const { userId, date, inTime, outTime, hrNote } = body;

    if (!userId || !date) {
      return NextResponse.json(
        { message: "userId and date are required" },
        { status: 400 }
      );
    }

    const existingRecord = await Attendance.findOne({ userId, date });

    if (existingRecord) {
      // 1. Preserve or safely update Punch-In without wiping user's real GPS coordinates
      if (inTime) {
        const parsedInTime = parseTimeToISTDate(date, inTime);
        if (existingRecord.punchIn?.time) {
          existingRecord.punchIn.time = parsedInTime;
          // Only set fallback address if user had no real GPS coordinates
          if (!existingRecord.punchIn.location?.latitude) {
            existingRecord.punchIn.location = {
              latitude: null,
              longitude: null,
              address: existingRecord.punchIn.location?.address || "Manual HR Entry",
            };
          }
        } else {
          existingRecord.punchIn = {
            time: parsedInTime,
            location: { latitude: null, longitude: null, address: "Manual HR Entry" },
          };
        }
      }

      // 2. Handle Punch-Out safely
      if (outTime) {
        const parsedOutTime = parseTimeToISTDate(date, outTime);
        if (existingRecord.punchOut?.time && existingRecord.punchOut?.location?.latitude) {
          existingRecord.punchOut.time = parsedOutTime;
        } else {
          existingRecord.punchOut = {
            time: parsedOutTime,
            location: { latitude: null, longitude: null, address: "Manual HR Entry" },
          };
        }
      }

      existingRecord.isEditedByHR = true;
      if (hrNote !== undefined) {
        existingRecord.hrNotes = hrNote;
      }

      // Set status Present once punchOut is available
      if (existingRecord.punchOut?.time) {
        existingRecord.status = "Present";
      }

      await existingRecord.save();
      return NextResponse.json(
        { message: "Attendance updated successfully", record: existingRecord },
        { status: 200 }
      );
    } else {
      let punchInObj = undefined;
      if (inTime) {
        punchInObj = {
          time: parseTimeToISTDate(date, inTime),
          location: { latitude: null, longitude: null, address: "Manual HR Entry" },
        };
      }

      let punchOutObj = undefined;
      if (outTime) {
        punchOutObj = {
          time: parseTimeToISTDate(date, outTime),
          location: { latitude: null, longitude: null, address: "Manual HR Entry" },
        };
      }

      const newRecord = await Attendance.create({
        userId,
        date,
        ...(punchInObj && { punchIn: punchInObj }),
        ...(punchOutObj && { punchOut: punchOutObj }),
        status: punchOutObj ? "Present" : "In Progress",
        isEditedByHR: true,
        hrNotes: hrNote || "",
      });

      return NextResponse.json(
        { message: "Attendance created successfully", record: newRecord },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Manual Attendance API Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}