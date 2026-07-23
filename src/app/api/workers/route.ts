import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Worker from "@/models/Worker";
import * as jose from "jose";

export const dynamic = "force-dynamic";

// Helper for auth (optional, based on your app's structure)
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

    await connectToDatabase();
    
    // Fetch all workers
    const workers = await Worker.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ workers }, { status: 200 });
  } catch (error: any) {
    console.error("GET Workers Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await authenticate(request);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, skill, perHourRate, currentStatus, phoneNumber } = body;

    if (!name || !skill || !perHourRate) {
      return NextResponse.json({ message: "Missing required fields (name, skill, perHourRate)" }, { status: 400 });
    }

    await connectToDatabase();

    const newWorker = new Worker({
      name,
      skill,
      perHourRate: parseFloat(perHourRate),
      currentStatus: currentStatus || "Active",
      phoneNumber,
    });

    await newWorker.save();

    return NextResponse.json({ message: "Worker added successfully", worker: newWorker }, { status: 201 });
  } catch (error: any) {
    console.error("POST Worker Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}
