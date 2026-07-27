// src/app/api/auth/login-verify/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Role from "@/models/Role";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { SignJWT } from "jose";

// Safe conversion helper for Mongoose / MongoDB BSON Binary objects to Uint8Array
function toUint8Array(val: any): Uint8Array {
  if (!val) return new Uint8Array(0);
  if (typeof val === "string") {
    return new Uint8Array(Buffer.from(val, "base64url"));
  }
  if (val instanceof Uint8Array) {
    return new Uint8Array(val.buffer, val.byteOffset, val.byteLength);
  }
  if (Buffer.isBuffer(val)) {
    return new Uint8Array(val);
  }
  if (val._bsontype === "Binary" && typeof val.value === "function") {
    return new Uint8Array(val.value(true));
  }
  if (val.buffer) {
    return new Uint8Array(Buffer.isBuffer(val.buffer) ? val.buffer : Buffer.from(val.buffer));
  }
  try {
    return new Uint8Array(Buffer.from(val));
  } catch (e) {
    return new Uint8Array(0);
  }
}

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
    const { email, response } = body;

    if (!email || !response) {
      return NextResponse.json(
        { message: "Email and authenticator response are required." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ email });
    if (!user || !user.isActive || !user.currentChallenge) {
      return NextResponse.json(
        { message: "Invalid credentials, disabled account, or challenge missing." },
        { status: 401 }
      );
    }

    // Find the matching passkey in user's registered passkeys
    const passkey = (user.passkeys || []).find((pk: any) => {
      const pkId = toBase64Url(pk.credentialID);
      return pkId === response.id;
    });

    if (!passkey) {
      return NextResponse.json(
        { message: "Authenticator not recognized for this user." },
        { status: 401 }
      );
    }

    const credential = {
      id: toBase64Url(passkey.credentialID),
      publicKey: toUint8Array(passkey.credentialPublicKey),
      counter: passkey.counter,
      transports: passkey.transports,
    };

    const origin = new URL(request.url).origin;
    const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL
      ? [process.env.NEXT_PUBLIC_APP_URL, origin]
      : [origin, "http://localhost:3000", "http://127.0.0.1:3000"];

    const hostname = new URL(request.url).hostname;
    const expectedRPID = process.env.NEXT_PUBLIC_RP_ID
      ? [process.env.NEXT_PUBLIC_RP_ID, hostname]
      : [hostname, "localhost", "127.0.0.1"];

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: user.currentChallenge,
      expectedOrigin,
      expectedRPID,
      credential: credential as any,
    });

    if (!verification.verified || !verification.authenticationInfo) {
      return NextResponse.json(
        { message: "Biometric verification failed." },
        { status: 401 }
      );
    }

    // Update counter in DB to prevent replay attacks
    passkey.counter = verification.authenticationInfo.newCounter;
    user.currentChallenge = undefined;
    await user.save();

    // Role Fetching
    const role = await Role.findById(user.role);
    const roleName = role ? role.name : "Unknown";

    // 🚀 DYNAMIC REDIRECT LOGIC BASED ON ROLE (Identical to standard login)
    let redirectUrl = "/dashboard";
    if (roleName.includes("Super") || roleName.includes("Admin")) {
      redirectUrl = "/dashboard/super-admin";
    } else if (roleName.includes("Store")) {
      redirectUrl = "/dashboard/store";
    } else if (roleName.includes("HR")) {
      redirectUrl = "/dashboard/hr";
    } else if (roleName.includes("Project")) {
      redirectUrl = "/dashboard/project";
    } else if (roleName.includes("Accounts")) {
      redirectUrl = "/dashboard/accounts";
    } else if (roleName.includes("Marketing")) {
      redirectUrl = "/dashboard/marketing";
    } else if (roleName.includes("Design")) {
      redirectUrl = "/dashboard/design";
    }

    // JWT Creation
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "default_secret"
    );

    const token = await new SignJWT({
      userId: user._id.toString(),
      email: user.email,
      role: roleName,
      permissions: role && role.permissions ? Array.from(role.permissions) : [],
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("24h")
      .sign(secret);

    const res = NextResponse.json(
      { message: "Login successful via Biometrics/WebAuthn", redirectUrl },
      { status: 200 }
    );

    res.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
      sameSite: "lax",
    });

    return res;
  } catch (error: any) {
    console.error("LOGIN-VERIFY ERROR:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error?.message },
      { status: 500 }
    );
  }
}
