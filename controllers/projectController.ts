import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Project } from '../models/Project.ts';
import { ensureDbConnected } from '../config/db.ts';

// Public: Get all visible projects
export async function getPublicProjects(_req: Request, res: Response): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      await ensureDbConnected(8000);
    }

    if (mongoose.connection.readyState !== 1) {
      res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
      return;
    }

    const projects = await Project.find({ hidden: { $ne: true } })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    console.error('[Project Controller] Error fetching public projects:', error);
    // Never fallback to demo projects; return empty array
    res.status(200).json({
      success: true,
      count: 0,
      data: [],
    });
  }
}

// Whitelist allowed fields to prevent Mass Assignment
const ALLOWED_PROJECT_FIELDS = [
  'title', 'subtitle', 'category', 'description', 'image', 'techStack',
  'demoUrl', 'githubUrl', 'featured', 'year', 'role', 'status', 'rating',
  'duration', 'rate', 'avatar', 'clientName', 'deliverables', 'designTools',
  'behanceUrl', 'dimensions', 'hidden', 'order',
];

function filterAllowedProjectFields(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of ALLOWED_PROJECT_FIELDS) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

function getQueryById(id: string) {
  const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
  return isValidObjectId ? { $or: [{ id }, { _id: id }] } : { id };
}

// Public: Get project by id / slug
export async function getProjectById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState !== 1) {
      await ensureDbConnected(8000);
    }

    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({ success: false, message: 'Database connecting. Please retry shortly.' });
      return;
    }

    const project = await Project.findOne(getQueryById(id)).lean();

    if (!project || (project.hidden && !(req as any).admin)) {
      res.status(404).json({ success: false, message: 'Project not found.' });
      return;
    }

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    console.error('[Project Controller] Error fetching project by id:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch project.' });
  }
}

// Admin: Get all projects (including hidden)
export async function getAdminProjects(_req: Request, res: Response): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      await ensureDbConnected(8000);
    }

    if (mongoose.connection.readyState !== 1) {
      res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
      return;
    }

    const projects = await Project.find()
      .sort({ order: 1, createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    console.error('[Project Controller] Error fetching admin projects:', error);
    res.status(200).json({ success: true, count: 0, data: [] });
  }
}

// Admin: Create project
export async function createProject(req: Request, res: Response): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      await ensureDbConnected(10000);
    }

    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({
        success: false,
        message: 'Database connection is not available. Please verify MONGODB_URI in your .env file.',
      });
      return;
    }

    const data = req.body;

    if (!data.title || !data.category || !data.description || !data.image) {
      res.status(400).json({
        success: false,
        message: 'Title, category, description, and image are required.',
      });
      return;
    }

    let projectId = data.id?.trim();
    if (!projectId) {
      const slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      projectId = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const existing = await Project.findOne({ id: projectId });
    if (existing) {
      projectId = `${projectId}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const sanitizedData = filterAllowedProjectFields(data);

    const newProject = await Project.create({
      ...sanitizedData,
      id: projectId,
      featured: Boolean(data.featured),
      hidden: Boolean(data.hidden),
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      data: newProject,
    });
  } catch (error: any) {
    console.error('[Project Controller] Error creating project:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create project.',
    });
  }
}

// Admin: Update project
export async function updateProject(req: Request, res: Response): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      await ensureDbConnected(10000);
    }

    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({
        success: false,
        message: 'Database connection is not available. Please verify MONGODB_URI in your .env file.',
      });
      return;
    }

    const { id } = req.params;
    const updates = filterAllowedProjectFields(req.body);

    const project = await Project.findOneAndUpdate(
      getQueryById(id),
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Project updated successfully.',
      data: project,
    });
  } catch (error: any) {
    console.error('[Project Controller] Error updating project:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update project.',
    });
  }
}

// Admin: Delete project
export async function deleteProject(req: Request, res: Response): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      await ensureDbConnected(10000);
    }

    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({
        success: false,
        message: 'Database connection is not available. Please verify MONGODB_URI in your .env file.',
      });
      return;
    }

    const { id } = req.params;

    const project = await Project.findOneAndDelete(getQueryById(id));

    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully.',
      data: { id: project.id },
    });
  } catch (error) {
    console.error('[Project Controller] Error deleting project:', error);
    res.status(500).json({ success: false, message: 'Failed to delete project.' });
  }
}

// Admin: Toggle project hidden status
export async function toggleHideProject(req: Request, res: Response): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      await ensureDbConnected(10000);
    }

    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({
        success: false,
        message: 'Database connection is not available. Please verify MONGODB_URI in your .env file.',
      });
      return;
    }

    const { id } = req.params;

    const project = await Project.findOne(getQueryById(id));

    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found.' });
      return;
    }

    project.hidden = !project.hidden;
    await project.save();

    res.status(200).json({
      success: true,
      message: `Project is now ${project.hidden ? 'hidden' : 'visible'}.`,
      data: project,
    });
  } catch (error) {
    console.error('[Project Controller] Error toggling project visibility:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle visibility.' });
  }
}
