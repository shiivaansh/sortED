import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { teacherService } from '../services/teacherService';

interface TeacherProtectedRouteProps {
  children: React.ReactNode;
}

const TeacherProtectedRoute: React.FC<TeacherProtectedRouteProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [isTeacher, setIsTeacher] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkTeacherStatus = async () => {
      if (!currentUser) {
        setIsTeacher(false);
        setLoading(false);
        return;
      }

      try {
        const teacherProfile = await teacherService.getTeacherProfile(currentUser.uid);
        setIsTeacher(!!teacherProfile);
      } catch (error) {
        console.error('Error checking teacher status:', error);
        setIsTeacher(false);
      } finally {
        setLoading(false);
      }
    };

    checkTeacherStatus();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!currentUser || !isTeacher) {
    return <Navigate to="/teacher-login" />;
  }

  return <>{children}</>;
};

export default TeacherProtectedRoute;