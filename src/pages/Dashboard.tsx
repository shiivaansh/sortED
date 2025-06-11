import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  FileText,
  TrendingUp,
  CalendarDays,
  MessageSquare,
  BookOpen,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Database
} from 'lucide-react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { firebaseService } from '../services/firebaseService';

const Dashboard: React.FC = () => {
  const { currentUser } = useFirebaseAuth();
  const [userStats, setUserStats] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadUserStats();
    }
  }, [currentUser]);

  const loadUserStats = async () => {
    if (!currentUser) return;
    
    try {
      const userData = await firebaseService.getUserCompleteData(currentUser.uid);
      setUserStats(userData);
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const refreshAllData = async () => {
    if (!currentUser) return;
    
    setIsRefreshing(true);
    try {
      await firebaseService.refreshUserData(currentUser.uid);
      await loadUserStats();
      alert('✅ All user data has been refreshed! Check your Firebase console.');
    } catch (error) {
      console.error('Error refreshing data:', error);
      alert('❌ Error refreshing data. Check console for details.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const stats = [
    {
      title: 'Attendance Rate',
      value: userStats?.profile?.stats?.attendancePercentage ? `${userStats.profile.stats.attendancePercentage}%` : '92%',
      change: '+2%',
      changeType: 'positive',
      icon: Calendar,
      color: 'bg-green-500',
      dbCount: userStats?.summary?.totalAttendanceRecords || 0
    },
    {
      title: 'Assignments',
      value: userStats?.summary?.totalAssignments || '6',
      change: userStats?.summary?.totalAssignments ? `${userStats.summary.totalAssignments} in DB` : 'Mock data',
      changeType: 'neutral',
      icon: FileText,
      color: 'bg-orange-500',
      dbCount: userStats?.summary?.totalAssignments || 0
    },
    {
      title: 'Current GPA',
      value: userStats?.profile?.stats?.currentGPA ? userStats.profile.stats.currentGPA.toFixed(1) : '8.7',
      change: '+0.2',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'bg-blue-500',
      dbCount: userStats?.summary?.totalGrades || 0
    },
    {
      title: 'Communities',
      value: userStats?.profile?.stats?.communitiesJoined || '2',
      change: userStats?.profile?.joinedCommunities?.length ? `${userStats.profile.joinedCommunities.length} joined` : 'Mock data',
      changeType: 'neutral',
      icon: Users,
      color: 'bg-purple-500',
      dbCount: userStats?.profile?.joinedCommunities?.length || 0
    }
  ];

  const recentActivities = [
    {
      type: 'assignment',
      title: 'Mathematics Assignment #5 submitted',
      time: '2 hours ago',
      icon: CheckCircle,
      color: 'text-green-500',
      inDb: userStats?.summary?.totalAssignments > 0
    },
    {
      type: 'attendance',
      title: 'Attendance marked for today',
      time: '4 hours ago',
      icon: Calendar,
      color: 'text-blue-500',
      inDb: userStats?.summary?.totalAttendanceRecords > 0
    },
    {
      type: 'community',
      title: 'Joined Technology Club',
      time: '1 day ago',
      icon: Users,
      color: 'text-purple-500',
      inDb: userStats?.profile?.joinedCommunities?.length > 0
    },
    {
      type: 'grade',
      title: 'New grade recorded for Physics',
      time: '2 days ago',
      icon: TrendingUp,
      color: 'text-emerald-500',
      inDb: userStats?.summary?.totalGrades > 0
    }
  ];

  const quickActions = [
    { title: 'View Attendance', link: '/dashboard/attendance', icon: Calendar, color: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30' },
    { title: 'Submit Assignment', link: '/dashboard/assignments', icon: FileText, color: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30' },
    { title: 'Check GPA', link: '/dashboard/gpa-predictor', icon: TrendingUp, color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30' },
    { title: 'Join Communities', link: '/dashboard/communities', icon: Users, color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString()}
            {currentUser && (
              <span className="ml-2 text-blue-600 dark:text-blue-400">
                • User ID: {currentUser.uid.slice(0, 8)}...
              </span>
            )}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
          >
            <Database className="w-4 h-4 mr-2" />
            {showDebugInfo ? 'Hide' : 'Show'} DB Info
          </button>
          
          <button
            onClick={refreshAllData}
            disabled={isRefreshing}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>

      {/* Database Status */}
      {showDebugInfo && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Firebase Database Status
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-700 dark:text-blue-300 font-medium">Attendance Records:</span>
              <span className="ml-2 text-blue-900 dark:text-blue-100">{userStats?.summary?.totalAttendanceRecords || 0}</span>
            </div>
            <div>
              <span className="text-blue-700 dark:text-blue-300 font-medium">Assignment Submissions:</span>
              <span className="ml-2 text-blue-900 dark:text-blue-100">{userStats?.summary?.totalAssignments || 0}</span>
            </div>
            <div>
              <span className="text-blue-700 dark:text-blue-300 font-medium">Grade Records:</span>
              <span className="ml-2 text-blue-900 dark:text-blue-100">{userStats?.summary?.totalGrades || 0}</span>
            </div>
            <div>
              <span className="text-blue-700 dark:text-blue-300 font-medium">Certificates:</span>
              <span className="ml-2 text-blue-900 dark:text-blue-100">{userStats?.summary?.totalCertificates || 0}</span>
            </div>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
            💡 Click "Refresh Data" to rebuild all database records. Check your Firebase console to see the data structure.
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                <p className={`text-sm mt-1 ${
                  stat.changeType === 'positive' ? 'text-green-600 dark:text-green-400' : 
                  stat.changeType === 'negative' ? 'text-red-600 dark:text-red-400' : 
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {stat.change}
                </p>
                {showDebugInfo && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    DB Records: {stat.dbCount}
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-full ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
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
                <Link
                  key={index}
                  to={action.link}
                  className={`flex items-center p-3 rounded-lg transition-colors ${action.color}`}
                >
                  <action.icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{action.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
              <Link to="/dashboard/messages" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <activity.icon className={`w-5 h-5 mt-0.5 ${activity.color}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
                    <div className="flex items-center mt-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {activity.time}
                      </p>
                      {showDebugInfo && (
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          activity.inDb 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                        }`}>
                          {activity.inDb ? 'In DB' : 'Mock'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upcoming Deadlines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { subject: 'Physics', title: 'Lab Report', due: '2 days', priority: 'high' },
            { subject: 'Mathematics', title: 'Problem Set #8', due: '5 days', priority: 'medium' },
            { subject: 'Chemistry', title: 'Research Paper', due: '1 week', priority: 'low' }
          ].map((deadline, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {deadline.subject}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  deadline.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300' :
                  deadline.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300' :
                  'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                }`}>
                  {deadline.priority}
                </span>
              </div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">{deadline.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Due in {deadline.due}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;