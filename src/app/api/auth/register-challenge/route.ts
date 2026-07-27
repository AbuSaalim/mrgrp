// src/app/api/auth/register-challenge/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import * as jose from "jose";

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
    const { email, userId } = body;

    await connectToDatabase();

    let user = null;
    if (userId) {
      user = await User.findById(userId);
    } else if (email) {
      user = await User.findOne({ email });
    } else {
      // Check auth_token cookie if user is already logged in and adding biometric in settings
      const token = request.headers
        .get("cookie")
        ?.split("auth_token=")[1]
        ?.split(";")[0];

      if (token) {
        try {
          const secret = new TextEncoder().encode(
            process.env.JWT_SECRET || "default_secret"
          );
          const { payload } = await jose.jwtVerify(token, secret);
          if (payload.userId) {
            user = await User.findById(payload.userId);
          }
        } catch (err) {
          console.error("JWT verification failed in register-challenge:", err);
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { message: "User not found or not authenticated." },
        { status: 404 }
      );
    }

    // Convert existing passkeys for excludeCredentials to avoid duplicate registrations
    const excludeCredentials = (user.passkeys || []).map((passkey: any) => ({
      id: toBase64Url(passkey.credentialID),
      type: "public-key" as const,
      transports: passkey.transports,
    }));

    const hostname = new URL(request.url).hostname;
    const rpID = process.env.NEXT_PUBLIC_RP_ID || hostname;

    const options = await generateRegistrationOptions({
      rpName: "MR Group",
      rpID,
      userID: new Uint8Array(Buffer.from(user._id.toString())),
      userName: user.email,
      userDisplayName: user.name || user.email,
      attestationType: "none",
      excludeCredentials,
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
        authenticatorAttachment: "platform", // Encourages device biometrics (Touch ID, Face ID, Windows Hello)
      },
    });

    // Save the challenge temporarily in user doc for verification step
    user.currentChallenge = options.challenge;
    await user.save();

    return NextResponse.json(options, { status: 200 });
  } catch (error: any) {
    console.error("REGISTER-CHALLENGE ERROR:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error?.message },
      { status: 500 }
    );
  }
}
