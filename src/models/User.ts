// src/models/User.ts
import mongoose, { Schema, Document, models } from "mongoose";
import "./Role"; // Ensure Role is registered before User

export interface IPasskey {
  credentialID: Buffer | string;
  credentialPublicKey: Buffer | string;
  counter: number;
  deviceType?: string;
  backedUp?: boolean;
  transports?: string[];
}

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: mongoose.Types.ObjectId;
  isActive: boolean;
  passkeys: IPasskey[];
  currentChallenge?: string;
}

const PasskeySchema = new Schema<IPasskey>(
  {
    credentialID: {
      type: String, // Stored as Base64URL string
      required: true,
      index: true, // Fast lookup during WebAuthn authentication assertion
    },
    credentialPublicKey: {
      type: Buffer, // Stored as Buffer (Mongoose handles BSON binary natively)
      required: true,
    },
    counter: {
      type: Number,
      required: true,
      default: 0,
    },
    deviceType: {
      type: String,
    },
    backedUp: {
      type: Boolean,
    },
    transports: {
      type: [String],
    },
  },
  { _id: true }
);

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Array of passkeys to support multiple biometric/2FA devices (Touch ID, Face ID, YubiKey, etc.)
    passkeys: {
      type: [PasskeySchema],
      default: [],
    },
    // Useful in Next.js serverless API routes to temporarily store WebAuthn challenges
    currentChallenge: {
      type: String,
    },
  },
  { timestamps: true }
);

// Optimized for Next.js Serverless & Hot-Reload environments to prevent OverwriteModelError
const User = (models.User as mongoose.Model<IUser>) || mongoose.model<IUser>("User", UserSchema);
export default User;