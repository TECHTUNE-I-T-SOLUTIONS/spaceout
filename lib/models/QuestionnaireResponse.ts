import mongoose, { Schema, Document } from 'mongoose';

export interface IResponseAnswer {
  questionId: mongoose.Types.ObjectId;
  type: 'multiple_choice' | 'open_ended' | 'dropdown' | 'rating' | 'checkbox';
  answer: string | string[] | number;
}

export interface IQuestionnaireResponse extends Document {
  questionnaireId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  answers: IResponseAnswer[];
  status: 'in_progress' | 'completed';
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ResponseAnswerSchema = new Schema<IResponseAnswer>({
  questionId: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  type: {
    type: String,
    enum: ['multiple_choice', 'open_ended', 'dropdown', 'rating', 'checkbox'],
    required: true,
  },
  answer: {
    type: Schema.Types.Mixed,
    required: true,
  },
});

const QuestionnaireResponseSchema = new Schema<IQuestionnaireResponse>(
  {
    questionnaireId: {
      type: Schema.Types.ObjectId,
      ref: 'Questionnaire',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    answers: [ResponseAnswerSchema],
    status: {
      type: String,
      enum: ['in_progress', 'completed'],
      default: 'in_progress',
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate responses
QuestionnaireResponseSchema.index({ questionnaireId: 1, userId: 1 }, { unique: true });

export default mongoose.models.QuestionnaireResponse ||
  mongoose.model<IQuestionnaireResponse>('QuestionnaireResponse', QuestionnaireResponseSchema);
