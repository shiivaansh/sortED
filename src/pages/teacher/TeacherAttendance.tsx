import React, { useState, useEffect } from 'react';
import { Calendar, Users, CheckCircle, XCircle, Clock, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { teacherService, ClassInfo, StudentInfo } from '../../services/teacherService';

const TeacherAttendance: React.FC = () => {
  const { currentUser } = useAuth();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadClasses();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedClass) {
      loadStudents();
      loadExistingAttendance();
    }
  }, [selectedClass, selectedDate]);

  const loadClasses = async () => {
    if (!currentUser) return;
    
    try {
      const teacherClasses = await teacherService.getTeacherClasses(currentUser.uid);
      setClasses(teacherClasses);
      if (teacherClasses.length > 0) {
        setSelectedClass(teacherClasses[0].id);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const loadStudents = async () => {
    if (!selectedClass) return;
    
    setLoading(true);
    try {
      const classStudents = await teacherService.getClassStudents(selectedClass);
      setStudents(classStudents);
      
      // Initialize attendance state
      const initialAttendance: Record<string, 'present' | 'absent' | 'late'> = {};
      classStudents.forEach(student => {
        initialAttendance[student.id] = 'present'; // Default to present
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExistingAttendance = async () => {
    if (!selectedClass || !selectedDate) return;
    
    try {
      const existingAttendance = await teacherService.getClassAttendance(selectedClass, selectedDate);
      
      if (existingAttendance.length > 0) {
        const attendanceMap: Record<string, 'present' | 'absent' | 'late'> = {};
        existingAttendance.forEach((record: any) => {
          attendanceMap[record.studentId] = record.status;
        });
        setAttendance(attendanceMap);
      }
    } catch (error) {
      console.error('Error loading existing attendance:', error);
    }
  };

  const updateAttendance = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const saveAttendance = async () => {
    if (!selectedClass || !selectedDate) return;
    
    setSaving(true);
    try {
      const attendanceData = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status
      }));
      
      await teacherService.markClassAttendance(selectedClass, selectedDate, attendanceData);
      alert('✅ Attendance saved successfully!');
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('❌ Error saving attendance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getAttendanceStats = () => {
    const total = students.length;
    const present = Object.values(attendance).filter(status => status === 'present').length;
    const absent = Object.values(attendance).filter(status => status === 'absent').length;
    const late = Object.values(attendance).filter(status => status === 'late').length;
    
    return { total, present, absent, late, percentage: total > 0 ? Math.round((present / total) * 100) : 0 };
  };

  const stats = getAttendanceStats();

  const getStatusColor = (status: 'present' | 'absent' | 'late') => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'absent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance Management</h1>
        <button
          onClick={saveAttendance}
          disabled={saving || !selectedClass}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Select a class</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} - {cls.subject}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      {selectedClass && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Present</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.present}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Absent</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.absent}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Attendance Rate</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{stats.percentage}%</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Student List */}
      {selectedClass && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Mark Attendance - {classes.find(c => c.id === selectedClass)?.name}
          </h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {students.map(student => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{student.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Roll: {student.rollNumber} • ID: {student.studentId}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {(['present', 'absent', 'late'] as const).map(status => (
                      <button
                        key={status}
                        onClick={() => updateAttendance(student.id, status)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          attendance[student.id] === status
                            ? getStatusColor(status)
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {status === 'present' && <CheckCircle className="w-4 h-4 inline mr-1" />}
                        {status === 'absent' && <XCircle className="w-4 h-4 inline mr-1" />}
                        {status === 'late' && <Clock className="w-4 h-4 inline mr-1" />}
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!selectedClass && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Select a Class
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Choose a class from the dropdown to start marking attendance.
          </p>
        </div>
      )}
    </div>
  );
};

export default TeacherAttendance;