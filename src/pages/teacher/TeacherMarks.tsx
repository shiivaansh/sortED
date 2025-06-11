import React, { useState, useEffect } from 'react';
import { TrendingUp, Save, Users, BookOpen, Calculator, Award } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { teacherService, ClassInfo, StudentInfo } from '../../services/teacherService';

interface MarksEntry {
  studentId: string;
  studentName: string;
  marks: number;
  maxMarks: number;
  percentage: number;
  grade: string;
}

const TeacherMarks: React.FC = () => {
  const { currentUser } = useAuth();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [examType, setExamType] = useState<string>('Quiz');
  const [maxMarks, setMaxMarks] = useState<number>(100);
  const [marksEntries, setMarksEntries] = useState<MarksEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadClasses();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedClass) {
      loadStudents();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (students.length > 0) {
      initializeMarksEntries();
    }
  }, [students, maxMarks]);

  const loadClasses = async () => {
    if (!currentUser) return;
    
    try {
      const teacherClasses = await teacherService.getTeacherClasses(currentUser.uid);
      setClasses(teacherClasses);
      if (teacherClasses.length > 0) {
        setSelectedClass(teacherClasses[0].id);
        setSelectedSubject(teacherClasses[0].subject);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const loadStudents = async () => {
    if (!selectedClass) return;
    
    setLoading(true);
    try {
      const classStudents = await teacherService.getClassStudents(selectedClass);
      setStudents(classStudents);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeMarksEntries = () => {
    const entries = students.map(student => ({
      studentId: student.id,
      studentName: student.name,
      marks: 0,
      maxMarks,
      percentage: 0,
      grade: 'F'
    }));
    setMarksEntries(entries);
  };

  const updateMarks = (studentId: string, marks: number) => {
    setMarksEntries(prev => prev.map(entry => {
      if (entry.studentId === studentId) {
        const percentage = (marks / maxMarks) * 100;
        const grade = getGrade(percentage);
        return {
          ...entry,
          marks,
          percentage,
          grade
        };
      }
      return entry;
    }));
  };

  const getGrade = (percentage: number): string => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    return 'F';
  };

  const getGradeColor = (grade: string): string => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-300';
      case 'B+':
      case 'B':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300';
      case 'C+':
      case 'C':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-300';
      default:
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-300';
    }
  };

  const saveMarks = async () => {
    if (!selectedClass || !selectedSubject || marksEntries.length === 0) return;
    
    setSaving(true);
    try {
      const marksData = marksEntries.map(entry => ({
        studentId: entry.studentId,
        marks: entry.marks,
        maxMarks: entry.maxMarks,
        examType
      }));
      
      await teacherService.updateStudentMarks(selectedClass, selectedSubject, marksData);
      alert('✅ Marks saved successfully!');
    } catch (error) {
      console.error('Error saving marks:', error);
      alert('❌ Error saving marks. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const calculateStats = () => {
    if (marksEntries.length === 0) return { average: 0, highest: 0, lowest: 0, passRate: 0 };
    
    const validEntries = marksEntries.filter(entry => entry.marks > 0);
    if (validEntries.length === 0) return { average: 0, highest: 0, lowest: 0, passRate: 0 };
    
    const percentages = validEntries.map(entry => entry.percentage);
    const average = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
    const highest = Math.max(...percentages);
    const lowest = Math.min(...percentages);
    const passRate = (validEntries.filter(entry => entry.percentage >= 40).length / validEntries.length) * 100;
    
    return { average, highest, lowest, passRate };
  };

  const stats = calculateStats();

  const dashboardStats = [
    {
      title: 'Class Average',
      value: `${stats.average.toFixed(1)}%`,
      icon: Calculator,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Highest Score',
      value: `${stats.highest.toFixed(1)}%`,
      icon: Award,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Pass Rate',
      value: `${stats.passRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: 'Total Students',
      value: students.length,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Marks Management</h1>
        <button
          onClick={saveMarks}
          disabled={saving || marksEntries.length === 0}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Marks'}
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                const selectedClassData = classes.find(c => c.id === e.target.value);
                if (selectedClassData) {
                  setSelectedSubject(selectedClassData.subject);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Select a class</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} - {cls.subject}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Subject"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Exam Type
            </label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="Quiz">Quiz</option>
              <option value="Test">Test</option>
              <option value="Midterm">Midterm</option>
              <option value="Final">Final Exam</option>
              <option value="Assignment">Assignment</option>
              <option value="Project">Project</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Maximum Marks
            </label>
            <input
              type="number"
              value={maxMarks}
              onChange={(e) => setMaxMarks(parseInt(e.target.value) || 100)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              min="1"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      {selectedClass && marksEntries.some(entry => entry.marks > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardStats.map((stat, index) => (
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
      )}

      {/* Marks Entry Table */}
      {selectedClass && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Enter Marks - {classes.find(c => c.id === selectedClass)?.name} ({examType})
          </h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No students found</h4>
              <p className="text-gray-500 dark:text-gray-400">This class doesn't have any students yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-600">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Student</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Roll No.</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Marks</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Percentage</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {marksEntries.map((entry, index) => (
                    <tr key={entry.studentId} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {entry.studentName.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{entry.studentName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {students[index]?.rollNumber || `R${index + 1}`}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <input
                            type="number"
                            value={entry.marks}
                            onChange={(e) => updateMarks(entry.studentId, parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            min="0"
                            max={maxMarks}
                          />
                          <span className="text-gray-500 dark:text-gray-400">/ {maxMarks}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {entry.percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getGradeColor(entry.grade)}`}>
                          {entry.grade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!selectedClass && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Select a Class
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Choose a class from the dropdown to start entering marks.
          </p>
        </div>
      )}
    </div>
  );
};

export default TeacherMarks;