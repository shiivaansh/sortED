import React from 'react';
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
  AlertCircle
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const stats = [
    {
      title: 'Attendance Rate',
      value: '92%',
      change: '+2%',
      changeType: 'positive',
      icon: Calendar,
      color: 'bg-green-500'
    },
    {
      title: 'Pending Assignments',
      value: '3',
      change: '-1',
      changeType: 'positive',
      icon: FileText,
      color: 'bg-orange-500'
    },
    {
      title: 'Current GPA',
      value: '8.7',
      change: '+0.2',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'bg-blue-500'
    },
    {
      title: 'Upcoming Events',
      value: '5',
      change: '+2',
      changeType: 'neutral',
      icon: CalendarDays,
      color: 'bg-purple-500'
    }
  ];

  const recentActivities = [
    {
      type: 'assignment',
      title: 'Mathematics Assignment #5 submitted',
      time: '2 hours ago',
      icon: CheckCircle,
      color: 'text-green-500'
    },
    {
      type: 'message',
      title: 'New message in Physics Study Group',
      time: '4 hours ago',
      icon: MessageSquare,
      color: 'text-blue-500'
    },
    {
      type: 'event',
      title: 'Science Fair registration opens',
      time: '1 day ago',
      icon: AlertCircle,
      color: 'text-purple-500'
    },
    {
      type: 'resource',
      title: 'New study material uploaded to Chemistry',
      time: '2 days ago',
      icon: BookOpen,
      color: 'text-emerald-500'
    }
  ];

  const quickActions = [
    { title: 'View Attendance', link: '/dashboard/attendance', icon: Calendar, color: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30' },
    { title: 'Submit Assignment', link: '/dashboard/assignments', icon: FileText, color: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30' },
    { title: 'Check GPA', link: '/dashboard/gpa-predictor', icon: TrendingUp, color: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30' },
    { title: 'Browse Resources', link: '/dashboard/learncenter', icon: BookOpen, color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

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
                  {stat.change} from last week
                </p>
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