import mongoose, { Document, Model, Schema } from "mongoose";

export interface IChatMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  senderRole: string;
  message: string;
  taggedRoles: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderName: { type: String, required: true },
    senderRole: { type: String, required: true },
    message: { type: String, required: true },
    taggedRoles: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

// Add index to fetch recent messages quickly
ChatMessageSchema.index({ createdAt: -1 });

const ChatMessage: Model<IChatMessage> =
  mongoose.models.ChatMessage || mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);

export default ChatMessage;
