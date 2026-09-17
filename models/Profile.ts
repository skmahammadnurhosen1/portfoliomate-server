import mongoose, { Document, Schema } from 'mongoose';

export interface ISocialLinkItem {
  id: string;
  platform: 'github' | 'linkedin' | 'facebook' | 'instagram' | 'twitter' | 'telegram' | 'behance' | 'dribbble' | 'youtube' | 'website';
  label: string;
  url: string;
}

export interface IProfile extends Document {
  name: string;
  firstName: string;
  lastName: string;
  initials: string;
  title: string;
  roles: string[];
  tagline: string;
  bio: string;
  longBio: string;
  email: string;
  phone: string;
  location: string;
  availability: string;
  social: Record<string, string>;
  socialLinks: ISocialLinkItem[];
  stats: { label: string; value: string }[];
  updatedAt: Date;
}

const SocialLinkSchema = new Schema<ISocialLinkItem>(
  {
    id: { type: String, required: true },
    platform: { type: String, required: true },
    label: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

const StatSchema = new Schema(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const ProfileSchema = new Schema<IProfile>(
  {
    name: { type: String, required: true, default: 'NOOR' },
    firstName: { type: String, default: 'NOOR' },
    lastName: { type: String, default: '' },
    initials: { type: String, default: 'N' },
    title: { type: String, default: 'Graphic Designer & Website Builder' },
    roles: { type: [String], default: ['Graphic Designer', 'Website Builder', 'Brand Identity Specialist'] },
    tagline: { type: String, default: 'GRAPHIC DESIGNER  /  WEBSITE BUILDER' },
    bio: { type: String, default: '' },
    longBio: { type: String, default: '' },
    email: { type: String, default: 'skmahammadnurhosen1@gmail.com' },
    phone: { type: String, default: '+91 98765 43210' },
    location: { type: String, default: 'Kolkata, India (Remote Available)' },
    availability: { type: String, default: 'Available for freelance & full-time roles' },
    social: { type: Map, of: String, default: {} },
    socialLinks: { type: [SocialLinkSchema], default: [] },
    stats: { type: [StatSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

export const Profile = mongoose.model<IProfile>('Profile', ProfileSchema);
