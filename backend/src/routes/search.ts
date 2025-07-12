import express, { Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = express.Router();

// Search questions
router.get('/questions', async (req: Request, res: Response) => {
  try {
    const { q, tags, page = '1', limit = '10' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    let whereClause: any = {};

    // Text search
    if (q) {
      whereClause.OR = [
        {
          title: {
            contains: q as string,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: q as string,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Tag filter
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags as string[] : [tags as string];
      whereClause.tags = {
        some: {
          tag: {
            name: {
              in: tagArray.map(tag => typeof tag === 'string' ? tag.toLowerCase() : String(tag).toLowerCase())
            }
          }
        }
      };
    }

    const questions = await prisma.question.findMany({
      where: whereClause,
      skip,
      take: parseInt(limit as string),
      include: {
        author: {
          select: {
            id: true,
            username: true
          }
        },
        tags: {
          include: {
            tag: true
          }
        },
        votes: true,
        _count: {
          select: {
            answers: true,
            votes: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const total = await prisma.question.count({
      where: whereClause
    });

    // Calculate vote scores
    const questionsWithVotes = questions.map(question => {
      const upvotes = question.votes.filter(vote => vote.type === 'UP').length;
      const downvotes = question.votes.filter(vote => vote.type === 'DOWN').length;
      const score = upvotes - downvotes;

      return {
        ...question,
        score,
        upvotes,
        downvotes,
        votes: undefined
      };
    });

    res.json({
      questions: questionsWithVotes,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Search questions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search users (for admin)
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { q, page = '1', limit = '10' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    let whereClause: any = {};

    if (q) {
      whereClause.OR = [
        {
          username: {
            contains: q as string,
            mode: 'insensitive'
          }
        },
        {
          email: {
            contains: q as string,
            mode: 'insensitive'
          }
        }
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      skip,
      take: parseInt(limit as string),
      select: {
        id: true,
        username: true,
        email: true,
        isAdmin: true,
        isBanned: true,
        createdAt: true,
        _count: {
          select: {
            questions: true,
            answers: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const total = await prisma.user.count({
      where: whereClause
    });

    res.json({
      users,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
