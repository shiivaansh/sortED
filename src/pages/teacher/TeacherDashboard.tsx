import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  FileText,
  Award
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { teacherService, TeacherProfile } from '../../services/teacherService';

const TeacherDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    pendingAssignments: 0,
    todayAttendance: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadTeacherData();
    }
  }, [currentUser]);

  const loadTeacherData = async () => {
    if (!currentUser) return;

    try {
      // Get teacher profile
      const profile = await teacherService.getTeacherProfile(currentUser.uid);
      setTeacherProfile(profile);

      if (profile) {
        // Get teacher's classes
        const classes = await teacherService.getTeacherClasses(currentUser.uid);
        
        // Get assignments
        const assignments = await teacherService.getTeacherAssignments(currentUser.uid);
        
        // Calculate stats
        const totalStudents = classes.reduce((sum, cls) => sum + cls.students.length, 0);
        const pendingAssignments = assignments.filter(a => 
          new Date(a.dueDate) > new Date() && a.stats.submissionRate < 100
        ).length;

        setStats({
          totalClasses: classes.length,
          totalStudents,
          pendingAssignments,
          todayAttendance: Math.floor(Math.random() * 100) // Mock data
        });

        // Mock recent activity
        setRecentActivity([
          {
            type: 'submission',
            title: 'New assignment submission from Alice Johnson',
            time: '2 hours ago',
            icon: FileText,
            color: 'text-blue-500'
          },
          {
            type: 'attendance',
            title: 'Attendance marked for Class 12-A',
            time: '4 hours ago',
            icon: Calendar,
            color: 'text-green-500'
          },
          {
            type: 'grade',
            title: 'Grades updated for Physics Quiz',
            time: '1 day ago',
            icon: Award,
            color: 'text-purple-500'
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading teacher data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { 
      title: 'Mark Attendance', 
      link: '/teacher-dashboard/attendance', 
      icon: Calendar, 
      color: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30' 
    },
    { 
      title: 'Create Assignment', 
      link: '/teacher-dashboard/assignments', 
      icon: FileText, 
      color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30' 
    },
    { 
      title: 'Update Marks', 
      link: '/teacher-dashboard/marks', 
      icon: TrendingUp, 
      color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30' 
    },
    { 
      title: 'View Reports', 
      link: '/teacher-dashboard/reports', 
      icon: Award, 
      color: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30' 
    }
  ];

  const dashboardStats = [
    {
      title: 'Total Classes',
      value: stats.totalClasses,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Pending Assignments',
      value: stats.pendingAssignments,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
      title: 'Today\'s Attendance',
      value: `${stats.todayAttendance}%`,
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {teacherProfile?.name || 'Teacher'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {teacherProfile?.department} Department • {teacherProfile?.subjects.join(', ')}
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Last login: {teacherProfile?.lastLogin?.toLocaleDateString() || 'Today'}
        </div>
      </div>

      {/* Stats Grid */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <a
                  key={index}
                  href={action.link}
                  className={`flex items-center p-3 rounded-lg transition-colors ${action.color}`}
                >
                  <action.icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{action.title}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
              <a href="/teacher-dashboard/reports" className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
                View all
              </a>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <activity.icon className={`w-5 h-5 mt-0.5 ${activity.color}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                      <Clock className="w-3 h-3 mr-1" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Today's Schedule</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { time: '09:00 - 10:00', class: 'Class 12-A', subject: 'Mathematics', room: 'Room 101' },
            { time: '10:00 - 11:00', class: 'Class 11-B', subject: 'Statistics', room: 'Room 102' },
            { time: '14:00 - 15:00', class: 'Class 12-C', subject: 'Mathematics', room: 'Room 101' }
          ].map((schedule, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  {schedule.time}
                </span>
                <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 rounded-full">
                  {schedule.room}
                </span>
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">{schedule.class}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{schedule.subject}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;