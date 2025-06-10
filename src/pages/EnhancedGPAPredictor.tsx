import React, { useState } from 'react';
import { TrendingUp, Calculator, BookOpen, Target, Plus, Trash2, Brain, Zap } from 'lucide-react';
import { aiService, GPAPredictionRequest, GPAPredictionResponse } from '../services/aiService';
import type { GradeSubject } from '../types';

const EnhancedGPAPredictor: React.FC = () => {
  const [subjects, setSubjects] = useState<GradeSubject[]>([
    { name: 'Mathematics', marks: 85, maxMarks: 100 },
    { name: 'Physics', marks: 78, maxMarks: 100 },
    { name: 'Chemistry', marks: 92, maxMarks: 100 },
    { name: 'English', marks: 88, maxMarks: 100 },
    { name: 'Computer Science', marks: 95, maxMarks: 100 },
  ]);

  const [newSubject, setNewSubject] = useState({ name: '', marks: 0, maxMarks: 100 });
  const [targetGPA, setTargetGPA] = useState(9.0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [aiPrediction, setAiPrediction] = useState<GPAPredictionResponse | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [studyHoursPerWeek, setStudyHoursPerWeek] = useState(20);
  const [currentSemester, setCurrentSemester] = useState(3);

  const calculateGPA = (subjects: GradeSubject[]) => {
    if (subjects.length === 0) return 0;
    
    const totalPercentage = subjects.reduce((sum, subject) => {
      return sum + (subject.marks / subject.maxMarks) * 100;
    }, 0);
    
    const averagePercentage = totalPercentage / subjects.length;
    
    // GPA mapping
    if (averagePercentage >= 90) return 10;
    if (averagePercentage >= 80) return 9;
    if (averagePercentage >= 70) return 8;
    if (averagePercentage >= 60) return 7;
    if (averagePercentage >= 50) return 6;
    if (averagePercentage >= 40) return 5;
    return 4;
  };

  const getGradeFromPercentage = (percentage: number) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    return 'F';
  };

  const currentGPA = calculateGPA(subjects);

  const addSubject = () => {
    if (newSubject.name && newSubject.marks >= 0 && newSubject.maxMarks > 0) {
      setSubjects([...subjects, { ...newSubject }]);
      setNewSubject({ name: '', marks: 0, maxMarks: 100 });
      setShowAddForm(false);
    }
  };

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const updateSubject = (index: number, field: keyof GradeSubject, value: string | number) => {
    const updatedSubjects = subjects.map((subject, i) => {
      if (i === index) {
        return { ...subject, [field]: value };
      }
      return subject;
    });
    setSubjects(updatedSubjects);
  };

  const getAIPrediction = async () => {
    setIsLoadingAI(true);
    try {
      const request: GPAPredictionRequest = {
        subjects: subjects.map(subject => ({
          name: subject.name,
          currentGrade: (subject.marks / subject.maxMarks) * 100,
          creditHours: 3, // Default credit hours
          difficulty: subject.name.toLowerCase().includes('math') || subject.name.toLowerCase().includes('physics') ? 'hard' : 'medium'
        })),
        targetGPA,
        currentSemester,
        studyHoursPerWeek
      };

      const response = await aiService.predictGPA(request);
      setAiPrediction(response);
    } catch (error) {
      console.error('Failed to get AI prediction:', error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const getRiskColor = (riskLevel: 'low' | 'medium' | 'high') => {
    switch (riskLevel) {
      case 'low':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-300';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'high':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-300';
    }
  };

  const stats = [
    {
      title: 'Current GPA',
      value: currentGPA.toFixed(1),
      icon: TrendingUp,
      color: currentGPA >= 8 ? 'text-green-600' : currentGPA >= 6 ? 'text-yellow-600' : 'text-red-600',
      bgColor: currentGPA >= 8 ? 'bg-green-50 dark:bg-green-900/20' : currentGPA >= 6 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-red-50 dark:bg-red-900/20'
    },
    {
      title: 'AI Predicted GPA',
      value: aiPrediction ? aiPrediction.predictedGPA.toFixed(1) : '--',
      icon: Brain,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: 'Total Subjects',
      value: subjects.length,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Target GPA',
      value: targetGPA.toFixed(1),
      icon: Target,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Brain className="w-8 h-8 mr-3 text-purple-600" />
            AI-Enhanced GPA Predictor
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Advanced GPA prediction powered by your custom AI model
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Subject
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className={`${stat.bgColor} rounded-xl p-6 border border-gray-200 dark:border-gray-700`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                {stat.title === 'AI Predicted GPA' && aiPrediction && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {Math.round(aiPrediction.confidence * 100)}% confidence
                  </p>
                )}
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Configuration */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-purple-600" />
              AI Configuration
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Semester
                </label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={currentSemester}
                  onChange={(e) => setCurrentSemester(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Study Hours per Week
                </label>
                <input
                  type="number"
                  min="1"
                  max="80"
                  value={studyHoursPerWeek}
                  onChange={(e) => setStudyHoursPerWeek(parseInt(e.target.value) || 20)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target GPA
                </label>
                <input
                  type="number"
                  min="4"
                  max="10"
                  step="0.1"
                  value={targetGPA}
                  onChange={(e) => setTargetGPA(parseFloat(e.target.value) || 4)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <button
                onClick={getAIPrediction}
                disabled={isLoadingAI || subjects.length === 0}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
              >
                {isLoadingAI ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5 mr-2" />
                    Get AI Prediction
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Insights */}
          {aiPrediction && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                AI Insights
              </h3>
              
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {aiPrediction.predictedGPA.toFixed(1)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Predicted GPA ({Math.round(aiPrediction.confidence * 100)}% confidence)
                  </p>
                </div>

                {aiPrediction.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Recommendations
                    </h4>
                    <div className="space-y-2">
                      {aiPrediction.recommendations.map((rec, index) => (
                        <div
                          key={index}
                          className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-sm text-purple-800 dark:text-purple-300"
                        >
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Subjects */}
        <div className="lg:col-span-2 space-y-4">
          {showAddForm && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Subject</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Subject name"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="number"
                  placeholder="Marks obtained"
                  value={newSubject.marks}
                  onChange={(e) => setNewSubject({ ...newSubject, marks: parseInt(e.target.value) || 0 })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="number"
                  placeholder="Maximum marks"
                  value={newSubject.maxMarks}
                  onChange={(e) => setNewSubject({ ...newSubject, maxMarks: parseInt(e.target.value) || 100 })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={addSubject}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Subject
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Subject Grades</h3>
            <div className="space-y-4">
              {subjects.map((subject, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={subject.name}
                      onChange={(e) => updateSubject(index, 'name', e.target.value)}
                      className="font-medium text-gray-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={subject.marks}
                      onChange={(e) => updateSubject(index, 'marks', parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <span className="text-gray-500 dark:text-gray-400">/</span>
                    <input
                      type="number"
                      value={subject.maxMarks}
                      onChange={(e) => updateSubject(index, 'maxMarks', parseInt(e.target.value) || 100)}
                      className="w-16 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400 w-16 text-center">
                    {((subject.marks / subject.maxMarks) * 100).toFixed(1)}%
                  </div>
                  <div className={`text-sm font-bold w-10 text-center ${
                    getGradeFromPercentage((subject.marks / subject.maxMarks) * 100) === 'A+' ? 'text-green-600' :
                    getGradeFromPercentage((subject.marks / subject.maxMarks) * 100) === 'A' ? 'text-blue-600' :
                    getGradeFromPercentage((subject.marks / subject.maxMarks) * 100).includes('B') ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {getGradeFromPercentage((subject.marks / subject.maxMarks) * 100)}
                  </div>
                  <button
                    onClick={() => removeSubject(index)}
                    className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Subject Insights */}
          {aiPrediction && aiPrediction.subjectInsights.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                AI Subject Analysis
              </h3>
              <div className="space-y-3">
                {aiPrediction.subjectInsights.map((insight, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{insight.subject}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Recommended study hours: {insight.recommendedStudyHours}h/week
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Improvement potential: {Math.round(insight.improvementPotential * 100)}%
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getRiskColor(insight.riskLevel)}`}>
                      {insight.riskLevel} risk
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedGPAPredictor;