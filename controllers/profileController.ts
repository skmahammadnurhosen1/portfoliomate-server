import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Profile } from '../models/Profile.ts';
import { PERSONAL_INFO } from '../data/defaultData.ts';

const INITIAL_SOCIAL_LINKS = [
  { id: 'sl-github', platform: 'github' as const, label: 'GitHub', url: 'https://github.com' },
  { id: 'sl-linkedin', platform: 'linkedin' as const, label: 'LinkedIn', url: 'https://linkedin.com' },
  { id: 'sl-facebook', platform: 'facebook' as const, label: 'Facebook', url: 'https://facebook.com' },
  { id: 'sl-instagram', platform: 'instagram' as const, label: 'Instagram', url: 'https://instagram.com' },
  { id: 'sl-telegram', platform: 'telegram' as const, label: 'Telegram', url: 'https://t.me' },
  { id: 'sl-twitter', platform: 'twitter' as const, label: 'Twitter / X', url: 'https://twitter.com' },
  { id: 'sl-behance', platform: 'behance' as const, label: 'Behance', url: 'https://behance.net' },
];

const DEFAULT_PROFILE_PAYLOAD = {
  ...PERSONAL_INFO,
  socialLinks: INITIAL_SOCIAL_LINKS,
};

// Public: Get personal information & social links
export async function getProfile(_req: Request, res: Response): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(200).json({
        success: true,
        data: DEFAULT_PROFILE_PAYLOAD,
        isFallback: true,
      });
      return;
    }

    let profile = await Profile.findOne().lean();
    if (!profile) {
      res.status(200).json({
        success: true,
        data: DEFAULT_PROFILE_PAYLOAD,
      });
      return;
    }

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    console.error('[Profile Controller] Error getting profile:', error);
    res.status(200).json({
      success: true,
      data: DEFAULT_PROFILE_PAYLOAD,
      isFallback: true,
    });
  }
}

// Admin: Update profile
export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({
        success: false,
        message: 'Database connection is not available. Please configure MONGODB_URI in .env.',
      });
      return;
    }

    const updates = req.body;

    // Synchronize full name and initials if firstName/lastName provided
    if (updates.firstName !== undefined || updates.lastName !== undefined) {
      const existing = await Profile.findOne();
      const fn = updates.firstName !== undefined ? updates.firstName : existing?.firstName || '';
      const ln = updates.lastName !== undefined ? updates.lastName : existing?.lastName || '';
      updates.name = ln ? `${fn} ${ln}`.trim() : fn.trim();
      updates.initials = fn ? fn.charAt(0).toUpperCase() : 'N';
    }

    const updated = await Profile.findOneAndUpdate(
      {},
      { $set: updates },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: updated,
    });
  } catch (error: any) {
    console.error('[Profile Controller] Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile data.',
    });
  }
}
