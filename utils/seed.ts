import { Admin } from '../models/Admin.ts';
import { Project } from '../models/Project.ts';
import { Profile } from '../models/Profile.ts';
import { CV } from '../models/CV.ts';
import { PROJECTS, PERSONAL_INFO, DEFAULT_CV_DATA } from '../data/defaultData.ts';

const INITIAL_SOCIAL_LINKS = [
  { id: 'sl-github', platform: 'github' as const, label: 'GitHub', url: 'https://github.com' },
  { id: 'sl-linkedin', platform: 'linkedin' as const, label: 'LinkedIn', url: 'https://linkedin.com' },
  { id: 'sl-facebook', platform: 'facebook' as const, label: 'Facebook', url: 'https://facebook.com' },
  { id: 'sl-instagram', platform: 'instagram' as const, label: 'Instagram', url: 'https://instagram.com' },
  { id: 'sl-telegram', platform: 'telegram' as const, label: 'Telegram', url: 'https://t.me' },
  { id: 'sl-twitter', platform: 'twitter' as const, label: 'Twitter / X', url: 'https://twitter.com' },
  { id: 'sl-behance', platform: 'behance' as const, label: 'Behance', url: 'https://behance.net' },
];

export async function seedDatabase(): Promise<void> {
  try {
    // 1. Seed Admin
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const email = process.env.ADMIN_EMAIL || 'admin@noor.dev';
      const password = process.env.ADMIN_INITIAL_PASSWORD || 'AdminSecurePass2026!';
      await Admin.create({ email, password, role: 'admin' });
      console.log(`[Seed] Initial Admin created with email: ${email}`);
    }

    // 2. Seed Projects if empty
    const projectCount = await Project.countDocuments();
    if (projectCount === 0) {
      const projectsToInsert = PROJECTS.map((p, index) => ({
        ...p,
        order: index,
        hidden: false,
      }));
      await Project.insertMany(projectsToInsert);
      console.log(`[Seed] Seeded ${projectsToInsert.length} initial projects.`);
    }

    // 3. Seed Profile if empty
    const profileCount = await Profile.countDocuments();
    if (profileCount === 0) {
      await Profile.create({
        ...PERSONAL_INFO,
        socialLinks: INITIAL_SOCIAL_LINKS,
      });
      console.log('[Seed] Initial Profile seeded successfully.');
    }

    // 4. Seed CV if empty
    const cvCount = await CV.countDocuments();
    if (cvCount === 0) {
      await CV.create(DEFAULT_CV_DATA);
      console.log('[Seed] Initial CV seeded successfully.');
    }
  } catch (error) {
    console.error('[Seed] Database seeding warning/error:', error);
  }
}
