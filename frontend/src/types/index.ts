export interface User {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
  sender?: {
    id: string;
    username: string;
    isAdmin: boolean;
  };
  question?: {
    id: string;
    title: string;
  };
  answer?: {
    id: string;
    content: string;
    question?: {
      id: string;
      title: string;
    };
  };
}

export enum NotificationType {
  ANSWER_CREATED = 'ANSWER_CREATED',
  QUESTION_ANSWERED = 'QUESTION_ANSWERED',
  MENTION = 'MENTION',
  QUESTION_VOTED = 'QUESTION_VOTED',
  ANSWER_VOTED = 'ANSWER_VOTED',
  ADMIN_MESSAGE = 'ADMIN_MESSAGE'
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  _count?: {
    questions: number;
  };
}

export interface QuestionTag {
  id: string;
  questionId: string;
  tagId: string;
  tag: Tag;
}

export interface Question {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author: User;
  tags: QuestionTag[];
  score: number;
  upvotes: number;
  downvotes: number;
  _count: {
    answers: number;
    votes: number;
  };
  answers?: Answer[];
}

export interface Answer {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author: User;
  questionId: string;
  score: number;
  upvotes: number;
  downvotes: number;
}

export interface Vote {
  id: string;
  type: 'UP' | 'DOWN';
  createdAt: string;
  userId: string;
  questionId?: string;
  answerId?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface QuestionsResponse {
  questions: Question[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface VoteResponse {
  message: string;
  score: number;
  upvotes: number;
  downvotes: number;
  userVote: 'UP' | 'DOWN' | null;
}
