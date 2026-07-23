import mongoose, { Schema, Document, models } from "mongoose";

export interface ILogEntry {
  time: Date;
  action: "IN" | "TRANSFER" | "OUT";
  siteName: string;
  updatedBy: mongoose.Types.ObjectId; // Reference to User (HR/Admin/Site Manager)
  remark?: string;
}

export interface IDailyWagerLog extends Document {
  workerId: mongoose.Types.ObjectId;
  date: string; // Format: YYYY-MM-DD
  logs: ILogEntry[];
  totalHoursCalculated?: number;
  totalPaymentCalculated?: number;
}

const LogEntrySchema = new Schema<ILogEntry>(
  {
    time: { type: Date, required: true },
    action: {
      type: String,
      enum: ["IN", "TRANSFER", "OUT"],
      required: true,
    },
    siteName: { type: String, required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    remark: { type: String },
  },
  { _id: true } // Creates unique ID for each log entry
);

const DailyWagerLogSchema = new Schema<IDailyWagerLog>(
  {
    workerId: { type: Schema.Types.ObjectId, ref: "Worker", required: true },
    date: { type: String, required: true }, // Store as "2026-07-23" for easier daily grouping
    logs: [LogEntrySchema],
    totalHoursCalculated: { type: Number, default: 0 },
    totalPaymentCalculated: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Prevent duplicate daily log document for the same worker on the same date
DailyWagerLogSchema.index({ workerId: 1, date: 1 }, { unique: true });

export default models.DailyWagerLog ||
  mongoose.model<IDailyWagerLog>("DailyWagerLog", DailyWagerLogSchema);
