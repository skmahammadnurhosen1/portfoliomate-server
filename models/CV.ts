import mongoose, { Document, Schema } from 'mongoose';

export interface ICVHighlightItem {
  id: string;
  text: string;
}

export interface ICVExperienceItem {
  id: string;
  role: string;
  company: string;
  period: string;
  description: string;
}

export interface ICVEducationItem {
  id: string;
  degree: string;
  institution: string;
  year: string;
}

export interface ICVData extends Document {
  fullName: string;
  title: string;
  summary: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  statusBadge: string;
  skills: string[];
  highlights: ICVHighlightItem[];
  experiences: ICVExperienceItem[];
  education: ICVEducationItem[];

  // Visibility toggles
  showSummary: boolean;
  showSkills: boolean;
  showHighlights: boolean;
  showExperience: boolean;
  showEducation: boolean;
  showContact: boolean;

  // Custom uploaded PDF
  customPdfUrl?: string;
  customPdfFileName?: string;
  customPdfFileSize?: string;
  customPdfUploadDate?: string;
  updatedAt: Date;
}

const HighlightSchema = new Schema<ICVHighlightItem>({ id: String, text: String }, { _id: false });
const ExperienceSchema = new Schema<ICVExperienceItem>(
  { id: String, role: String, company: String, period: String, description: String },
  { _id: false }
);
const EducationSchema = new Schema<ICVEducationItem>(
  { id: String, degree: String, institution: String, year: String },
  { _id: false }
);

const CVSchema = new Schema<ICVData>(
  {
    fullName: { type: String, default: 'NOOR HOSEN' },
    title: { type: String, default: 'Graphic Designer & Website Builder' },
    summary: { type: String, default: '' },
    email: { type: String, default: 'skmahammadnurhosen1@gmail.com' },
    phone: { type: String, default: '+91 98765 43210' },
    location: { type: String, default: 'Kolkata, India (Remote Available)' },
    website: { type: String, default: 'https://noor-portfolio.dev' },
    statusBadge: { type: String, default: 'Available for Freelance & Full-time Roles' },
    skills: { type: [String], default: [] },
    highlights: { type: [HighlightSchema], default: [] },
    experiences: { type: [ExperienceSchema], default: [] },
    education: { type: [EducationSchema], default: [] },
    showSummary: { type: Boolean, default: true },
    showSkills: { type: Boolean, default: true },
    showHighlights: { type: Boolean, default: true },
    showExperience: { type: Boolean, default: true },
    showEducation: { type: Boolean, default: false },
    showContact: { type: Boolean, default: true },
    customPdfUrl: { type: String },
    customPdfFileName: { type: String },
    customPdfFileSize: { type: String },
    customPdfUploadDate: { type: String },
  },
  {
    timestamps: true,
  }
);

export const CV = mongoose.model<ICVData>('CV', CVSchema);
