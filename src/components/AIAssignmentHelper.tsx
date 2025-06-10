import React, { useState } from 'react';
import { Brain, Clock, Target, BookOpen, Loader, CheckCircle } from 'lucide-react';
import { aiService, AssignmentHelpRequest, AssignmentHelpResponse } from '../services/aiService';

interface AIAssignmentHelperProps {
  assignment?: {
    id: string;
    title: string;
    subject: string;
    dueDate: string;
    description?: string;
  };
  onClose?: () => void;
}

const AIAssignmentHelper: React.FC<AIAssignmentHelperProps> = ({ assignment, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [helpResponse, setHelpResponse] = useState<AssignmentHelpResponse | null>(null);
  const [currentProgress, setCurrentProgress] = useState('');

  const getAssignmentHelp = async () => {
    if (!assignment) return;

    setIsLoading(true);
    try {
      const request: AssignmentHelpRequest = {
        assignmentTitle: assignment.title,
        subject: assignment.subject,
        description: assignment.description || '',
        dueDate: assignment.dueDate,
        currentProgress: currentProgress,
      };

      const response = await aiService.getAssignmentHelp(request);
      setHelpResponse(response);
    } catch (error) {
      console.error('Failed to get assignment help:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-300';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'low':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-300';
    }
  };

  if (!assignment) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-center py-8">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            AI Assignment Helper
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Select an assignment to get AI-powered assistance and study recommendations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Assignment Helper
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Get personalized assistance for your assignment
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ×
          </button>
        )}
      </div>

      {/* Assignment Info */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">{assignment.title}</h4>
        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
          <span className="flex items-center">
            <BookOpen className="w-4 h-4 mr-1" />
            {assignment.subject}
          </span>
          <span className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            Due: {new Date(assignment.dueDate).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Current Progress Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Current Progress (Optional)
        </label>
        <textarea
          value={currentProgress}
          onChange={(e) => setCurrentProgress(e.target.value)}
          placeholder="Describe what you've already done or any specific challenges you're facing..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
          rows={3}
        />
      </div>

      {/* Get Help Button */}
      <button
        onClick={getAssignmentHelp}
        disabled={isLoading}
        className="w-full mb-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <Loader className="w-5 h-5 mr-2 animate-spin" />
            Analyzing Assignment...
          </>
        ) : (
          <>
            <Brain className="w-5 h-5 mr-2" />
            Get AI Assistance
          </>
        )}
      </button>

      {/* AI Response */}
      {helpResponse && (
        <div className="space-y-6">
          {/* Suggestions */}
          <div>
            <h5 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-600" />
              AI Suggestions
            </h5>
            <div className="space-y-2">
              {helpResponse.suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-start p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                >
                  <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-800 dark:text-blue-300">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Study Plan */}
          <div>
            <h5 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-green-600" />
              Recommended Study Plan
            </h5>
            <div className="space-y-3">
              {helpResponse.studyPlan.map((task, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{task.task}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Estimated time: {task.estimatedTime} hours
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Resources */}
          {helpResponse.resources.length > 0 && (
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
                Recommended Resources
              </h5>
              <div className="space-y-2">
                {helpResponse.resources.map((resource, index) => (
                  <a
                    key={index}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{resource.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{resource.type}</p>
                      </div>
                      <div className="text-blue-600 dark:text-blue-400">→</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAssignmentHelper;