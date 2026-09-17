import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  id: string;
  title: string;
  subtitle: string;
  category: 'graphic-design' | 'web-building';
  description: string;
  image: string;
  techStack: string[];
  demoUrl?: string;
  githubUrl?: string;
  featured: boolean;
  year: string;
  role?: string;
  status?: string;
  rating?: string;
  duration?: string;
  rate?: string;
  avatar?: string;
  clientName?: string;
  deliverables?: string;
  designTools?: string[];
  behanceUrl?: string;
  dimensions?: string;
  hidden: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
    },
    subtitle: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      enum: ['graphic-design', 'web-building'],
      required: [true, 'Project category is required'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
    },
    image: {
      type: String,
      required: [true, 'Project image is required'],
    },
    techStack: {
      type: [String],
      default: [],
    },
    demoUrl: {
      type: String,
      trim: true,
    },
    githubUrl: {
      type: String,
      trim: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    year: {
      type: String,
      default: () => new Date().getFullYear().toString(),
    },
    role: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      default: '',
    },
    rating: {
      type: String,
      default: '5.0',
    },
    duration: {
      type: String,
      default: '',
    },
    rate: {
      type: String,
      default: '',
    },
    avatar: {
      type: String,
    },
    clientName: {
      type: String,
      trim: true,
    },
    deliverables: {
      type: String,
      trim: true,
    },
    designTools: {
      type: [String],
      default: [],
    },
    behanceUrl: {
      type: String,
      trim: true,
    },
    dimensions: {
      type: String,
      trim: true,
    },
    hidden: {
      type: Boolean,
      default: false,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
