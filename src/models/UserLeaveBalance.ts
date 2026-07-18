import mongoose, { Schema, Document } from "mongoose";

export interface IUserLeaveBalance extends Document {
  userId: mongoose.Types.ObjectId;
  year: number;
  allocated: Map<string, number>; // Maps leave type (e.g., "SL") to allocated quota (e.g., 2)
}

const UserLeaveBalanceSchema = new Schema<IUserLeaveBalance>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    year: { type: Number, required: true },
    allocated: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

// Prevent duplicate records for the same user and year
UserLeaveBalanceSchema.index({ userId: 1, year: 1 }, { unique: true });

export default mongoose.models.UserLeaveBalance || mongoose.model<IUserLeaveBalance>("UserLeaveBalance", UserLeaveBalanceSchema);
