import mongoose, { Document, Schema } from 'mongoose';

export interface IUploadedFile extends Document {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  data: Buffer;
  createdAt: Date;
}

const UploadedFileSchema = new Schema<IUploadedFile>(
  {
    filename: { type: String, required: true, unique: true, index: true },
    originalName: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },
  },
  { timestamps: true }
);

export const UploadedFile = (mongoose.models.UploadedFile as mongoose.Model<IUploadedFile>) || mongoose.model<IUploadedFile>('UploadedFile', UploadedFileSchema);
