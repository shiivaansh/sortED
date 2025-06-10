import React, { useState } from 'react';
import { Calendar, Clock, Zap, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import { aiService, ScheduleOptimizationRequest, ScheduleOptimizationResponse } from '../services/aiService';

interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  estimatedHours: number;
  priority: number;
}

interface AISmartSchedulerProps {
  assignments?: Assignment[];
}

const AISmartScheduler: React.FC<AISmartSchedulerProps> = ({ assignments }) => {
  const [optimizedSchedule, setOptimizedSchedule] = useState<ScheduleOptimizationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    preferredStudyTimes: ['14:00-18:00'],
    breakDuration: 15,
    maxSessionLength: 120
  });

  // Mock assignments if none provided
  const defaultAssignments: Assignment[] = [
    {
      id: '1',
      title: 'Physics Lab Report',
      subject: 'Physics',
      dueDate: '2024-01-25',
      estimatedHours: 4,
      priority: 8
    },
    {
      id: '2',
      title: 'Math Problem Set',
      subject: 'Mathematics',
      dueDate: '2024-01-27',
      estimatedHours: 3,
      priority: 7
    },
    {
      id: '3',
      title: 'Chemistry Research Paper',
      subject: 'Chemistry',
      dueDate: '2024-01-30',
      estimatedHours: 6,
      priority: 9
    }
  ];

  const assignmentList = assignments || defaultAssignments;

  const optimizeSchedule = async () => {
    setIsLoading(true);
    try {
      const request: ScheduleOptimizationRequest = {
        assignments: assignmentList,
        availableHours: [
          { day: 'Monday', startTime: '14:00', endTime: '18:00' },
          { day: 'Tuesday', startTime: '15:00', endTime: '19:00' },
          { day: 'Wednesday', startTime: '14:00', endTime: '17:00' },
          { day: 'Thursday', startTime: '16:00', endTime: '20:00' },
          { day: 'Friday', startTime: '14:00', endTime: '18:00' },
          { day: 'Saturday', startTime: '10:00', endTime: '16:00' },
          { day: 'Sunday', startTime: '10:00', endTime: '14:00' }
        ],
        preferences
      };

      const response = await aiService.optimizeSchedule(request);
      setOptimizedSchedule(response);
    } catch (error) {
      console.error('Failed to optimize schedule:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProductivityColor = (productivity: number) => {
    if (productivity >= 0.8) return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-300';
    if (productivity >= 0.6) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-300';
    return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-300';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full flex items-center justify-center mr-3">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Smart Scheduler
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Optimize your study schedule with AI
            </p>
          </div>
        </div>
        <button
          onClick={optimizeSchedule}
          disabled={isLoading}
          className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-lg hover:from-indigo-600 hover:to-blue-600 disabled:opacity-50 transition-colors flex items-center"
        >
          {isLoading ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Optimizing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Optimize Schedule
            </>
          )}
        </button>
      </div>

      {/* Preferences */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Study Preferences</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Break Duration (minutes)
            </label>
            <input
              type="number"
              value={preferences.breakDuration}
              onChange={(e) => setPreferences({
                ...preferences,
                breakDuration: parseInt(e.target.value) || 15
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Max Session (minutes)
            </label>
            <input
              type="number"
              value={preferences.maxSessionLength}
              onChange={(e) => setPreferences({
                ...preferences,
                maxSessionLength: parseInt(e.target.value) || 120
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Preferred Time
            </label>
            <select
              value={preferences.preferredStudyTimes[0]}
              onChange={(e) => setPreferences({
                ...preferences,
                preferredStudyTimes: [e.target.value]
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="09:00-13:00">Morning (9 AM - 1 PM)</option>
              <option value="14:00-18:00">Afternoon (2 PM - 6 PM)</option>
              <option value="19:00-23:00">Evening (7 PM - 11 PM)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Current Assignments */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Assignments to Schedule</h4>
        <div className="space-y-2">
          {assignmentList.map((assignment) => (
            <div
              key={assignment.id}
              className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
            >
              <div>
                <h5 className="font-medium text-gray-900 dark:text-white">{assignment.title}</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {assignment.subject} • Due: {new Date(assignment.dueDate).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {assignment.estimatedHours}h
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Priority: {assignment.priority}/10
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Optimized Schedule */}
      {optimizedSchedule && (
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
              Optimized Schedule
            </h4>
            <div className="space-y-3">
              {optimizedSchedule.optimizedSchedule.map((item, index) => {
                const assignment = assignmentList.find(a => a.id === item.assignmentId);
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                      <div>
                        <h6 className="font-medium text-gray-900 dark:text-white">
                          {assignment?.title}
                        </h6>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(item.scheduledDate).toLocaleDateString()} • {item.startTime} - {item.endTime}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getProductivityColor(item.estimatedProductivity)}`}>
                        {Math.round(item.estimatedProductivity * 100)}% productivity
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Insights */}
          {optimizedSchedule.insights.length > 0 && (
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                AI Insights
              </h5>
              <div className="space-y-2">
                {optimizedSchedule.insights.map((insight, index) => (
                  <div
                    key={index}
                    className="flex items-start p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
                  >
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-green-800 dark:text-green-300">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {optimizedSchedule.warnings.length > 0 && (
            <div>
              <h5 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
                Warnings
              </h5>
              <div className="space-y-2">
                {optimizedSchedule.warnings.map((warning, index) => (
                  <div
                    key={index}
                    className="flex items-start p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
                  >
                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">{warning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!optimizedSchedule && !isLoading && (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Ready to Optimize
          </h4>
          <p className="text-gray-500 dark:text-gray-400">
            Click "Optimize Schedule" to get AI-powered study schedule recommendations.
          </p>
        </div>
      )}
    </div>
  );
};

export default AISmartScheduler;