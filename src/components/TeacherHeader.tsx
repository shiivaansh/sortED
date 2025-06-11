import React, { useState, useEffect } from 'react';
import { Menu, Moon, Sun, Bell } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { teacherService, TeacherProfile } from '../services/teacherService';

interface TeacherHeaderProps {
  onSidebarToggle: () => void;
}

const TeacherHeader: React.FC<TeacherHeaderProps> = ({ onSidebarToggle }) => {
  const { isDark, toggleTheme } = useTheme();
  const { currentUser } = useAuth();
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadTeacherProfile();
    }
  }, [currentUser]);

  const loadTeacherProfile = async () => {
    if (!currentUser) return;
    
    try {
      const profile = await teacherService.getTeacherProfile(currentUser.uid);
      setTeacherProfile(profile);
    } catch (error) {
      console.error('Error loading teacher profile:', error);
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onSidebarToggle}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 mr-2"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              Welcome back, {teacherProfile?.name || 'Teacher'}!
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {teacherProfile?.department} Department
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 relative">
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              2
            </span>
          </button>
          
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>

          <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
            {teacherProfile?.name?.charAt(0) || 'T'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TeacherHeader;