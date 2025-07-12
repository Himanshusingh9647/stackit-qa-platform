import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

interface VoteButtonProps {
  targetType: 'question' | 'answer';
  targetId: string;
  score: number;
  upvotes: number;
  downvotes: number;
  size?: 'sm' | 'md';
}

const VoteButton: React.FC<VoteButtonProps> = ({
  targetType,
  targetId,
  score: initialScore,
  upvotes: initialUpvotes,
  downvotes: initialDownvotes,
  size = 'md',
}) => {
  const { user } = useAuth();
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState<'UP' | 'DOWN' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUserVote = async () => {
      try {
        const response = await api.get(`/votes/${targetType}/${targetId}`);
        setUserVote(response.data.userVote);
      } catch (error) {
        console.error('Error fetching user vote:', error);
      }
    };

    if (user) {
      fetchUserVote();
    }
  }, [user, targetId, targetType]);

  const handleVote = async (voteType: 'UP' | 'DOWN') => {
    if (!user) {
      toast.error('Please login to vote');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/votes', {
        type: voteType,
        targetType,
        targetId,
      });

      setScore(response.data.score);
      setUserVote(response.data.userVote);

      // Show feedback
      if (response.data.userVote === voteType) {
        toast.success(voteType === 'UP' ? '👍 Upvoted!' : '👎 Downvoted!');
      } else {
        toast.success('Vote removed');
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to vote';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: {
      container: 'space-y-1',
      button: 'p-1.5',
      icon: 'h-4 w-4',
      score: 'text-sm font-semibold',
    },
    md: {
      container: 'space-y-2',
      button: 'p-2.5',
      icon: 'h-5 w-5',
      score: 'text-lg font-bold',
    },
  };

  const classes = sizeClasses[size];
  const isHighScore = score >= 10;

  return (
    <div className={`flex flex-col items-center ${classes.container}`}>
      {/* Upvote Button */}
      <button
        onClick={() => handleVote('UP')}
        disabled={isLoading || !user}
        className={`${classes.button} rounded-xl transition-all duration-200 transform hover:scale-110 ${
          userVote === 'UP'
            ? 'text-white bg-gradient-to-r from-success to-emerald-600 shadow-elegant'
            : 'text-primary-400 hover:text-white hover:bg-gradient-to-r hover:from-success hover:to-emerald-600 hover:shadow-elegant bg-primary-50 hover:bg-transparent'
        } ${!user ? 'cursor-not-allowed opacity-50' : ''} ${isLoading ? 'animate-pulse' : ''}`}
        title={!user ? 'Login to vote' : userVote === 'UP' ? 'Remove upvote' : 'Upvote'}
      >
        <ChevronUp className={`${classes.icon} ${userVote === 'UP' ? 'animate-bounce' : ''}`} />
      </button>

      {/* Score Display */}
      <div className="flex flex-col items-center">
        <span className={`${classes.score} transition-all duration-300 ${
          isHighScore 
            ? 'text-gradient bg-gradient-to-r from-success to-emerald-600 bg-clip-text' 
            : score > 0 
              ? 'text-success' 
              : score < 0 
                ? 'text-error' 
                : 'text-primary-600'
        }`}>
          {score}
        </span>
        {isHighScore && (
          <TrendingUp className="h-3 w-3 text-success animate-pulse-soft" />
        )}
      </div>

      {/* Downvote Button */}
      <button
        onClick={() => handleVote('DOWN')}
        disabled={isLoading || !user}
        className={`${classes.button} rounded-xl transition-all duration-200 transform hover:scale-110 ${
          userVote === 'DOWN'
            ? 'text-white bg-gradient-to-r from-error to-red-600 shadow-elegant'
            : 'text-primary-400 hover:text-white hover:bg-gradient-to-r hover:from-error hover:to-red-600 hover:shadow-elegant bg-primary-50 hover:bg-transparent'
        } ${!user ? 'cursor-not-allowed opacity-50' : ''} ${isLoading ? 'animate-pulse' : ''}`}
        title={!user ? 'Login to vote' : userVote === 'DOWN' ? 'Remove downvote' : 'Downvote'}
      >
        <ChevronDown className={`${classes.icon} ${userVote === 'DOWN' ? 'animate-bounce' : ''}`} />
      </button>
    </div>
  );
};

export default VoteButton;
