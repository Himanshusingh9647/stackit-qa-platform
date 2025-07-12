import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { auth, admin } from '../middleware/auth';

const router = express.Router();

// Get all questions with pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10', sortBy = 'createdAt', order = 'desc' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Base query configuration
    const baseInclude = {
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
    };

    let questions;
    let total;

    // Handle score sorting differently since it's calculated, not a DB field
    if (sortBy === 'score') {
      // For score sorting, fetch all questions first, then sort by calculated score
      questions = await prisma.question.findMany({
        include: baseInclude,
        orderBy: { createdAt: 'desc' }
      });
      
      total = questions.length;
    } else {
      // For other sorting, use database-level sorting and pagination
      questions = await prisma.question.findMany({
        skip,
        take: parseInt(limit as string),
        orderBy: {
          [sortBy as string]: order as 'asc' | 'desc'
        },
        include: baseInclude
      });
      
      total = await prisma.question.count();
    }

    // Calculate vote scores
    let questionsWithVotes = questions.map(question => {
      const upvotes = question.votes.filter(vote => vote.type === 'UP').length;
      const downvotes = question.votes.filter(vote => vote.type === 'DOWN').length;
      const score = upvotes - downvotes;

      return {
        ...question,
        score,
        upvotes,
        downvotes,
        votes: undefined // Remove votes array from response
      };
    });

    // Handle score sorting and pagination
    if (sortBy === 'score') {
      // Sort by score
      questionsWithVotes.sort((a, b) => {
        if (order === 'desc') {
          return b.score - a.score;
        } else {
          return a.score - b.score;
        }
      });
      
      // Apply pagination after sorting
      questionsWithVotes = questionsWithVotes.slice(skip, skip + parseInt(limit as string));
    }

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
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single question with answers
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const question = await prisma.question.findUnique({
      where: { id },
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
        answers: {
          include: {
            author: {
              select: {
                id: true,
                username: true
              }
            },
            votes: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Calculate vote scores for question
    const questionUpvotes = question.votes.filter(vote => vote.type === 'UP').length;
    const questionDownvotes = question.votes.filter(vote => vote.type === 'DOWN').length;
    const questionScore = questionUpvotes - questionDownvotes;

    // Calculate vote scores for answers
    const answersWithVotes = question.answers.map(answer => {
      const upvotes = answer.votes.filter(vote => vote.type === 'UP').length;
      const downvotes = answer.votes.filter(vote => vote.type === 'DOWN').length;
      const score = upvotes - downvotes;

      return {
        ...answer,
        score,
        upvotes,
        downvotes,
        votes: undefined
      };
    });

    res.json({
      ...question,
      score: questionScore,
      upvotes: questionUpvotes,
      downvotes: questionDownvotes,
      answers: answersWithVotes,
      votes: undefined
    });
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new question
router.post('/', auth, [
  body('title').isLength({ min: 5, max: 200 }).trim(),
  body('description').isLength({ min: 10 }).trim(),
  body('tags').isArray({ min: 1, max: 5 }).withMessage('Tags must be an array with 1-5 items'),
  body('tags.*').isString().trim().withMessage('Each tag must be a string')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, tags } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Create or find tags
    const tagPromises = tags.map(async (tagName: string) => {
      const tag = await prisma.tag.upsert({
        where: { name: tagName.toLowerCase() },
        update: {},
        create: { name: tagName.toLowerCase() }
      });
      return tag;
    });

    const createdTags = await Promise.all(tagPromises);

    // Create question
    const question = await prisma.question.create({
      data: {
        title,
        description,
        authorId: req.user.id,
        tags: {
          create: createdTags.map((tag: any) => ({
            tagId: tag.id
          }))
        }
      },
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
        _count: {
          select: {
            answers: true,
            votes: true
          }
        }
      }
    });

    // Emit real-time event
    if (req.io) {
      req.io.emit('new-question', {
        ...question,
        score: 0,
        upvotes: 0,
        downvotes: 0
      });
    }

    res.status(201).json({
      ...question,
      score: 0,
      upvotes: 0,
      downvotes: 0
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete question (admin only)
router.delete('/:id', auth, admin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const question = await prisma.question.findUnique({
      where: { id }
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    await prisma.question.delete({
      where: { id }
    });

    // Emit real-time event
    if (req.io) {
      req.io.emit('question-deleted', { questionId: id });
    }

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
