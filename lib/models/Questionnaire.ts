import mongoose, { Schema, Document } from 'mongoose';
import './Admin'; // Ensure Admin model is registered
import './Question'; // Ensure Question model is registered

export interface IQuestionnaire extends Document {
  title: string;
  description?: string;
  adminId: mongoose.Types.ObjectId;
  status: 'draft' | 'published' | 'archived';
  questions?: mongoose.Types.ObjectId[];
  startDate: Date;
  endDate?: Date;
  isRequired: boolean;
  showOnCheckIn: boolean;
  totalResponses: number;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionnaireSchema = new Schema<IQuestionnaire>(
  {
    title: {
      type: String,
      required: [true, 'Questionnaire title is required'],
    },
    description: {
      type: String,
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    questions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    isRequired: {
      type: Boolean,
      default: false,
    },
    showOnCheckIn: {
      type: Boolean,
      default: false,
    },
    totalResponses: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Questionnaire ||
  mongoose.model<IQuestionnaire>('Questionnaire', QuestionnaireSchema);
