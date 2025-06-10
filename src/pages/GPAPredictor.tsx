import React, { useState } from 'react';
import { TrendingUp, Calculator, BookOpen, Target, Plus, Trash2 } from 'lucide-react';
import type { GradeSubject } from '../types';

const GPAPredictor: React.FC = () => {
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

  const calculateRequiredMarks = () => {
    const requiredPercentage = targetGPA === 10 ? 90 : (targetGPA - 1) * 10 + 10;
    const totalRequiredMarks = requiredPercentage * subjects.length;
    const currentTotalPercentage = subjects.reduce((sum, subject) => {
      return sum + (subject.marks / subject.maxMarks) * 100;
    }, 0);
    
    return Math.max(0, totalRequiredMarks - currentTotalPercentage);
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
      title: 'Total Subjects',
      value: subjects.length,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Average %',
      value: subjects.length > 0 ? 
        `${(subjects.reduce((sum, s) => sum + (s.marks / s.maxMarks) * 100, 0) / subjects.length).toFixed(1)}%` : 
        '0%',
      icon: Calculator,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">GPA Predictor</h1>
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
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
        </div>

        {/* GPA Analysis */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">GPA Analysis</h3>
            
            <div className="space-y-4">
              <div className="text-center">
                <div className={`text-4xl font-bold mb-2 ${
                  currentGPA >= 9 ? 'text-green-600' :
                  currentGPA >= 8 ? 'text-blue-600' :
                  currentGPA >= 7 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {currentGPA.toFixed(1)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Current GPA</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Progress to Target</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {targetGPA} GPA
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      currentGPA >= targetGPA ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min((currentGPA / targetGPA) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Target GPA</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Set Target GPA
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

              {subjects.length > 0 && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    To achieve {targetGPA} GPA:
                  </p>
                  {currentGPA >= targetGPA ? (
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                      🎉 You've already achieved your target!
                    </p>
                  ) : (
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                      You need an additional {calculateRequiredMarks().toFixed(1)}% average across all subjects.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">GPA Scale</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>90-100%</span>
                <span className="font-medium text-green-600">10.0 GPA (A+)</span>
              </div>
              <div className="flex justify-between">
                <span>80-89%</span>
                <span className="font-medium text-blue-600">9.0 GPA (A)</span>
              </div>
              <div className="flex justify-between">
                <span>70-79%</span>
                <span className="font-medium text-yellow-600">8.0 GPA (B+)</span>
              </div>
              <div className="flex justify-between">
                <span>60-69%</span>
                <span className="font-medium text-orange-600">7.0 GPA (B)</span>
              </div>
              <div className="flex justify-between">
                <span>50-59%</span>
                <span className="font-medium text-red-600">6.0 GPA (C+)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GPAPredictor;