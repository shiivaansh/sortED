import React, { useState } from 'react';
import { BookOpen, Play, FileText, HelpCircle, Download, Eye, Search, Filter, Plus } from 'lucide-react';
import type { LearningResource } from '../types';

const LearnCenter: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Mock learning resources data
  const resources: LearningResource[] = [
    {
      id: '1',
      title: 'Introduction to Calculus',
      type: 'video',
      subject: 'Mathematics',
      url: 'https://example.com/calculus-intro',
      description: 'Comprehensive introduction to differential and integral calculus',
      uploadDate: '2024-01-15'
    },
    {
      id: '2',
      title: 'Newton\'s Laws of Motion',
      type: 'document',
      subject: 'Physics',
      url: 'https://example.com/newtons-laws.pdf',
      description: 'Detailed explanation of Newton\'s three laws with examples',
      uploadDate: '2024-01-12'
    },
    {
      id: '3',
      title: 'Organic Chemistry Basics',
      type: 'article',
      subject: 'Chemistry',
      url: 'https://example.com/organic-chem',
      description: 'Fundamentals of organic chemistry and molecular structures',
      uploadDate: '2024-01-10'
    },
    {
      id: '4',
      title: 'Shakespearean Literature Quiz',
      type: 'quiz',
      subject: 'English',
      url: 'https://example.com/shakespeare-quiz',
      description: 'Test your knowledge of Shakespeare\'s major works',
      uploadDate: '2024-01-08'
    },
    {
      id: '5',
      title: 'World War II Documentary',
      type: 'video',
      subject: 'History',
      url: 'https://example.com/wwii-doc',
      description: 'In-depth documentary covering major events of World War II',
      uploadDate: '2024-01-05'
    },
    {
      id: '6',
      title: 'Python Programming Guide',
      type: 'document',
      subject: 'Computer Science',
      url: 'https://example.com/python-guide.pdf',
      description: 'Complete guide to Python programming for beginners',
      uploadDate: '2024-01-03'
    },
    {
      id: '7',
      title: 'Trigonometry Practice Problems',
      type: 'quiz',
      subject: 'Mathematics',
      url: 'https://example.com/trig-quiz',
      description: 'Practice problems for trigonometric functions and identities',
      uploadDate: '2024-01-01'
    },
    {
      id: '8',
      title: 'Electromagnetic Waves Lecture',
      type: 'video',
      subject: 'Physics',
      url: 'https://example.com/em-waves',
      description: 'Comprehensive lecture on electromagnetic wave theory',
      uploadDate: '2023-12-28'
    }
  ];

  const subjects = ['all', ...Array.from(new Set(resources.map(r => r.subject)))];
  const types = ['all', 'video', 'document', 'article', 'quiz'];

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubject === 'all' || resource.subject === filterSubject;
    const matchesType = filterType === 'all' || resource.type === filterType;
    
    return matchesSearch && matchesSubject && matchesType;
  });

  const getResourceIcon = (type: LearningResource['type']) => {
    switch (type) {
      case 'video':
        return <Play className="w-5 h-5" />;
      case 'document':
        return <FileText className="w-5 h-5" />;
      case 'article':
        return <BookOpen className="w-5 h-5" />;
      case 'quiz':
        return <HelpCircle className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getResourceColor = (type: LearningResource['type']) => {
    switch (type) {
      case 'video':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-300';
      case 'document':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300';
      case 'article':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-300';
      case 'quiz':
        return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const stats = [
    {
      title: 'Total Resources',
      value: resources.length,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Video Lectures',
      value: resources.filter(r => r.type === 'video').length,
      icon: Play,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    },
    {
      title: 'Documents',
      value: resources.filter(r => r.type === 'document').length,
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Quizzes',
      value: resources.filter(r => r.type === 'quiz').length,
      icon: HelpCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">LearnCenter</h1>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          Upload Resource
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

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {subjects.map(subject => (
                  <option key={subject} value={subject}>
                    {subject === 'all' ? 'All Subjects' : subject}
                  </option>
                ))}
              </select>
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {types.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((resource) => (
          <div
            key={resource.id}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2 rounded-lg ${getResourceColor(resource.type)}`}>
                {getResourceIcon(resource.type)}
              </div>
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-full">
                {resource.subject}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
              {resource.title}
            </h3>

            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
              {resource.description}
            </p>

            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
              <span className="capitalize">{resource.type}</span>
              <span>{new Date(resource.uploadDate).toLocaleDateString()}</span>
            </div>

            <div className="flex space-x-2">
              <button className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Eye className="w-4 h-4 mr-2" />
                Open
              </button>
              {resource.type === 'document' && (
                <button className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Download className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredResources.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No resources found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm ? `No resources match "${searchTerm}"` : 'No learning resources available at the moment.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default LearnCenter;