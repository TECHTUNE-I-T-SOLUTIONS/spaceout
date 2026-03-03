import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage {
  _id?: mongoose.Types.ObjectId;
  sender: 'user' | 'staff';
  senderId: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  isRead: boolean;
}

export interface IChatConversation extends Document {
  userId: mongoose.Types.ObjectId;
  staffId?: mongoose.Types.ObjectId;
  subject: string;
  department: string;
  status: 'open' | 'closed' | 'archived';
  messages: IChatMessage[];
  lastMessage?: string;
  lastMessageTime?: Date;
  isResumable: boolean;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  sender: {
    type: String,
    enum: ['user', 'staff'],
    required: true,
  },
  senderId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ChatConversationSchema = new Schema<IChatConversation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    staffId: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
    },
    subject: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      default: 'general_support',
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'archived'],
      default: 'open',
    },
    messages: [ChatMessageSchema],
    lastMessage: String,
    lastMessageTime: Date,
    isResumable: {
      type: Boolean,
      default: true,
    },
    closedAt: Date,
  },
  { timestamps: true }
);

// Index for quick lookup
ChatConversationSchema.index({ userId: 1, status: 1 });
ChatConversationSchema.index({ staffId: 1, status: 1 });

export default mongoose.models.ChatConversation ||
  mongoose.model<IChatConversation>('ChatConversation', ChatConversationSchema);
