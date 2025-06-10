import React, { useState, useEffect } from 'react';
import { Sparkles, Play, FileText, HelpCircle, BookOpen, Clock, TrendingUp } from 'lucide-react';
import { aiService, LearningRecommendationRequest, LearningRecommendationResponse } from '../services/aiService';

interface AILearningRecommendationsProps {
  studentProfile?: {
    subjects: string[];
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    currentGPA: number;
    weakAreas: string[];
    interests: string[];
  };
}

const AILearningRecommendations: React.FC<AILearningRecommendationsProps> = ({ studentProfile }) => {
  const [recommendations, setRecommendations] = useState<LearningRecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Default student profile for demo
  const defaultProfile = {
    subjects: ['Mathematics', 'Physics', 'Chemistry', 'English'],
    learningStyle: 'visual' as const,
    currentGPA: 8.5,
    weakAreas: ['Calculus', 'Organic Chemistry'],
    interests: ['Science', 'Technology', 'Problem Solving']
  };

  const profile = studentProfile || defaultProfile;

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    setIsLoading(true);
    try {
      const request: LearningRecommendationRequest = {
        studentProfile: profile
      };
      const response = await aiService.getLearningRecommendations(request);
      setRecommendations(response);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="w-5 h-5" />;
      case 'article':
        return <FileText className="w-5 h-5" />;
      case 'practice':
        return <BookOpen className="w-5 h-5" />;
      case 'quiz':
        return <HelpCircle className="w-5 h-5" />;
      default:
        return <BookOpen className="w-5 h-5" />;
    }
  };

  const getResourceColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-300';
      case 'article':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300';
      case 'practice':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-300';
      case 'quiz':
        return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-300';
      case 'intermediate':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'advanced':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full flex items-center justify-center mr-3">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Learning Recommendations
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Personalized content based on your learning profile
            </p>
          </div>
        </div>
        <button
          onClick={loadRecommendations}
          disabled={isLoading}
          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-lg hover:from-pink-600 hover:to-orange-600 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Student Profile Summary */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Your Learning Profile</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Learning Style:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white capitalize">
              {profile.learningStyle}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Current GPA:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {profile.currentGPA}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Subjects:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {profile.subjects.join(', ')}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Focus Areas:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {profile.weakAreas.join(', ')}
            </span>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Generating personalized recommendations...</p>
        </div>
      ) : recommendations ? (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">
            Recommended for You ({recommendations.recommendations.length} items)
          </h4>
          
          {recommendations.recommendations.map((rec, index) => (
            <div
              key={index}
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${getResourceColor(rec.type)}`}>
                    {getResourceIcon(rec.type)}
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                      {rec.title}
                    </h5>
                    <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                      <span>{rec.subject}</span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {rec.estimatedTime} min
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(rec.difficulty)}`}>
                    {rec.difficulty}
                  </span>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    {Math.round(rec.relevanceScore * 100)}%
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 w-24">
                    <div
                      className="bg-gradient-to-r from-pink-500 to-orange-500 h-2 rounded-full"
                      style={{ width: `${rec.relevanceScore * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {Math.round(rec.relevanceScore * 100)}% match
                  </span>
                </div>
                
                <button
                  onClick={() => window.open(rec.url, '_blank')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Start Learning
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Recommendations Yet
          </h4>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Click "Refresh" to get personalized learning recommendations based on your profile.
          </p>
        </div>
      )}
    </div>
  );
};

export default AILearningRecommendations;