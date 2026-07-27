// src/app/api/auth/login-challenge/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { generateAuthenticationOptions } from "@simplewebauthn/server";

function toBase64Url(val: any): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (val._bsontype === "Binary" && typeof val.value === "function") {
    return Buffer.from(val.value(true)).toString("base64url");
  }
  if (val instanceof Uint8Array || Buffer.isBuffer(val)) {
    return Buffer.from(val).toString("base64url");
  }
  if (val.buffer) {
    return Buffer.from(val.buffer).toString("base64url");
  }
  return Buffer.from(val).toString("base64url");
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { message: "Email is required to generate login challenge." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return NextResponse.json(
        { message: "Invalid credentials or disabled account." },
        { status: 401 }
      );
    }

    if (!user.passkeys || user.passkeys.length === 0) {
      return NextResponse.json(
        { hasPasskeys: false, message: "No biometrics/passkeys registered for this account." },
        { status: 400 }
      );
    }

    const allowCredentials = user.passkeys.map((pk: any) => ({
      id: toBase64Url(pk.credentialID),
      type: "public-key" as const,
      transports: pk.transports,
    }));

    const hostname = new URL(request.url).hostname;
    const rpID = process.env.NEXT_PUBLIC_RP_ID || hostname;

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: allowCredentials as any,
      userVerification: "preferred",
    });

    user.currentChallenge = options.challenge;
    await user.save();

    return NextResponse.json(options, { status: 200 });
  } catch (error: any) {
    console.error("LOGIN-CHALLENGE ERROR:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error?.message },
      { status: 500 }
    );
  }
}
