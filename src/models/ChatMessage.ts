import mongoose, { Document, Model, Schema } from "mongoose";

export interface IChatMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  senderRole: string;
  message: string;
  targetRole: string; // "All" for global, or specific role name for private department chat
  taggedRoles: string[]; // For tagging specific roles in Global chat
  isDeleted: boolean;
  mediaKey?: string | null;
  mediaUrl?: string | null;
  mediaName?: string | null;
  mediaType?: string | null;
  mediaSize?: number | null;
  mediaExpiresAt?: Date | null;
  mediaDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderName: { type: String, required: true },
    senderRole: { type: String, required: true },
    message: { type: String, default: "" },
    targetRole: { type: String, default: "All" },
    taggedRoles: { type: [String], default: [] },
    isDeleted: { type: Boolean, default: false },
    mediaKey: { type: String, default: null },
    mediaUrl: { type: String, default: null },
    mediaName: { type: String, default: null },
    mediaType: { type: String, default: null },
    mediaSize: { type: Number, default: null },
    mediaExpiresAt: { type: Date, default: null },
    mediaDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Add index to fetch recent messages quickly and clean up expired media
ChatMessageSchema.index({ createdAt: -1 });
ChatMessageSchema.index({ mediaExpiresAt: 1 });

const ChatMessage: Model<IChatMessage> =
  mongoose.models.ChatMessage || mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);

export default ChatMessage;
