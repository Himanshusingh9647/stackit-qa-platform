import React from 'react';
import { Link } from 'react-router-dom';
import { Question } from '../types';
import { useAuth } from '../contexts/AuthContext';
import VoteButton from './VoteButton';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { formatDateTime } from '../utils/dateUtils';
import { MessageCircle, User, Clock, Trash2, Crown, Star, ChevronRight } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  onDelete?: (questionId: string) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onDelete }) => {
  const { user } = useAuth();

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/questions/${question.id}`);
      toast.success('Question deleted successfully');
      if (onDelete) {
        onDelete(question.id);
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to delete question';
      toast.error(message);
    }
  };

  const isHighlyUpvoted = question.score >= 10;
  const isNew = new Date(question.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000;

  return (
    <div className="card p-6 group hover:scale-[1.02] transition-all duration-300">
      <div className="flex space-x-6">
        {/* Vote Section */}
        <div className="flex flex-col items-center space-y-3 min-w-0">
          <VoteButton
            targetType="question"
            targetId={question.id}
            score={question.score}
            upvotes={question.upvotes}
            downvotes={question.downvotes}
          />
          <div className="flex items-center text-sm text-primary-500 bg-primary-50 px-2 py-1 rounded-lg">
            <MessageCircle className="h-4 w-4 mr-1" />
            <span className="font-medium">{question._count.answers}</span>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {isNew && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-accent-500 to-accent-600 text-white">
                    <Star className="h-3 w-3 mr-1" />
                    New
                  </span>
                )}
                {isHighlyUpvoted && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-warning to-yellow-500 text-white">
                    🔥 Hot
                  </span>
                )}
              </div>
              
              <Link
                to={`/question/${question.id}`}
                className="block group-hover:text-accent-600 transition-colors"
              >
                <h3 className="text-xl font-bold text-primary-900 mb-3 leading-tight">
                  {question.title}
                  <ChevronRight className="inline-block h-5 w-5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h3>
              </Link>
            </div>

            {/* Admin Actions */}
            {user?.isAdmin && (
              <button
                onClick={handleDelete}
                className="btn-danger text-xs px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete question"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </button>
            )}
          </div>
          
          <p className="text-primary-700 text-base leading-relaxed mb-4">
            {question.description.length > 200
              ? `${question.description.substring(0, 200)}...`
              : question.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {question.tags.map((questionTag) => (
              <span
                key={questionTag.id}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: `${questionTag.tag.color}15`,
                  color: questionTag.tag.color,
                  border: `1px solid ${questionTag.tag.color}30`,
                }}
              >
                #{questionTag.tag.name}
              </span>
            ))}
          </div>

          {/* Meta Information */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-accent-500 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-primary-800">{question.author.username}</span>
                    {question.author.isAdmin && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-accent-500 to-accent-600 text-white">
                        <Crown className="h-3 w-3 mr-1" />
                        Admin
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center text-sm text-primary-500">
                <Clock className="h-4 w-4 mr-1" />
                <span>{formatDateTime(question.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
