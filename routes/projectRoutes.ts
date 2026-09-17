import { Router } from 'express';
import {
  getPublicProjects,
  getProjectById,
  getAdminProjects,
  createProject,
  updateProject,
  deleteProject,
  toggleHideProject,
} from '../controllers/projectController.ts';
import { requireAdmin } from '../middleware/auth.ts';

const router = Router();

// Public endpoints
router.get('/', getPublicProjects);
router.get('/:id', getProjectById);

// Admin endpoints (strictly guarded by requireAdmin middleware)
router.get('/admin/all', requireAdmin, getAdminProjects);
router.post('/admin', requireAdmin, createProject);
router.put('/admin/:id', requireAdmin, updateProject);
router.delete('/admin/:id', requireAdmin, deleteProject);
router.patch('/admin/:id/toggle-hide', requireAdmin, toggleHideProject);

export default router;
