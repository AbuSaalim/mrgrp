import mongoose, { Schema, Document } from "mongoose";

export interface IDriveItem extends Document {
  name: string;
  type: "folder" | "file";
  parentId: mongoose.Types.ObjectId | null;
  fileType?: string;
  size?: number;
  url?: string;
  role: string;
  ownerId?: string;
  sharedWith: string[];
  isLocked?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DriveItemSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["folder", "file"],
      required: [true, "Type is required"],
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "DriveItem",
      default: null,
    },
    fileType: {
      type: String,
    },
    size: {
      type: Number,
    },
    url: {
      type: String,
    },
    role: {
      type: String,
      required: [true, "Role is required for isolation"],
    },
    ownerId: {
      type: String,
    },
    sharedWith: {
      type: [String],
      default: [],
    },
    isLocked: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

// We define a compound index on parentId, name, and role to easily fetch siblings per role
DriveItemSchema.index({ parentId: 1, name: 1, role: 1 });

delete mongoose.models.DriveItem;
export default mongoose.model<IDriveItem>("DriveItem", DriveItemSchema);
