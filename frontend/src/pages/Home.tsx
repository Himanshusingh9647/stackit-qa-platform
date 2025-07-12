import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Filter, Sparkles, TrendingUp, Clock, Search, Zap } from 'lucide-react';
import { Question, QuestionsResponse } from '../types';
import { useAuth } from '../contexts/AuthContext';
import QuestionCard from '../components/QuestionCard';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../utils/api';
import socketService from '../utils/socket';

const Home: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'score'>('createdAt');
  const [order, setOrder] = useState<'desc' | 'asc'>('desc');

  // Get search query from URL params
  const searchQuery = searchParams.get('q');

  const handleQuestionDelete = (questionId: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  useEffect(() => {
    fetchQuestions();
  }, [sortBy, order, searchQuery]);

  useEffect(() => {
    if (user) {
      // Listen for real-time question updates
      socketService.onNewQuestion((question: Question) => {
        setQuestions((prev) => [question, ...prev]);
      });

      socketService.onQuestionDeleted((data: { questionId: string }) => {
        setQuestions((prev) => prev.filter((q) => q.id !== data.questionId));
      });

      socketService.onVoteUpdated((data: any) => {
        if (data.targetType === 'question') {
          setQuestions((prev) =>
            prev.map((q) =>
              q.id === data.targetId
                ? {
                    ...q,
                    score: data.score,
                    upvotes: data.upvotes,
                    downvotes: data.downvotes,
                  }
                : q
            )
          );
        }
      });
    }

    return () => {
      socketService.removeAllListeners();
    };
  }, [user]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      
      // Use search endpoint if there's a search query, otherwise use regular questions endpoint
      const endpoint = searchQuery ? '/search/questions' : '/questions';
      const params: any = { sortBy, order, limit: 20 };
      
      if (searchQuery) {
        params.q = searchQuery;
      }
      
      const response = await api.get<QuestionsResponse>(endpoint, { params });
      setQuestions(response.data.questions);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="card max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-gradient-to-r from-error to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-primary-900 mb-2">Oops! Something went wrong</h3>
          <p className="text-primary-600 mb-6">{error}</p>
          <button
            onClick={fetchQuestions}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="relative">
          <h1 className="heading-primary mb-4">
            {searchQuery ? (
              <>
                <Search className="inline-block h-8 w-8 mr-3 text-accent-500" />
                Search Results for "{searchQuery}"
              </>
            ) : (
              <>
                Discover & Share Knowledge
                <Sparkles className="inline-block h-8 w-8 ml-3 text-accent-500 animate-pulse-soft" />
              </>
            )}
          </h1>
          <p className="text-lg text-primary-600 max-w-2xl mx-auto">
            {searchQuery 
              ? `Found ${questions.length} question${questions.length !== 1 ? 's' : ''} matching your search`
              : 'Join our community of developers asking questions, sharing knowledge, and growing together'
            }
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap justify-center gap-4 mb-12">
        {searchQuery && (
          <Link
            to="/"
            className="btn-secondary inline-flex items-center"
          >
            <Search className="h-4 w-4 mr-2" />
            Clear Search
          </Link>
        )}
        {user && (
          <Link
            to="/ask"
            className="btn-primary inline-flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Ask Question
          </Link>
        )}
        {!searchQuery && (
          <button
            onClick={() => {setSortBy('score'); setOrder('desc');}}
            className={`btn-secondary inline-flex items-center ${
              sortBy === 'score' && order === 'desc' ? 'bg-accent-500 text-white border-accent-500' : ''
            }`}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Trending
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      <div className="card p-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-primary-500" />
              <span className="font-medium text-primary-700">Sort by:</span>
            </div>
            <select
              value={`${sortBy}-${order}`}
              onChange={(e) => {
                const [newSortBy, newOrder] = e.target.value.split('-') as [
                  'createdAt' | 'score',
                  'desc' | 'asc'
                ];
                setSortBy(newSortBy);
                setOrder(newOrder);
              }}
              className="input-primary py-2 pr-10 min-w-0"
            >
              <option value="createdAt-desc">🕒 Newest First</option>
              <option value="createdAt-asc">⏰ Oldest First</option>
              <option value="score-desc">🔥 Most Upvoted</option>
              <option value="score-asc">📈 Least Upvoted</option>
            </select>
          </div>
          
          <div className="text-sm text-primary-500 font-medium">
            {questions.length} question{questions.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>

      {/* Questions List */}
      {questions.length === 0 ? (
        <div className="text-center py-16">
          <div className="card max-w-lg mx-auto p-12">
            <div className="w-24 h-24 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-6">
              {searchQuery ? (
                <Search className="h-12 w-12 text-white" />
              ) : (
                <Sparkles className="h-12 w-12 text-white" />
              )}
            </div>
            <h3 className="heading-secondary mb-4">
              {searchQuery ? 'No Results Found' : 'No Questions Yet'}
            </h3>
            <p className="text-primary-600 mb-8">
              {searchQuery 
                ? `No questions found matching "${searchQuery}". Try different keywords or ask a new question.`
                : 'Be the first to start a discussion! Ask a question and help build our knowledge base.'
              }
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {searchQuery && (
                <Link to="/" className="btn-secondary">
                  <Search className="h-4 w-4 mr-2" />
                  Browse All Questions
                </Link>
              )}
              {user && (
                <Link to="/ask" className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  {searchQuery ? 'Ask New Question' : 'Ask the First Question'}
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div 
              key={question.id} 
              className="animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <QuestionCard 
                question={question} 
                onDelete={handleQuestionDelete}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
