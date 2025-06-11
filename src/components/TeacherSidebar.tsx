import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  TrendingUp,
  Brain,
  MessageSquare,
  LogOut,
  X,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface TeacherSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const TeacherSidebar: React.FC<TeacherSidebarProps> = ({ isOpen, onToggle }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/teacher-login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const navItems = [
    { to: '/teacher-dashboard', icon: LayoutDashboard, text: 'Dashboard' },
    { to: '/teacher-dashboard/classes', icon: GraduationCap, text: 'My Classes' },
    { to: '/teacher-dashboard/students', icon: Users, text: 'Students' },
    { to: '/teacher-dashboard/attendance', icon: Calendar, text: 'Attendance' },
    { to: '/teacher-dashboard/assignments', icon: FileText, text: 'Assignments' },
    { to: '/teacher-dashboard/marks', icon: TrendingUp, text: 'Marks' },
    { to: '/teacher-dashboard/reports', icon: Brain, text: 'AI Reports', isNew: true },
    { to: '/teacher-dashboard/messages', icon: MessageSquare, text: 'Messages' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:z-auto`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">Teacher Portal</h1>
          <button
            onClick={onToggle}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto">
          <div className="px-4 py-6 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors relative ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-r-2 border-emerald-700'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`
                }
                onClick={() => window.innerWidth < 1024 && onToggle()}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.text}
                {item.isNew && (
                  <span className="ml-auto px-2 py-1 text-xs bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-full">
                    NEW
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default TeacherSidebar;