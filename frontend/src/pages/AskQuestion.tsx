import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Tag } from '../types';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { X, Plus, Wand2 } from 'lucide-react';

const schema = yup.object().shape({
  title: yup
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be less than 200 characters')
    .required('Title is required'),
  description: yup
    .string()
    .min(10, 'Description must be at least 10 characters')
    .required('Description is required'),
  tags: yup
    .array()
    .of(yup.string().required())
    .min(1, 'At least one tag is required')
    .max(5, 'Maximum 5 tags allowed')
    .required(),
});

type FormData = {
  title: string;
  description: string;
  tags: string[];
};

const AskQuestion: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      tags: [],
    },
  });

  const selectedTags = watch('tags');

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await api.get<Tag[]>('/tags/popular?limit=20');
      setAvailableTags(response.data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const addTag = (tagName: string) => {
    const trimmedTag = tagName.trim().toLowerCase();
    if (trimmedTag && !selectedTags.includes(trimmedTag) && selectedTags.length < 5) {
      setValue('tags', [...selectedTags, trimmedTag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue('tags', selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(newTag);
    }
  };

  const handleAiGenerate = async () => {
    const topic = prompt('What topic would you like to generate a question about?');
    if (!topic) return;

    setIsAiGenerating(true);
    try {
      console.log('Generating AI question for topic:', topic); // Debug log
      const response = await api.post('/ai/generate-question', {
        topic,
        tags: selectedTags,
        difficulty: 'intermediate'
      });

      console.log('AI generation response:', response.data); // Debug log

      if (response.data.success) {
        const { title, description, suggestedTags } = response.data.data;
        
        // Ensure minimum length requirements
        const finalTitle = title && title.length >= 5 ? title : `How to work with ${topic}?`;
        const finalDescription = description && description.length >= 10 ? description : `I would like to learn more about ${topic}. Can someone explain the basics and provide some examples? What are the best practices and common pitfalls to avoid?`;
        
        console.log('Setting form values:', { finalTitle, finalDescription }); // Debug log
        
        setValue('title', finalTitle);
        setValue('description', finalDescription);
        
        // Add suggested tags
        if (suggestedTags && suggestedTags.length > 0) {
          const newTags = [...selectedTags];
          suggestedTags.forEach((tag: string) => {
            if (newTags.length < 5 && !newTags.includes(tag.toLowerCase())) {
              newTags.push(tag.toLowerCase());
            }
          });
          setValue('tags', newTags);
          console.log('Set tags from suggestions:', newTags); // Debug log
        } else if (selectedTags.length === 0) {
          // Ensure at least one tag
          const topicTag = topic.toLowerCase().replace(/\s+/g, '-');
          setValue('tags', [topicTag]);
          console.log('Set fallback tag:', [topicTag]); // Debug log
        }
        
        toast.success('Question generated with AI! 🤖✨');
      } else {
        toast.error('AI generation failed');
      }
    } catch (error: any) {
      console.error('AI generation error:', error); // Debug log
      const message = error.response?.data?.error || 'AI generation failed';
      toast.error(message);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    console.log('Submitting question data:', data); // Debug log
    
    // Additional validation and data cleaning
    if (!data.title || data.title.length < 5) {
      toast.error('Title must be at least 5 characters long');
      return;
    }
    if (!data.description || data.description.length < 10) {
      toast.error('Description must be at least 10 characters long');
      return;
    }
    if (!data.tags || data.tags.length === 0) {
      toast.error('At least one tag is required');
      return;
    }
    
    // Ensure tags are properly formatted as strings
    const cleanedData = {
      ...data,
      tags: data.tags.map(tag => String(tag).trim().toLowerCase()).filter(tag => tag.length > 0)
    };
    
    console.log('Cleaned data for submission:', cleanedData); // Debug log
    
    setIsLoading(true);
    try {
      const response = await api.post('/questions', cleanedData);
      console.log('Question posted successfully:', response.data); // Debug log
      toast.success('Question posted successfully!');
      navigate(`/question/${response.data.id}`);
    } catch (error: any) {
      console.error('Question post error:', error); // Debug log
      console.error('Error response:', error.response?.data); // Debug log
      
      // Handle validation errors specifically
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        console.log('Validation errors:', validationErrors); // Debug log
        validationErrors.forEach((err: any) => {
          toast.error(`${err.path || err.param}: ${err.msg}`);
        });
      } else {
        const message = error.response?.data?.error || error.response?.data?.message || 'Failed to post question';
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 space-y-4 md:space-y-0">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Ask a Question</h1>
          <button
            type="button"
            onClick={handleAiGenerate}
            disabled={isAiGenerating}
            className="inline-flex items-center px-3 md:px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors w-full md:w-auto justify-center"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            {isAiGenerating ? 'Generating...' : 'Generate with AI'}
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Question Title *
            </label>
            <input
              {...register('title')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
              placeholder="What's your programming question? Be specific."
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Question Details *
            </label>
            <textarea
              {...register('description')}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base md:rows-8"
              placeholder="Provide more details about your question. Include any code, error messages, or steps you've already tried."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags * (up to 5)
            </label>
            
            {/* Selected Tags */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-primary-600 hover:text-primary-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add New Tag */}
            {selectedTags.length < 5 && (
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Add a tag (e.g., react, javascript, python)"
                />
                <button
                  type="button"
                  onClick={() => addTag(newTag)}
                  disabled={!newTag.trim()}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Popular Tags */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Popular tags:</p>
              <div className="flex flex-wrap gap-2">
                {availableTags
                  .filter(tag => !selectedTags.includes(tag.name))
                  .slice(0, 10)
                  .map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => addTag(tag.name)}
                      disabled={selectedTags.length >= 5}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {tag.name}
                    </button>
                  ))}
              </div>
            </div>

            {errors.tags && (
              <p className="mt-1 text-sm text-red-600">{errors.tags.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Posting...' : 'Post Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AskQuestion;
