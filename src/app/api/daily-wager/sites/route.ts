import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import DailyWagerLog from "@/models/DailyWagerLog";
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

    await connectToDatabase();

    // Distinct site names from existing logs
    const distinctSites: string[] = await DailyWagerLog.distinct("logs.siteName");
    
    // Clean and filter
    const sites = distinctSites
      .map((s: any) => (typeof s === "string" ? s.trim() : ""))
      .filter((s: string) => s && s.length > 0 && s !== "N/A" && s !== "Unknown Site");

    // Default suggestions if none yet recorded
    const fallbackSites = ["Site A", "Site B", "Tower 1", "Tower 2", "Main Gate", "Workshop"];
    const combined = Array.from(new Set([...sites, ...fallbackSites])).sort();

    return NextResponse.json({ sites: combined }, { status: 200 });
  } catch (error: any) {
    console.error("GET Daily Wager Sites Error:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}

