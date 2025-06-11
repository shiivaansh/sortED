import React, { useState, useEffect } from 'react';
import { FileText, Plus, Eye, Edit, Trash2, Calendar, Users, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { teacherService, ClassInfo } from '../../services/teacherService';

interface Assignment {
  id: string;
  title: string;
  description: string;
  classId: string;
  className: string;
  subject: string;
  dueDate: string;
  maxMarks: number;
  createdAt: Date;
  stats: {
    totalSubmissions: number;
    averageGrade: number;
    submissionRate: number;
  };
}

const TeacherAssignments: React.FC = () => {
  const { currentUser } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classId: '',
    subject: '',
    dueDate: '',
    maxMarks: 100,
    instructions: ''
  });

  useEffect(() => {
    if (currentUser) {
      loadClasses();
      loadAssignments();
    }
  }, [currentUser]);

  const loadClasses = async () => {
    if (!currentUser) return;
    
    try {
      const teacherClasses = await teacherService.getTeacherClasses(currentUser.uid);
      setClasses(teacherClasses);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const loadAssignments = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const teacherAssignments = await teacherService.getTeacherAssignments(currentUser.uid);
      
      // Enrich with class names
      const enrichedAssignments = teacherAssignments.map((assignment: any) => {
        const assignmentClass = classes.find(c => c.id === assignment.classId);
        return {
          ...assignment,
          className: assignmentClass?.name || 'Unknown Class'
        };
      });
      
      setAssignments(enrichedAssignments);
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAssignment = async () => {
    if (!currentUser || !formData.title || !formData.classId) return;
    
    try {
      await teacherService.createAssignment(formData, currentUser.uid);
      setShowCreateForm(false);
      setFormData({
        title: '',
        description: '',
        classId: '',
        subject: '',
        dueDate: '',
        maxMarks: 100,
        instructions: ''
      });
      loadAssignments();
      alert('✅ Assignment created successfully!');
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert('❌ Error creating assignment. Please try again.');
    }
  };

  const viewSubmissions = async (assignmentId: string) => {
    try {
      const assignmentSubmissions = await teacherService.getAssignmentSubmissions(assignmentId);
      setSubmissions(assignmentSubmissions);
      setSelectedAssignment(assignmentId);
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  };

  const gradeSubmission = async (submissionId: string, grade: number, feedback: string) => {
    if (!selectedAssignment) return;
    
    try {
      await teacherService.gradeSubmission(selectedAssignment, submissionId, { grade, feedback });
      viewSubmissions(selectedAssignment); // Refresh submissions
      alert('✅ Submission graded successfully!');
    } catch (error) {
      console.error('Error grading submission:', error);
      alert('❌ Error grading submission. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-300';
      case 'graded':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-300';
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
      title: 'Active Assignments',
      value: assignments.filter(a => new Date(a.dueDate) > new Date()).length,
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Total Submissions',
      value: assignments.reduce((sum, a) => sum + a.stats.totalSubmissions, 0),
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: 'Average Grade',
      value: assignments.length > 0 
        ? Math.round(assignments.reduce((sum, a) => sum + a.stats.averageGrade, 0) / assignments.length) + '%'
        : '0%',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assignment Management</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Assignment
        </button>
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

      {/* Create Assignment Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Assignment</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assignment Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter assignment title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Class
                  </label>
                  <select
                    value={formData.classId}
                    onChange={(e) => {
                      const selectedClass = classes.find(c => c.id === e.target.value);
                      setFormData({ 
                        ...formData, 
                        classId: e.target.value,
                        subject: selectedClass?.subject || ''
                      });
                    }}
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Subject"
                    readOnly
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maximum Marks
                </label>
                <input
                  type="number"
                  value={formData.maxMarks}
                  onChange={(e) => setFormData({ ...formData, maxMarks: parseInt(e.target.value) || 100 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  rows={4}
                  placeholder="Assignment description and requirements"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Instructions
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  rows={3}
                  placeholder="Additional instructions for students"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex space-x-3">
              <button
                onClick={createAssignment}
                disabled={!formData.title || !formData.classId}
                className="flex-1 py-2 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                Create Assignment
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignments List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Assignments</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No assignments yet</h4>
            <p className="text-gray-500 dark:text-gray-400">Create your first assignment to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {assignment.title}
                    </h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {assignment.className}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </span>
                      <span>Max: {assignment.maxMarks} marks</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                      {assignment.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-3 text-sm">
                      <span className="text-blue-600 dark:text-blue-400">
                        {assignment.stats.totalSubmissions} submissions
                      </span>
                      <span className="text-green-600 dark:text-green-400">
                        {assignment.stats.submissionRate}% submission rate
                      </span>
                      <span className="text-purple-600 dark:text-purple-400">
                        Avg: {assignment.stats.averageGrade}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => viewSubmissions(assignment.id)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </button>
                    <button className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submissions Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assignment Submissions</h2>
                <button
                  onClick={() => setSelectedAssignment(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {submissions.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No submissions yet</h4>
                  <p className="text-gray-500 dark:text-gray-400">Students haven't submitted their work yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {submission.studentName}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            ID: {submission.studentId} • Submitted: {submission.submittedAt?.toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(submission.status)}`}>
                          {submission.status}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 dark:text-gray-300 mb-3">
                        {submission.content}
                      </p>
                      
                      {submission.status === 'submitted' && (
                        <div className="flex items-center space-x-3">
                          <input
                            type="number"
                            placeholder="Grade"
                            className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            max={assignments.find(a => a.id === selectedAssignment)?.maxMarks || 100}
                          />
                          <input
                            type="text"
                            placeholder="Feedback"
                            className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                          />
                          <button
                            onClick={() => {
                              const gradeInput = document.querySelector(`input[type="number"]`) as HTMLInputElement;
                              const feedbackInput = document.querySelector(`input[type="text"]`) as HTMLInputElement;
                              if (gradeInput && feedbackInput) {
                                gradeSubmission(submission.id, parseInt(gradeInput.value), feedbackInput.value);
                              }
                            }}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                          >
                            Grade
                          </button>
                        </div>
                      )}
                      
                      {submission.status === 'graded' && (
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                          <p className="text-sm text-green-800 dark:text-green-300">
                            <strong>Grade:</strong> {submission.grade} • <strong>Feedback:</strong> {submission.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAssignments;