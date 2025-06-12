import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Eye, Mail, Phone, TrendingUp, Calendar, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { teacherService, ClassInfo, StudentInfo } from '../../services/teacherService';

const TeacherStudents: React.FC = () => {
  const { currentUser } = useAuth();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null);
  const [studentPerformance, setStudentPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [realTimeUpdates, setRealTimeUpdates] = useState(0);

  useEffect(() => {
    if (currentUser) {
      loadClasses();
      loadAllStudents();
    }
  }, [currentUser]);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, selectedClass]);

  const loadClasses = async () => {
    if (!currentUser) return;
    
    try {
      const teacherClasses = await teacherService.getTeacherClasses(currentUser.uid);
      setClasses(teacherClasses);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const loadAllStudents = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Get all students from the system
      const allStudents = await teacherService.getAllStudents();
      console.log('📚 Loaded students:', allStudents);
      setStudents(allStudents);
      setRealTimeUpdates(prev => prev + 1);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchLower) ||
        student.studentId.toLowerCase().includes(searchLower) ||
        student.rollNumber.toLowerCase().includes(searchLower) ||
        student.email.toLowerCase().includes(searchLower) ||
        student.class.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply class filter
    if (selectedClass !== 'all') {
      const selectedClassData = classes.find(c => c.id === selectedClass);
      if (selectedClassData) {
        filtered = filtered.filter(student => 
          selectedClassData.students.includes(student.id)
        );
      }
    }
    
    setFilteredStudents(filtered);
  };

  const viewStudentDetails = async (student: StudentInfo) => {
    setSelectedStudent(student);
    try {
      const performance = await teacherService.getStudentPerformanceData(student.id);
      setStudentPerformance(performance);
    } catch (error) {
      console.error('Error loading student performance:', error);
      // Mock performance data for demo
      setStudentPerformance({
        attendance: [],
        grades: [],
        assignments: [],
        summary: {
          attendanceRate: Math.random() * 40 + 60,
          averageGrade: Math.random() * 30 + 70,
          assignmentSubmissionRate: Math.random() * 20 + 80
        }
      });
    }
  };

  const refreshStudents = async () => {
    setLoading(true);
    try {
      await loadAllStudents();
      console.log('✅ Students refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing students:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: 'Total Students',
      value: students.length,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Active Students',
      value: students.filter(s => s.isActive).length,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Classes Teaching',
      value: classes.length,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: 'Filtered Results',
      value: filteredStudents.length,
      icon: RefreshCw,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Students</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredStudents.length} of {students.length} students
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </div>
        <button
          onClick={refreshStudents}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading...' : 'Refresh'}
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

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search students by name, ID, roll number, email, or class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Students</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} - {cls.subject} ({cls.students.length} students)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Students List ({filteredStudents.length})
          </h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm ? 'No students found' : 'No students available'}
              </h4>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm ? `No students match "${searchTerm}"` : 'Students will appear here when they register.'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className={`flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-md transition-all cursor-pointer ${
                    selectedStudent?.id === student.id ? 'ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : ''
                  }`}
                  onClick={() => viewStudentDetails(student)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{student.name}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>Roll: {student.rollNumber}</span>
                        <span>•</span>
                        <span>ID: {student.studentId}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {student.class}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      student.isActive 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                    }`}>
                      {student.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        viewStudentDetails(student);
                      }}
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

        {/* Student Details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Student Details</h3>
          
          {!selectedStudent ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Select a Student</h4>
              <p className="text-gray-500 dark:text-gray-400">
                Click on a student from the list to view their details and performance.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Student Info */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedStudent.name}</h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedStudent.studentId} • Roll: {selectedStudent.rollNumber}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedStudent.class}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">{selectedStudent.email}</span>
                  </div>
                  {selectedStudent.parentContact && (
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400">{selectedStudent.parentContact}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Summary */}
              {studentPerformance && (
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-3">Performance Summary</h5>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-700 dark:text-blue-300">Attendance Rate</span>
                        <span className="font-semibold text-blue-900 dark:text-blue-100">
                          {studentPerformance.summary.attendanceRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mt-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${studentPerformance.summary.attendanceRate}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-700 dark:text-green-300">Average Grade</span>
                        <span className="font-semibold text-green-900 dark:text-green-100">
                          {studentPerformance.summary.averageGrade.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-green-200 dark:bg-green-800 rounded-full h-2 mt-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${studentPerformance.summary.averageGrade}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-purple-700 dark:text-purple-300">Assignment Submission</span>
                        <span className="font-semibold text-purple-900 dark:text-purple-100">
                          {studentPerformance.summary.assignmentSubmissionRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2 mt-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${studentPerformance.summary.assignmentSubmissionRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex space-x-2">
                <button className="flex-1 py-2 px-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm">
                  Send Message
                </button>
                <button className="flex-1 py-2 px-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">
                  View Reports
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherStudents;