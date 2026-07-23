import mongoose, { Schema, Document, models } from "mongoose";

export interface IWorker extends Document {
  name: string;
  skill: string;
  perHourRate: number;
  currentStatus: "Active" | "Inactive";
  phoneNumber?: string;
}

const WorkerSchema = new Schema<IWorker>(
  {
    name: { type: String, required: true },
    skill: { type: String, required: true },
    perHourRate: { type: Number, required: true },
    currentStatus: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    phoneNumber: { type: String },
  },
  { timestamps: true }
);

export default models.Worker || mongoose.model<IWorker>("Worker", WorkerSchema);
