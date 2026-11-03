import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import User from "@/models/User";
import Leave from "@/models/Leave";
import * as jose from "jose";

function parseTimeToISTDate(dateStr: string, timeStr: string): Date {
  if (timeStr.includes("T")) {
    return new Date(timeStr.endsWith("Z") || timeStr.includes("+") ? timeStr : `${timeStr}+05:30`);
  }
  const timeFormatted = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  return new Date(`${dateStr}T${timeFormatted}+05:30`);
}

export async function GET(request: Request) {
  try {
    const token = request.headers.get("cookie")?.split("auth_token=")[1]?.split(";")[0];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");
    await jose.jwtVerify(token, secret);

    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const queryDate = dateParam || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    
    // 1. Fetch punched attendances for queryDate
    const attendances = await Attendance.find({ date: queryDate })
      .populate({
        path: "userId",
        select: "name role",
        populate: { path: "role", select: "name" },
      })
      .sort({ createdAt: -1 })
      .lean();

    const punchedUserIds = new Set<string>();

    const formattedAttendances = attendances.map((att: any) => {
      if (att.userId) {
        const uId = (att.userId._id || att.userId).toString();
        punchedUserIds.add(uId);

        let roleName = "Staff";
        if (att.userId.role && typeof att.userId.role === "object" && att.userId.role.name) {
          roleName = att.userId.role.name;
        } else if (typeof att.userId.role === "string") {
          roleName = att.userId.role;
        }
        return {
          ...att,
          userId: {
            ...att.userId,
            role: roleName,
          },
        };
      }
      return att;
    });

    // 2. Fetch all active users to show absent/unpunched employees as well
    const allActiveUsers = await User.find({ isActive: true })
      .populate({ path: "role", select: "name" })
      .select("name role")
      .lean();

    // 3. Check approved leaves for this date
    const leavesToday = await Leave.find({ date: queryDate, status: "Approved" }).lean();
    const leaveUserMap = new Map(leavesToday.map((l: any) => [l.userId.toString(), l]));

    const missingEmployees: any[] = [];
    for (const u of allActiveUsers) {
      const uIdStr = u._id.toString();
      if (!punchedUserIds.has(uIdStr)) {
        let roleName = "Staff";
        const populatedRole = (u as any).role;
        if (populatedRole && typeof populatedRole === "object" && populatedRole.name) {
          roleName = populatedRole.name;
        } else if (typeof populatedRole === "string") {
          roleName = populatedRole;
        }

        // Exclude Super Admin from daily staff attendance table
        if (roleName.includes("Super") || roleName.includes("Admin")) {
          continue;
        }

        const leave = leaveUserMap.get(uIdStr);
        missingEmployees.push({
          _id: uIdStr,
          userId: {
            _id: uIdStr,
            name: u.name,
            role: roleName,
          },
          date: queryDate,
          status: leave ? `On Leave (${leave.type})` : "Absent",
          punchIn: null,
          punchOut: null,
          isEditedByHR: false,
          hrNotes: leave ? `Approved Leave: ${leave.reason || leave.type}` : "Not checked in",
        });
      }
    }

    return NextResponse.json({ attendances: [...formattedAttendances, ...missingEmployees] });
  } catch (error) {
    return NextResponse.json({ message: "Error fetching attendance" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const token = request.headers.get("cookie")?.split("auth_token=")[1]?.split(";")[0];
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");
    await jose.jwtVerify(token, secret);

    await connectToDatabase();
    const body = await request.json();
    const { recordId, id, _id, date, punchInTime, punchOutTime, status, hrNotes } = body;
    const targetId = recordId || id || _id;

    if (!targetId) {
      return NextResponse.json({ message: "Record ID is required" }, { status: 400 });
    }

    let existingRecord = await Attendance.findById(targetId);
    const recordDate = date || (existingRecord ? existingRecord.date : new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date()));

    // If existing record was not found, targetId might be a userId for an unpunched/absent staff
    if (!existingRecord) {
      const userDoc = await User.findById(targetId);
      if (userDoc) {
        existingRecord = await Attendance.create({
          userId: userDoc._id,
          date: recordDate,
          status: status || "Present",
          isEditedByHR: true,
          hrNotes: hrNotes || "Created via HR Dashboard",
        });
      } else {
        return NextResponse.json({ message: "Attendance record not found" }, { status: 404 });
      }
    }
    const updateData: any = {};

    if (date) updateData.date = date;

    // Update the status field to whatever is passed in the request body
    if (status !== undefined) {
      updateData.status = status;
    }

    // When HR updates a record's in/out time, strictly set isEditedByHR: true
    let isTimeUpdated = false;

    if (punchInTime !== undefined) {
      isTimeUpdated = true;
      if (punchInTime !== "") {
        updateData["punchIn.time"] = parseTimeToISTDate(recordDate, punchInTime);
        if (!existingRecord.punchIn?.location?.latitude) {
          updateData["punchIn.location.address"] = "Manually adjusted by HR";
        }
      } else {
        updateData["punchIn.time"] = null;
      }
    }

    if (punchOutTime !== undefined) {
      isTimeUpdated = true;
      if (punchOutTime !== "") {
        updateData["punchOut.time"] = parseTimeToISTDate(recordDate, punchOutTime);
        if (!existingRecord.punchOut?.location?.latitude) {
          updateData["punchOut.location.address"] = "Manually adjusted by HR";
        }
      } else {
        updateData["punchOut.time"] = null;
      }
    }

    if (isTimeUpdated || hrNotes !== undefined || status !== undefined || date !== undefined) {
      updateData.isEditedByHR = true;
    }

    if (hrNotes !== undefined) {
      updateData.hrNotes = hrNotes;
    } else if (!existingRecord.hrNotes && updateData.isEditedByHR) {
      updateData.hrNotes = "Fixed via HR Dashboard";
    }

    const updatedRecord = await Attendance.findByIdAndUpdate(
      targetId,
      { $set: updateData },
      { new: true }
    ).populate({
      path: "userId",
      select: "name role",
      populate: { path: "role", select: "name" },
    });

    return NextResponse.json({ message: "Attendance corrected successfully", record: updatedRecord });
  } catch (error: any) {
    return NextResponse.json({ message: "Error updating attendance", error: error.message }, { status: 500 });
  }
}