import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../lib/prisma';
import { auth, admin } from '../middleware/auth';
import { createNotification } from './notifications';

const router = express.Router();

// Create new answer
router.post('/', auth, [
  body('content').isLength({ min: 10 }).trim(),
  body('questionId').isString()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, questionId } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if question exists
    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Create answer
    const answer = await prisma.answer.create({
      data: {
        content,
        authorId: req.user.id,
        questionId
      },
      include: {
        author: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    // Create notification for question author (if not answering own question)
    if (question.authorId !== req.user.id) {
      await createNotification({
        type: 'ANSWER_CREATED',
        message: `${req.user.username} answered your question: "${question.title}"`,
        receiverId: question.authorId,
        senderId: req.user.id,
        questionId: question.id,
        answerId: answer.id
      });
    }

    const answerWithVotes = {
      ...answer,
      score: 0,
      upvotes: 0,
      downvotes: 0
    };

    // Emit real-time event to question room
    if (req.io) {
      req.io.to(`question-${questionId}`).emit('new-answer', answerWithVotes);
      
      // Emit notification event if notification was created
      if (question.authorId !== req.user.id) {
        req.io.to(`user-${question.authorId}`).emit('new-notification', {
          type: 'ANSWER_CREATED',
          message: `${req.user.username} answered your question`,
          questionId: question.id
        });
      }
    }

    res.status(201).json(answerWithVotes);
  } catch (error) {
    console.error('Create answer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update answer
router.put('/:id', auth, [
  body('content').isLength({ min: 10 }).trim()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { content } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if answer exists and user owns it
    const answer = await prisma.answer.findUnique({
      where: { id }
    });

    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    if (answer.authorId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update answer
    const updatedAnswer = await prisma.answer.update({
      where: { id },
      data: { content },
      include: {
        author: {
          select: {
            id: true,
            username: true
          }
        },
        votes: true
      }
    });

    // Calculate vote scores
    const upvotes = updatedAnswer.votes.filter(vote => vote.type === 'UP').length;
    const downvotes = updatedAnswer.votes.filter(vote => vote.type === 'DOWN').length;
    const score = upvotes - downvotes;

    const answerWithVotes = {
      ...updatedAnswer,
      score,
      upvotes,
      downvotes,
      votes: undefined
    };

    // Emit real-time event
    if (req.io) {
      req.io.to(`question-${answer.questionId}`).emit('answer-updated', answerWithVotes);
    }

    res.json(answerWithVotes);
  } catch (error) {
    console.error('Update answer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete answer
router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if answer exists and user owns it or is admin
    const answer = await prisma.answer.findUnique({
      where: { id }
    });

    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    if (answer.authorId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.answer.delete({
      where: { id }
    });

    // Emit real-time event
    if (req.io) {
      req.io.to(`question-${answer.questionId}`).emit('answer-deleted', { answerId: id });
    }

    res.json({ message: 'Answer deleted successfully' });
  } catch (error) {
    console.error('Delete answer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
