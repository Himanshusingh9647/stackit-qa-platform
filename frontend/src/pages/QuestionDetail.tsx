import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Question, Answer } from '../types';
import { useAuth } from '../contexts/AuthContext';
import VoteButton from '../components/VoteButton';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../utils/api';
import socketService from '../utils/socket';
import toast from 'react-hot-toast';
import { formatDateTime } from '../utils/dateUtils';
import { User, Clock, Trash2 } from 'lucide-react';

const answerSchema = yup.object().shape({
  content: yup
    .string()
    .min(10, 'Answer must be at least 10 characters')
    .required('Answer is required'),
});

type AnswerFormData = {
  content: string;
};

const QuestionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AnswerFormData>({
    resolver: yupResolver(answerSchema),
  });

  useEffect(() => {
    if (id) {
      fetchQuestion();
    }
  }, [id]);

  useEffect(() => {
    if (id && user) {
      socketService.joinQuestion(id);

      socketService.onNewAnswer((answer: Answer) => {
        setAnswers((prev) => [...prev, answer]);
      });

      socketService.onAnswerUpdated((answer: Answer) => {
        setAnswers((prev) =>
          prev.map((a) => (a.id === answer.id ? answer : a))
        );
      });

      socketService.onAnswerDeleted((data: { answerId: string }) => {
        setAnswers((prev) => prev.filter((a) => a.id !== data.answerId));
      });

      socketService.onVoteUpdated((data: any) => {
        if (data.targetType === 'question' && question?.id === data.targetId) {
          setQuestion((prev) =>
            prev
              ? {
                  ...prev,
                  score: data.score,
                  upvotes: data.upvotes,
                  downvotes: data.downvotes,
                }
              : null
          );
        } else if (data.targetType === 'answer') {
          setAnswers((prev) =>
            prev.map((a) =>
              a.id === data.targetId
                ? {
                    ...a,
                    score: data.score,
                    upvotes: data.upvotes,
                    downvotes: data.downvotes,
                  }
                : a
            )
          );
        }
      });

      return () => {
        socketService.leaveQuestion(id);
        socketService.removeAllListeners();
      };
    }
  }, [id, user, question?.id]);

  const fetchQuestion = async () => {
    try {
      setLoading(true);
      const response = await api.get<Question>(`/questions/${id}`);
      setQuestion(response.data);
      setAnswers(response.data.answers || []);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setError('Question not found');
      } else {
        setError(error.response?.data?.error || 'Failed to fetch question');
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmitAnswer = async (data: AnswerFormData) => {
    if (!question) return;

    setSubmittingAnswer(true);
    try {
      await api.post('/answers', {
        content: data.content,
        questionId: question.id,
      });
      reset();
      toast.success('Answer posted successfully!');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to post answer';
      toast.error(message);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const deleteAnswer = async (answerId: string) => {
    if (!window.confirm('Are you sure you want to delete this answer?')) return;

    try {
      await api.delete(`/answers/${answerId}`);
      toast.success('Answer deleted successfully');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to delete answer';
      toast.error(message);
    }
  };

  const deleteQuestion = async () => {
    if (!question) return;
    
    if (!window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) return;

    try {
      await api.delete(`/questions/${question.id}`);
      toast.success('Question deleted successfully');
      navigate('/'); // Redirect to home page
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to delete question';
      toast.error(message);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error || !question) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || 'Question not found'}</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Question */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex space-x-6">
          {/* Vote Section */}
          <div className="flex flex-col items-center">
            <VoteButton
              targetType="question"
              targetId={question.id}
              score={question.score}
              upvotes={question.upvotes}
              downvotes={question.downvotes}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-2xl font-bold text-gray-900">{question.title}</h1>
              {user?.isAdmin && (
                <button
                  onClick={deleteQuestion}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  title="Delete Question"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="prose max-w-none mb-6">
              <p className="text-gray-700 whitespace-pre-wrap">{question.description}</p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {question.tags.map((questionTag) => (
                <span
                  key={questionTag.id}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: `${questionTag.tag.color}20`,
                    color: questionTag.tag.color,
                  }}
                >
                  {questionTag.tag.name}
                </span>
              ))}
            </div>

            {/* Meta */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  <span>{question.author.username}</span>
                  {question.author.isAdmin && (
                    <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-800 text-xs rounded">
                      Admin
                    </span>
                  )}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{formatDateTime(question.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Answers */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}
        </h2>

        <div className="space-y-6">
          {answers.map((answer) => (
            <div key={answer.id} className="border-b border-gray-200 pb-6 last:border-b-0">
              <div className="flex space-x-4">
                <div className="flex flex-col items-center">
                  <VoteButton
                    targetType="answer"
                    targetId={answer.id}
                    score={answer.score}
                    upvotes={answer.upvotes}
                    downvotes={answer.downvotes}
                    size="sm"
                  />
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="prose max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap">{answer.content}</p>
                    </div>
                    {(user?.id === answer.authorId || user?.isAdmin) && (
                      <button
                        onClick={() => deleteAnswer(answer.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete Answer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center text-sm text-gray-500">
                    <div className="flex items-center mr-4">
                      <User className="h-4 w-4 mr-1" />
                      <span>{answer.author.username}</span>
                      {answer.author.isAdmin && (
                        <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-800 text-xs rounded">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{formatDateTime(answer.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Answer Form */}
      {user ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Answer</h3>
          <form onSubmit={handleSubmit(onSubmitAnswer)} className="space-y-4">
            <div>
              <textarea
                {...register('content')}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Write your answer here..."
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
              )}
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingAnswer}
                className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingAnswer ? 'Posting...' : 'Post Answer'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
          <p className="text-gray-600 mb-4">Please sign in to post an answer</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Sign In
          </button>
        </div>
      )}
    </div>
  );
};

export default QuestionDetail;
