import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { auth } from '../middleware/auth';

const router = express.Router();

// Vote on question or answer
router.post('/', auth, [
  body('type').isIn(['UP', 'DOWN']),
  body('targetType').isIn(['question', 'answer']),
  body('targetId').isString()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, targetType, targetId } = req.body;
    const userId = req.user?.id;

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Determine vote data based on target type
    const voteData = {
      type,
      userId: req.user.id,
      [targetType === 'question' ? 'questionId' : 'answerId']: targetId
    };

    // Check if target exists
    let target;
    if (targetType === 'question') {
      target = await prisma.question.findUnique({ where: { id: targetId } });
    } else {
      target = await prisma.answer.findUnique({ where: { id: targetId } });
    }

    if (!target) {
      return res.status(404).json({ error: `${targetType} not found` });
    }

    // Prevent self-voting
    if (target.authorId === userId) {
      return res.status(400).json({ error: 'Cannot vote on your own content' });
    }

    // Check for existing vote
    const existingVote = await prisma.vote.findFirst({
      where: {
        userId: req.user.id,
        [targetType === 'question' ? 'questionId' : 'answerId']: targetId
      }
    });

    if (existingVote) {
      if (existingVote.type === type) {
        // Remove vote if same type
        await prisma.vote.delete({
          where: { id: existingVote.id }
        });
        
        // Get updated vote counts
        const votes = await prisma.vote.findMany({
          where: {
            [targetType === 'question' ? 'questionId' : 'answerId']: targetId
          }
        });

        const upvotes = votes.filter(vote => vote.type === 'UP').length;
        const downvotes = votes.filter(vote => vote.type === 'DOWN').length;
        const score = upvotes - downvotes;

        // Emit real-time event
        const eventData = {
          targetType,
          targetId,
          score,
          upvotes,
          downvotes,
          userVote: null
        };

        if (targetType === 'question') {
          if (req.io) {
            req.io.emit('vote-updated', eventData);
          }
        } else {
          const answer = await prisma.answer.findUnique({
            where: { id: targetId },
            select: { questionId: true }
          });
          if (req.io && answer) {
            req.io.to(`question-${answer.questionId}`).emit('vote-updated', eventData);
          }
        }

        return res.json({
          message: 'Vote removed',
          score,
          upvotes,
          downvotes,
          userVote: null
        });
      } else {
        // Update vote to different type
        await prisma.vote.update({
          where: { id: existingVote.id },
          data: { type }
        });
      }
    } else {
      // Create new vote
      await prisma.vote.create({
        data: voteData
      });
    }

    // Get updated vote counts
    const votes = await prisma.vote.findMany({
      where: {
        [targetType === 'question' ? 'questionId' : 'answerId']: targetId
      }
    });

    const upvotes = votes.filter(vote => vote.type === 'UP').length;
    const downvotes = votes.filter(vote => vote.type === 'DOWN').length;
    const score = upvotes - downvotes;

    // Emit real-time event
    const eventData = {
      targetType,
      targetId,
      score,
      upvotes,
      downvotes,
      userVote: type
    };

    if (targetType === 'question') {
      if (req.io) {
        req.io.emit('vote-updated', eventData);
      }
    } else {
      const answer = await prisma.answer.findUnique({
        where: { id: targetId },
        select: { questionId: true }
      });
      if (req.io && answer) {
        req.io.to(`question-${answer.questionId}`).emit('vote-updated', eventData);
      }
    }

    res.json({
      message: 'Vote recorded',
      score,
      upvotes,
      downvotes,
      userVote: type
    });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's vote for a specific target
router.get('/:targetType/:targetId', auth, async (req: Request, res: Response) => {
  try {
    const { targetType, targetId } = req.params;
    const userId = req.user?.id;

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!['question', 'answer'].includes(targetType)) {
      return res.status(400).json({ error: 'Invalid target type' });
    }

    const vote = await prisma.vote.findFirst({
      where: {
        userId: req.user.id,
        [targetType === 'question' ? 'questionId' : 'answerId']: targetId
      }
    });

    res.json({ userVote: vote ? vote.type : null });
  } catch (error) {
    console.error('Get vote error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
