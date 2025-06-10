import React, { useState } from 'react';
import { Brain, Sparkles, MessageSquare, Calendar, BookOpen, TrendingUp } from 'lucide-react';
import AIStudyAssistant from '../components/AIStudyAssistant';
import AIAssignmentHelper from '../components/AIAssignmentHelper';
import AILearningRecommendations from '../components/AILearningRecommendations';
import AISmartScheduler from '../components/AISmartScheduler';

type AITool = 'assistant' | 'assignments' | 'recommendations' | 'scheduler' | 'gpa';

const AIHub: React.FC = () => {
  const [activeTool, setActiveTool] = useState<AITool>('assistant');

  const tools = [
    {
      id: 'assistant' as AITool,
      name: 'Study Assistant',
      description: 'Get instant help with your studies',
      icon: MessageSquare,
      color: 'from-blue-500 to-purple-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      id: 'assignments' as AITool,
      name: 'Assignment Helper',
      description: 'AI-powered assignment assistance',
      icon: BookOpen,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      id: 'recommendations' as AITool,
      name: 'Learning Recommendations',
      description: 'Personalized content suggestions',
      icon: Sparkles,
      color: 'from-pink-500 to-orange-500',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20'
    },
    {
      id: 'scheduler' as AITool,
      name: 'Smart Scheduler',
      description: 'Optimize your study schedule',
      icon: Calendar,
      color: 'from-indigo-500 to-blue-500',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20'
    },
    {
      id: 'gpa' as AITool,
      name: 'GPA Predictor',
      description: 'AI-enhanced GPA predictions',
      icon: TrendingUp,
      color: 'from-green-500 to-teal-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    }
  ];

  const renderActiveTool = () => {
    switch (activeTool) {
      case 'assistant':
        return <AIStudyAssistant />;
      case 'assignments':
        return <AIAssignmentHelper />;
      case 'recommendations':
        return <AILearningRecommendations />;
      case 'scheduler':
        return <AISmartScheduler />;
      case 'gpa':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Enhanced GPA Predictor
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Your AI-powered GPA prediction model will be integrated here.
              </p>
              <button
                onClick={() => window.location.href = '/dashboard/gpa-predictor'}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Go to GPA Predictor
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Brain className="w-8 h-8 mr-3 text-blue-600" />
            AI Hub
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Powered by artificial intelligence to enhance your learning experience
          </p>
        </div>
      </div>

      {/* AI Tools Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
              activeTool === tool.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
            }`}
          >
            <div className={`w-10 h-10 bg-gradient-to-r ${tool.color} rounded-lg flex items-center justify-center mb-3`}>
              <tool.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className={`font-semibold mb-1 ${
              activeTool === tool.id ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'
            }`}>
              {tool.name}
            </h3>
            <p className={`text-sm ${
              activeTool === tool.id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'
            }`}>
              {tool.description}
            </p>
          </button>
        ))}
      </div>

      {/* Active Tool Content */}
      <div className="min-h-96">
        {renderActiveTool()}
      </div>

      {/* AI Service Status */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                AI Service Status
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Using mock responses - Connect your Python service to enable full AI features
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Service URL: {process.env.REACT_APP_AI_SERVICE_URL || 'http://localhost:8000'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIHub;