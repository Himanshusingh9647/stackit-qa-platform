import express, { Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = express.Router();

// Get all tags
router.get('/', async (req: Request, res: Response) => {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            questions: true
          }
        }
      },
      orderBy: {
        questions: {
          _count: 'desc'
        }
      }
    });

    res.json(tags);
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get popular tags
router.get('/popular', async (req: Request, res: Response) => {
  try {
    const { limit = '10' } = req.query;

    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: {
            questions: true
          }
        }
      },
      orderBy: {
        questions: {
          _count: 'desc'
        }
      },
      take: parseInt(limit as string)
    });

    res.json(tags);
  } catch (error) {
    console.error('Get popular tags error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
