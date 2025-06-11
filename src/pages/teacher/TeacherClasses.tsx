import React, { useState, useEffect } from 'react';
import { GraduationCap, Users, Calendar, Clock, Plus, Eye, Edit } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { teacherService, ClassInfo, StudentInfo } from '../../services/teacherService';

const TeacherClasses: React.FC = () => {
  const { currentUser } = useAuth();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadClasses();
    }
  }, [currentUser]);

  const loadClasses = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const teacherClasses = await teacherService.getTeacherClasses(currentUser.uid);
      setClasses(teacherClasses);
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewClassDetails = async (classInfo: ClassInfo) => {
    setSelectedClass(classInfo);
    try {
      const classStudents = await teacherService.getClassStudents(classInfo.id);
      setStudents(classStudents);
    } catch (error) {
      console.error('Error loading class students:', error);
    }
  };

  const getScheduleDisplay = (schedule: ClassInfo['schedule']) => {
    if (!schedule || schedule.length === 0) return 'No schedule set';
    
    return schedule.map(s => `${s.day} ${s.startTime}-${s.endTime}`).join(', ');
  };

  const stats = [
    {
      title: 'Total Classes',
      value: classes.length,
      icon: GraduationCap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Total Students',
      value: classes.reduce((sum, cls) => sum + cls.students.length, 0),
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Active Classes',
      value: classes.filter(cls => cls.isActive).length,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: 'Weekly Hours',
      value: classes.reduce((sum, cls) => sum + (cls.schedule?.length || 0), 0),
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Classes</h1>
        <button className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          Add Class
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classes List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Classes</h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No classes assigned</h4>
              <p className="text-gray-500 dark:text-gray-400">You don't have any classes assigned yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {classes.map((classInfo) => (
                <div
                  key={classInfo.id}
                  className={`border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                    selectedClass?.id === classInfo.id ? 'ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : ''
                  }`}
                  onClick={() => viewClassDetails(classInfo)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {classInfo.name}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          classInfo.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                        }`}>
                          {classInfo.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                          <GraduationCap className="w-4 h-4 mr-2" />
                          <span>{classInfo.subject} • Grade {classInfo.grade}-{classInfo.section}</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          <span>{classInfo.students.length} students</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          <span className="truncate">{getScheduleDisplay(classInfo.schedule)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewClassDetails(classInfo);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Class Details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Class Details</h3>
          
          {!selectedClass ? (
            <div className="text-center py-8">
              <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Select a Class</h4>
              <p className="text-gray-500 dark:text-gray-400">
                Click on a class from the list to view its details and students.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Class Info */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">{selectedClass.name}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Subject:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{selectedClass.subject}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Grade:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {selectedClass.grade}-{selectedClass.section}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600 dark:text-gray-400">Students:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {selectedClass.students.length} enrolled
                    </span>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              {selectedClass.schedule && selectedClass.schedule.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-white mb-3">Class Schedule</h5>
                  <div className="space-y-2">
                    {selectedClass.schedule.map((schedule, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <span className="font-medium text-gray-900 dark:text-white">{schedule.day}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {schedule.startTime} - {schedule.endTime}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Students List */}
              <div>
                <h5 className="font-medium text-gray-900 dark:text-white mb-3">Students ({students.length})</h5>
                {students.length === 0 ? (
                  <div className="text-center py-4">
                    <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No students enrolled</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {students.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {student.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h6 className="font-medium text-gray-900 dark:text-white">{student.name}</h6>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Roll: {student.rollNumber} • ID: {student.studentId}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex space-x-2">
                <button className="flex-1 py-2 px-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm">
                  Mark Attendance
                </button>
                <button className="flex-1 py-2 px-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">
                  Create Assignment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherClasses;