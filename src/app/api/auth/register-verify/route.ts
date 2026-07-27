// src/app/api/auth/register-verify/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import * as jose from "jose";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, userId, response } = body;

    if (!response) {
      return NextResponse.json(
        { message: "Missing authenticator response." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    let user = null;
    if (userId) {
      user = await User.findById(userId);
    } else if (email) {
      user = await User.findOne({ email });
    } else {
      // Fallback to auth cookie if email/userId not explicitly provided
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
          console.error("JWT verification failed in register-verify:", err);
        }
      }
    }

    if (!user || !user.currentChallenge) {
      return NextResponse.json(
        { message: "User not found or registration challenge expired/missing." },
        { status: 404 }
      );
    }

    const origin = new URL(request.url).origin;
    const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL
      ? [process.env.NEXT_PUBLIC_APP_URL, origin]
      : [origin, "http://localhost:3000", "http://127.0.0.1:3000"];

    const hostname = new URL(request.url).hostname;
    const expectedRPID = process.env.NEXT_PUBLIC_RP_ID
      ? [process.env.NEXT_PUBLIC_RP_ID, hostname]
      : [hostname, "localhost", "127.0.0.1"];

    const verification = await verifyRegistrationResponse({
      response: response as any,
      expectedChallenge: user.currentChallenge,
      expectedOrigin,
      expectedRPID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json(
        { message: "Biometric registration verification failed." },
        { status: 400 }
      );
    }

    const { credential, credentialDeviceType, credentialBackedUp } =
      verification.registrationInfo;

    user.passkeys = user.passkeys || [];
    user.passkeys.push({
      credentialID: credential.id, // Stored as Base64URLString
      credentialPublicKey: Buffer.from(credential.publicKey), // Stored as Buffer
      counter: credential.counter,
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
      transports: credential.transports,
    });

    // Clear challenge after successful registration
    user.currentChallenge = undefined;
    await user.save();

    return NextResponse.json(
      {
        message: "Biometric/Fingerprint registered successfully!",
        verified: true,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("REGISTER-VERIFY ERROR:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error?.message },
      { status: 500 }
    );
  }
}
