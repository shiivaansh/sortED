import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import TeacherSidebar from './TeacherSidebar';
import TeacherHeader from './TeacherHeader';

const TeacherDashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <TeacherSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
        <TeacherHeader onSidebarToggle={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default TeacherDashboardLayout;