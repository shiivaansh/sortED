import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Clock, CheckCircle, AlertTriangle, Filter, Plus, RefreshCw, Upload } from 'lucide-react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { firebaseService } from '../services/firebaseService';
import type { Assignment } from '../types';

const Assignments: React.FC = () => {
  const { currentUser } = useFirebaseAuth();
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'submitted' | 'overdue'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'subject' | 'status'>('dueDate');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [userSubmissions, setUserSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadAssignments();
    }
  }, [currentUser]);

  const loadAssignments = async () => {
    if (!currentUser) return;
    
    try {
      const userData = await firebaseService.getUserCompleteData(currentUser.uid);
      if (userData.assignments && userData.assignments.length > 0) {
        // Convert Firebase data to the expected format
        const formattedAssignments = userData.assignments.map((item: any) => ({
          id: item.assignment.id,
          subject: item.assignment.subject,
          title: item.assignment.title,
          dueDate: item.assignment.dueDate,
          description: item.assignment.description,
          status: item.submission?.status === 'submitted' ? 'submitted' : 
                  new Date(item.assignment.dueDate) < new Date() ? 'overdue' : 'pending'
        }));
        setAssignments(formattedAssignments);
        setUserSubmissions(userData.assignments.map((item: any) => item.submission));
      } else {
        // Use mock data if no Firebase data
        setAssignments(mockAssignments);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
      setAssignments(mockAssignments);
    }
  };

  const submitAssignment = async (assignmentId: string) => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      await firebaseService.submitAssignment(assignmentId, currentUser.uid, {
        content: `Assignment submission for ${assignmentId}`,
        attachments: []
      });
      
      // Update local state
      setAssignments(prev => prev.map(assignment => 
        assignment.id === assignmentId 
          ? { ...assignment, status: 'submitted' as const }
          : assignment
      ));
      
      alert('✅ Assignment submitted successfully!');
    } catch (error) {
      console.error('❌ Error submitting assignment:', error);
      alert('❌ Error submitting assignment. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAssignments = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      await firebaseService.refreshUserData(currentUser.uid);
      await loadAssignments();
      alert('✅ Assignment data refreshed! Check your Firebase console.');
    } catch (error) {
      console.error('Error refreshing assignments:', error);
      alert('❌ Error refreshing data. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  // Mock assignments data for fallback
  const mockAssignments: Assignment[] = [
    {
      id: '1',
      subject: 'Mathematics',
      title: 'Calculus Problem Set #8',
      dueDate: '2024-01-25',
      status: 'pending',
      description: 'Complete problems 1-15 from Chapter 8'
    },
    {
      id: '2',
      subject: 'Physics',
      title: 'Lab Report: Motion Analysis',
      dueDate: '2024-01-22',
      status: 'overdue',
      description: 'Write a detailed report on the motion analysis experiment'
    },
    {
      id: '3',
      subject: 'Chemistry',
      title: 'Research Paper: Organic Compounds',
      dueDate: '2024-01-30',
      status: 'pending',
      description: 'Research and write about organic compound applications'
    },
    {
      id: '4',
      subject: 'English',
      title: 'Essay: Modern Literature',
      dueDate: '2024-01-20',
      status: 'submitted',
      description: 'Analyze themes in modern literature'
    },
    {
      id: '5',
      subject: 'History',
      title: 'Timeline Project',
      dueDate: '2024-01-28',
      status: 'pending',
      description: 'Create a timeline of major historical events'
    },
    {
      id: '6',
      subject: 'Computer Science',
      title: 'Algorithm Implementation',
      dueDate: '2024-01-26',
      status: 'submitted',
      description: 'Implement sorting algorithms in Python'
    }
  ];

  const filteredAssignments = assignments
    .filter(assignment => filterStatus === 'all' || assignment.status === filterStatus)
    .sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'subject':
          return a.subject.localeCompare(b.subject);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

  const getStatusBadge = (status: Assignment['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'submitted':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: Assignment['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'submitted':
        return <CheckCircle className="w-4 h-4" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${diffDays} days`;
    }
  };

  const stats = [
    {
      title: 'Total Assignments',
      value: assignments.length,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Pending',
      value: assignments.filter(a => a.status === 'pending').length,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
    },
    {
      title: 'Submitted',
      value: assignments.filter(a => a.status === 'submitted').length,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Overdue',
      value: assignments.filter(a => a.status === 'overdue').length,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assignments</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your assignments • {assignments.length} assignments in database
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={refreshAssignments}
            disabled={isLoading}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
          <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            New Assignment
          </button>
        </div>
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

      {/* Filters and Sort */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="submitted">Submitted</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="dueDate">Due Date</option>
              <option value="subject">Subject</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {filteredAssignments.map((assignment) => (
          <div
            key={assignment.id}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-full">
                    {assignment.subject}
                  </span>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center space-x-1 ${getStatusBadge(assignment.status)}`}>
                    {getStatusIcon(assignment.status)}
                    <span className="capitalize">{assignment.status}</span>
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {assignment.title}
                </h3>
                
                {assignment.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    {assignment.description}
                  </p>
                )}

                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{getDaysUntilDue(assignment.dueDate)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-2 ml-4">
                {assignment.status === 'pending' && (
                  <button
                    onClick={() => submitAssignment(assignment.id)}
                    disabled={isLoading}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Submit
                  </button>
                )}
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm">
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAssignments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No assignments found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {filterStatus === 'all' 
              ? "You don't have any assignments yet." 
              : `No ${filterStatus} assignments found.`
            }
          </p>
        </div>
      )}

      {/* Database Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 Database Info</h4>
        <p className="text-xs text-blue-700 dark:text-blue-300">
          Assignment submissions are automatically saved to Firebase with grades and feedback. 
          Click "Refresh Data" to rebuild records or check your Firebase console under 'assignments' collection.
        </p>
      </div>
    </div>
  );
};

export default Assignments;