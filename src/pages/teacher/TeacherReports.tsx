import React, { useState, useEffect } from 'react';
import { BarChart, Users, TrendingUp, FileText, Brain, Download, Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { teacherService, ClassInfo, StudentInfo } from '../../services/teacherService';

interface StudentPerformance {
  studentId: string;
  studentName: string;
  attendanceRate: number;
  averageGrade: number;
  assignmentSubmissionRate: number;
  overallPerformance: 'excellent' | 'good' | 'average' | 'needs_improvement';
}

const TeacherReports: React.FC = () => {
  const { currentUser } = useAuth();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [performanceData, setPerformanceData] = useState<StudentPerformance[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [aiReport, setAiReport] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadClasses();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedClass) {
      loadClassData();
    }
  }, [selectedClass]);

  const loadClasses = async () => {
    if (!currentUser) return;
    
    try {
      const teacherClasses = await teacherService.getTeacherClasses(currentUser.uid);
      setClasses(teacherClasses);
      if (teacherClasses.length > 0) {
        setSelectedClass(teacherClasses[0].id);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const loadClassData = async () => {
    if (!selectedClass) return;
    
    setLoading(true);
    try {
      const classStudents = await teacherService.getClassStudents(selectedClass);
      setStudents(classStudents);
      
      // Generate mock performance data for each student
      const performancePromises = classStudents.map(async (student) => {
        // In a real app, this would fetch actual data from teacherService.getStudentPerformanceData
        const mockData = {
          studentId: student.id,
          studentName: student.name,
          attendanceRate: Math.random() * 40 + 60, // 60-100%
          averageGrade: Math.random() * 30 + 70, // 70-100%
          assignmentSubmissionRate: Math.random() * 20 + 80, // 80-100%
          overallPerformance: 'good' as const
        };
        
        // Determine overall performance
        const avgScore = (mockData.attendanceRate + mockData.averageGrade + mockData.assignmentSubmissionRate) / 3;
        if (avgScore >= 90) mockData.overallPerformance = 'excellent';
        else if (avgScore >= 80) mockData.overallPerformance = 'good';
        else if (avgScore >= 70) mockData.overallPerformance = 'average';
        else mockData.overallPerformance = 'needs_improvement';
        
        return mockData;
      });
      
      const performance = await Promise.all(performancePromises);
      setPerformanceData(performance);
    } catch (error) {
      console.error('Error loading class data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAIReport = async () => {
    if (!selectedStudent) return;
    
    setGeneratingReport(true);
    try {
      const student = performanceData.find(p => p.studentId === selectedStudent);
      if (!student) return;
      
      // Mock AI report generation
      // In a real app, this would call an AI service like OpenAI
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      const report = `
## AI Performance Analysis for ${student.studentName}

### Overall Assessment
${student.studentName} demonstrates **${student.overallPerformance.replace('_', ' ')}** performance across all metrics. Based on comprehensive data analysis, here are the key insights:

### Attendance Analysis
- **Current Rate**: ${student.attendanceRate.toFixed(1)}%
- **Trend**: ${student.attendanceRate > 85 ? 'Consistent and reliable attendance pattern' : 'Attendance needs improvement for better academic outcomes'}
- **Impact**: ${student.attendanceRate > 85 ? 'Strong correlation with academic performance' : 'Irregular attendance may be affecting learning continuity'}

### Academic Performance
- **Average Grade**: ${student.averageGrade.toFixed(1)}%
- **Performance Level**: ${student.averageGrade > 85 ? 'Excellent grasp of subject matter' : student.averageGrade > 75 ? 'Good understanding with room for improvement' : 'Requires additional support and intervention'}
- **Strengths**: ${student.averageGrade > 80 ? 'Demonstrates strong analytical skills and concept retention' : 'Shows potential with focused effort'}

### Assignment Engagement
- **Submission Rate**: ${student.assignmentSubmissionRate.toFixed(1)}%
- **Quality**: ${student.assignmentSubmissionRate > 90 ? 'Consistently submits high-quality work on time' : 'Needs to improve consistency in assignment completion'}
- **Participation**: ${student.assignmentSubmissionRate > 85 ? 'Actively engaged in coursework' : 'Could benefit from increased engagement'}

### Recommendations
${student.overallPerformance === 'excellent' ? 
  '• Continue current study habits and consider advanced challenges\n• Potential candidate for peer tutoring or leadership roles\n• Encourage participation in academic competitions' :
  student.overallPerformance === 'good' ?
  '• Focus on consistency across all areas\n• Set specific goals for improvement\n• Consider additional practice in weaker subjects' :
  '• Implement structured study schedule\n• Seek additional support from teachers or tutors\n• Regular progress monitoring recommended'
}

### Action Plan
1. **Short-term (1-2 weeks)**: ${student.attendanceRate < 80 ? 'Improve attendance consistency' : 'Maintain current positive trends'}
2. **Medium-term (1 month)**: ${student.averageGrade < 80 ? 'Focus on core concept mastery' : 'Explore advanced topics and applications'}
3. **Long-term (semester)**: ${student.overallPerformance === 'needs_improvement' ? 'Achieve consistent performance above 80%' : 'Maintain excellence and explore leadership opportunities'}

### Parent/Guardian Consultation
${student.overallPerformance === 'needs_improvement' ? 
  'Recommended to discuss support strategies and create a collaborative improvement plan.' :
  'Positive feedback session to acknowledge achievements and discuss future goals.'
}

---
*This report was generated using AI analysis of attendance, academic performance, and engagement data. For detailed discussion, please schedule a consultation.*
      `;
      
      setAiReport(report);
    } catch (error) {
      console.error('Error generating AI report:', error);
      setAiReport('Error generating report. Please try again.');
    } finally {
      setGeneratingReport(false);
    }
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-300';
      case 'good':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300';
      case 'average':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'needs_improvement':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const classStats = {
    totalStudents: students.length,
    averageAttendance: performanceData.length > 0 
      ? performanceData.reduce((sum, p) => sum + p.attendanceRate, 0) / performanceData.length 
      : 0,
    averageGrade: performanceData.length > 0 
      ? performanceData.reduce((sum, p) => sum + p.averageGrade, 0) / performanceData.length 
      : 0,
    excellentPerformers: performanceData.filter(p => p.overallPerformance === 'excellent').length
  };

  const dashboardStats = [
    {
      title: 'Total Students',
      value: classStats.totalStudents,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Class Average',
      value: `${classStats.averageGrade.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Attendance Rate',
      value: `${classStats.averageAttendance.toFixed(1)}%`,
      icon: BarChart,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: 'Top Performers',
      value: classStats.excellentPerformers,
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Reports & Analytics</h1>
        <div className="flex space-x-2">
          <button className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </button>
        </div>
      </div>

      {/* Class Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
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
              Select Student for AI Report
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Select a student</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.name} - {student.rollNumber}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      {selectedClass && (
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Performance Overview */}
        {selectedClass && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Class Performance Overview
            </h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : performanceData.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No data available</h4>
                <p className="text-gray-500 dark:text-gray-400">Select a class to view performance data.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {performanceData.map((student) => (
                  <div
                    key={student.studentId}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {student.studentName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{student.studentName}</h4>
                        <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
                          <span>Attendance: {student.attendanceRate.toFixed(1)}%</span>
                          <span>Grade: {student.averageGrade.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPerformanceColor(student.overallPerformance)}`}>
                        {student.overallPerformance.replace('_', ' ')}
                      </span>
                      <button
                        onClick={() => setSelectedStudent(student.studentId)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI Report Generation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Performance Report</h3>
            <button
              onClick={generateAIReport}
              disabled={!selectedStudent || generatingReport}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-colors"
            >
              <Brain className="w-4 h-4 mr-2" />
              {generatingReport ? 'Generating...' : 'Generate AI Report'}
            </button>
          </div>
          
          {!selectedStudent ? (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Select a Student</h4>
              <p className="text-gray-500 dark:text-gray-400">
                Choose a student from the dropdown to generate an AI-powered performance report.
              </p>
            </div>
          ) : generatingReport ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Generating AI Report</h4>
              <p className="text-gray-500 dark:text-gray-400">
                Analyzing student data and generating comprehensive insights...
              </p>
            </div>
          ) : aiReport ? (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-sans">
                  {aiReport}
                </pre>
              </div>
              <div className="flex space-x-2 mt-4">
                <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                  <Download className="w-4 h-4 mr-1" />
                  Download PDF
                </button>
                <button 
                  onClick={() => setAiReport('')}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Ready to Generate</h4>
              <p className="text-gray-500 dark:text-gray-400">
                Click "Generate AI Report" to create a comprehensive performance analysis.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherReports;