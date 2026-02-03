import { Router } from 'express';
import { conversationController } from '../controllers/conversation.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Create conversation
router.post('/', (req, res) => conversationController.create(req, res));

// List conversations
router.get('/', (req, res) => conversationController.list(req, res));

// Get conversation with messages
router.get('/:id', (req, res) => conversationController.get(req, res));

// Update conversation
router.patch('/:id', (req, res) => conversationController.update(req, res));

// Delete conversation
router.delete('/:id', (req, res) => conversationController.delete(req, res));

export default router;
