import express, { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { auth } from '../middleware/auth';

const router = express.Router();

// Get user's notifications
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const notifications = await prisma.notification.findMany({
      where: {
        receiverId: req.user.id
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            isAdmin: true
          }
        },
        question: {
          select: {
            id: true,
            title: true
          }
        },
        answer: {
          select: {
            id: true,
            content: true,
            question: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: parseInt(limit as string)
    });

    const unreadCount = await prisma.notification.count({
      where: {
        receiverId: req.user.id,
        isRead: false
      }
    });

    res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark notification as read
router.patch('/:id/read', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;

    // Verify the notification belongs to the user
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        receiverId: req.user.id
      }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    res.json(updatedNotification);
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await prisma.notification.updateMany({
      where: {
        receiverId: req.user.id,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete notification
router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { id } = req.params;

    // Verify the notification belongs to the user
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        receiverId: req.user.id
      }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await prisma.notification.delete({
      where: { id }
    });

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Utility function to create notifications
export const createNotification = async (data: {
  type: string;
  message: string;
  receiverId: string;
  senderId?: string;
  questionId?: string;
  answerId?: string;
}) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        type: data.type as any,
        message: data.message,
        receiverId: data.receiverId,
        senderId: data.senderId,
        questionId: data.questionId,
        answerId: data.answerId
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            isAdmin: true
          }
        },
        question: {
          select: {
            id: true,
            title: true
          }
        },
        answer: {
          select: {
            id: true,
            content: true
          }
        }
      }
    });

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
};

export default router;
