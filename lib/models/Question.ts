import mongoose, { Schema, Document } from 'mongoose';
import './Questionnaire'; // Ensure Questionnaire model is registered

export interface IQuestionOption {
  _id?: mongoose.Types.ObjectId;
  text: string;
  value: string;
  order: number;
}

export interface IConditionalLogic {
  questionId: mongoose.Types.ObjectId;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan';
  value: string;
}

export interface IQuestion extends Document {
  questionnaireId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  type: 'multiple_choice' | 'open_ended' | 'dropdown' | 'rating' | 'checkbox';
  options?: IQuestionOption[];
  required: boolean;
  order: number;
  conditionalLogic?: IConditionalLogic[];
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    questionnaireId: {
      type: Schema.Types.ObjectId,
      ref: 'Questionnaire',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Question title is required'],
    },
    description: {
      type: String,
    },
    type: {
      type: String,
      enum: ['multiple_choice', 'open_ended', 'dropdown', 'rating', 'checkbox'],
      required: true,
    },
    options: [
      {
        text: String,
        value: String,
        order: Number,
      },
    ],
    required: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      required: true,
    },
    conditionalLogic: [
      {
        questionId: {
          type: Schema.Types.ObjectId,
          ref: 'Question',
        },
        operator: {
          type: String,
          enum: ['equals', 'contains', 'greaterThan', 'lessThan'],
        },
        value: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);
