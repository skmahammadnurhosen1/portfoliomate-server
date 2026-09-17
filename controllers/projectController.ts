import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Project } from '../models/Project.ts';
import { PROJECTS as DEFAULT_PROJECTS } from '../data/defaultData.ts';

// Public: Get all visible projects
export async function getPublicProjects(_req: Request, res: Response): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      const publicDefaults = DEFAULT_PROJECTS.filter((p) => !p.hidden);
      res.status(200).json({
        success: true,
        count: publicDefaults.length,
        data: publicDefaults,
        isFallback: true,
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
    // Fallback to default in-memory projects on database error
    const publicDefaults = DEFAULT_PROJECTS.filter((p) => !p.hidden);
    res.status(200).json({
      success: true,
      count: publicDefaults.length,
      data: publicDefaults,
      isFallback: true,
    });
  }
}

// Public: Get project by id / slug
export async function getProjectById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState !== 1) {
      const project = DEFAULT_PROJECTS.find((p) => p.id === id);
      if (!project) {
        res.status(404).json({ success: false, message: 'Project not found.' });
        return;
      }
      res.status(200).json({ success: true, data: project, isFallback: true });
      return;
    }

    const project = await Project.findOne({
      $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    }).lean();

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
      res.status(200).json({
        success: true,
        count: DEFAULT_PROJECTS.length,
        data: DEFAULT_PROJECTS,
        isFallback: true,
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
    res.status(500).json({ success: false, message: 'Failed to fetch projects.' });
  }
}

// Admin: Create project
export async function createProject(req: Request, res: Response): Promise<void> {
  try {
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

    const newProject = await Project.create({
      ...data,
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
      res.status(503).json({
        success: false,
        message: 'Database connection is not available. Please verify MONGODB_URI in your .env file.',
      });
      return;
    }

    const { id } = req.params;
    const updates = req.body;

    const project = await Project.findOneAndUpdate(
      { $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
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
      res.status(503).json({
        success: false,
        message: 'Database connection is not available. Please verify MONGODB_URI in your .env file.',
      });
      return;
    }

    const { id } = req.params;

    const project = await Project.findOneAndDelete({
      $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

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
      res.status(503).json({
        success: false,
        message: 'Database connection is not available. Please verify MONGODB_URI in your .env file.',
      });
      return;
    }

    const { id } = req.params;

    const project = await Project.findOne({
      $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

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
