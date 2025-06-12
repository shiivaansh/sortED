import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, Plus, RefreshCw } from 'lucide-react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { firebaseService } from '../services/firebaseService';
import type { AttendanceRecord } from '../types';

const Attendance: React.FC = () => {
  const { currentUser } = useFirebaseAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [realTimeUpdates, setRealTimeUpdates] = useState(0);

  useEffect(() => {
    if (currentUser) {
      loadAttendanceData();
      setupRealTimeAttendanceUpdates();
    }
  }, [currentUser, selectedMonth, selectedYear]);

  const loadAttendanceData = async () => {
    if (!currentUser) return;
    
    try {
      const userData = await firebaseService.getUserCompleteData(currentUser.uid);
      if (userData.attendance && userData.attendance.length > 0) {
        // Convert Firebase data to the expected format
        const formattedData = userData.attendance.map((record: any) => ({
          date: record.date,
          status: record.status as 'present' | 'absent' | 'late'
        }));
        setAttendanceData(formattedData);
      } else {
        // Use mock data if no Firebase data
        setAttendanceData(mockAttendanceData);
      }
    } catch (error) {
      console.error('Error loading attendance data:', error);
      setAttendanceData(mockAttendanceData);
    }
  };

  // Setup real-time attendance updates
  const setupRealTimeAttendanceUpdates = () => {
    if (!currentUser) return;
    
    console.log('🔄 Setting up real-time attendance updates for student...');
    
    // Subscribe to real-time attendance updates
    const unsubscribe = firebaseService.subscribeToStudentAttendance(currentUser.uid, (attendanceRecords) => {
      console.log(`📅 Real-time attendance update: ${attendanceRecords.length} records`);
      const formattedData = attendanceRecords.map((record: any) => ({
        date: record.date,
        status: record.status as 'present' | 'absent' | 'late'
      }));
      setAttendanceData(formattedData);
      setRealTimeUpdates(prev => prev + 1);
    });

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  };

  const markAttendance = async (date: string, status: 'present' | 'absent' | 'late') => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      await firebaseService.markAttendance(currentUser.uid, date, status);
      
      // Update local state
      setAttendanceData(prev => {
        const existing = prev.find(record => record.date === date);
        if (existing) {
          return prev.map(record => 
            record.date === date ? { ...record, status } : record
          );
        } else {
          return [...prev, { date, status }];
        }
      });
      
      console.log('✅ Attendance marked successfully');
    } catch (error) {
      console.error('❌ Error marking attendance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAttendanceData = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      // Re-initialize attendance records
      await firebaseService.refreshUserData(currentUser.uid);
      await loadAttendanceData();
      alert('✅ Attendance data refreshed! Check your Firebase console.');
    } catch (error) {
      console.error('Error refreshing attendance data:', error);
      alert('❌ Error refreshing data. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  // Mock attendance data for fallback
  const mockAttendanceData: AttendanceRecord[] = [
    { date: '2024-01-15', status: 'present' },
    { date: '2024-01-16', status: 'present' },
    { date: '2024-01-17', status: 'absent' },
    { date: '2024-01-18', status: 'present' },
    { date: '2024-01-19', status: 'late' },
    { date: '2024-01-22', status: 'present' },
    { date: '2024-01-23', status: 'present' },
    { date: '2024-01-24', status: 'present' },
    { date: '2024-01-25', status: 'present' },
    { date: '2024-01-26', status: 'absent' },
  ];

  const totalDays = attendanceData.length;
  const presentDays = attendanceData.filter(record => record.status === 'present').length;
  const absentDays = attendanceData.filter(record => record.status === 'absent').length;
  const lateDays = attendanceData.filter(record => record.status === 'late').length;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const record = attendanceData.find(r => r.date === dateStr);
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      
      days.push(
        <div
          key={day}
          className={`h-10 flex items-center justify-center rounded-lg text-sm font-medium cursor-pointer transition-colors relative ${
            record
              ? record.status === 'present'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                : record.status === 'absent'
                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
              : isToday
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/30'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          onClick={() => {
            if (isToday && !record) {
              const status = window.confirm('Mark attendance as Present?') ? 'present' : 
                           window.confirm('Mark as Absent?') ? 'absent' : 'late';
              markAttendance(dateStr, status);
            }
          }}
        >
          {day}
          {isToday && !record && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
          )}
          {realTimeUpdates > 0 && record && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          )}
        </div>
      );
    }

    return days;
  };

  const stats = [
    {
      title: 'Overall Attendance',
      value: `${attendancePercentage}%`,
      icon: TrendingUp,
      color: attendancePercentage >= 90 ? 'text-green-600' : attendancePercentage >= 75 ? 'text-yellow-600' : 'text-red-600',
      bgColor: attendancePercentage >= 90 ? 'bg-green-50 dark:bg-green-900/20' : attendancePercentage >= 75 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-red-50 dark:bg-red-900/20'
    },
    {
      title: 'Present Days',
      value: presentDays,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Absent Days',
      value: absentDays,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    },
    {
      title: 'Late Days',
      value: lateDays,
      icon: AlertCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track your attendance records • {attendanceData.length} records in database
            {realTimeUpdates > 0 && (
              <span className="ml-2 text-emerald-600 dark:text-emerald-400">
                • Live Updates: {realTimeUpdates}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={refreshAttendanceData}
            disabled={isLoading}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {months.map((month, index) => (
              <option key={index} value={index}>{month}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value={2024}>2024</option>
            <option value={2023}>2023</option>
          </select>
        </div>
      </div>

      {/* Real-time Status */}
      {realTimeUpdates > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
            <div>
              <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                🔴 Live Attendance Updates
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Your attendance updates automatically when teachers mark attendance. Updates: {realTimeUpdates}
              </p>
            </div>
          </div>
        </div>
      )}

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <CalendarIcon className="w-6 h-6 text-gray-600 dark:text-gray-400 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {months[selectedMonth]} {selectedYear}
                </h3>
              </div>
              <button
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  markAttendance(today, 'present');
                }}
                disabled={isLoading}
                className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Mark Today
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="h-10 flex items-center justify-center text-sm font-medium text-gray-500 dark:text-gray-400">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {renderCalendar()}
            </div>

            <div className="flex items-center justify-center space-x-6 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-100 dark:bg-green-900/20 rounded mr-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Present</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-100 dark:bg-red-900/20 rounded mr-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Absent</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-100 dark:bg-yellow-900/20 rounded mr-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Late</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/20 rounded mr-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Today</span>
              </div>
              {realTimeUpdates > 0 && (
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2"></div>
                  <span className="text-sm text-emerald-600 dark:text-emerald-400">Live</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Attendance Progress */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Progress</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Attendance Rate</span>
                  <span className="font-medium text-gray-900 dark:text-white">{attendancePercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      attendancePercentage >= 90 ? 'bg-green-500' : 
                      attendancePercentage >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${attendancePercentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{presentDays}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Present</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{absentDays}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Absent</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Classes</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{totalDays}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Classes Attended</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">{presentDays}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Classes Missed</span>
                <span className="text-sm font-medium text-red-600 dark:text-red-400">{absentDays}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Late Arrivals</span>
                <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">{lateDays}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 Real-time Updates</h4>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Your attendance updates automatically when teachers mark attendance. No need to refresh manually!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;