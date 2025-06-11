import React, { useState } from 'react';
import { Send, Users, Search, Plus, Hash, MessageCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  groupId: string;
}

interface MessageGroup {
  id: string;
  name: string;
  description: string;
  members: string[];
  lastMessage?: string;
  lastMessageTime?: Date;
  type: 'class' | 'subject' | 'general';
}

const TeacherMessages: React.FC = () => {
  const { currentUser } = useAuth();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for teacher groups and messages
  const [groups] = useState<MessageGroup[]>([
    {
      id: 'class-12a-math',
      name: 'Class 12-A Mathematics',
      description: 'Mathematics class discussions and announcements',
      members: ['teacher1', 'student1', 'student2', 'student3'],
      lastMessage: 'Tomorrow\'s test has been postponed to Friday',
      lastMessageTime: new Date('2024-01-20T15:30:00'),
      type: 'class'
    },
    {
      id: 'class-11b-physics',
      name: 'Class 11-B Physics',
      description: 'Physics class discussions and lab updates',
      members: ['teacher1', 'student4', 'student5', 'student6'],
      lastMessage: 'Lab report submissions due next week',
      lastMessageTime: new Date('2024-01-20T14:15:00'),
      type: 'class'
    },
    {
      id: 'math-teachers',
      name: 'Mathematics Department',
      description: 'Mathematics teachers coordination',
      members: ['teacher1', 'teacher2', 'teacher3'],
      lastMessage: 'Curriculum meeting scheduled for Monday',
      lastMessageTime: new Date('2024-01-19T16:45:00'),
      type: 'subject'
    },
    {
      id: 'parent-teacher',
      name: 'Parent-Teacher Communication',
      description: 'Communication with parents and guardians',
      members: ['teacher1', 'parent1', 'parent2'],
      lastMessage: 'Parent-teacher meeting next Thursday',
      lastMessageTime: new Date('2024-01-19T09:20:00'),
      type: 'general'
    }
  ]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Good morning everyone! Tomorrow\'s mathematics test has been postponed to Friday due to the school event.',
      senderId: 'teacher1',
      senderName: 'Prof. Anderson',
      timestamp: new Date('2024-01-20T15:30:00'),
      groupId: 'class-12a-math'
    },
    {
      id: '2',
      text: 'Thank you for the update, Professor!',
      senderId: 'student1',
      senderName: 'Alice Johnson',
      timestamp: new Date('2024-01-20T15:32:00'),
      groupId: 'class-12a-math'
    },
    {
      id: '3',
      text: 'Should we still prepare for the original syllabus?',
      senderId: 'student2',
      senderName: 'Bob Smith',
      timestamp: new Date('2024-01-20T15:35:00'),
      groupId: 'class-12a-math'
    },
    {
      id: '4',
      text: 'Yes, the syllabus remains the same. Focus on chapters 8-12.',
      senderId: 'teacher1',
      senderName: 'Prof. Anderson',
      timestamp: new Date('2024-01-20T15:37:00'),
      groupId: 'class-12a-math'
    },
    {
      id: '5',
      text: 'Lab report submissions are due next week. Please submit them by Wednesday.',
      senderId: 'teacher1',
      senderName: 'Prof. Anderson',
      timestamp: new Date('2024-01-20T14:15:00'),
      groupId: 'class-11b-physics'
    }
  ]);

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedGroupData = groups.find(g => g.id === selectedGroup);
  const groupMessages = messages.filter(m => m.groupId === selectedGroup);

  const sendMessage = () => {
    if (newMessage.trim() && selectedGroup && currentUser) {
      const message: Message = {
        id: Date.now().toString(),
        text: newMessage.trim(),
        senderId: currentUser.uid,
        senderName: 'Prof. Anderson', // In real app, get from teacher profile
        timestamp: new Date(),
        groupId: selectedGroup
      };
      
      setMessages([...messages, message]);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getGroupTypeColor = (type: string) => {
    switch (type) {
      case 'class':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'subject':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'general':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getGroupIcon = (type: string) => {
    switch (type) {
      case 'class':
        return '🎓';
      case 'subject':
        return '📚';
      case 'general':
        return '💬';
      default:
        return '👥';
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Groups Sidebar */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h2>
            <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              onClick={() => setSelectedGroup(group.id)}
              className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                selectedGroup === group.id ? 'bg-emerald-50 dark:bg-emerald-900/20 border-r-2 border-emerald-500' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl">{getGroupIcon(group.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {group.name}
                    </h3>
                    {group.lastMessageTime && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {group.lastMessageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getGroupTypeColor(group.type)}`}>
                      {group.type}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {group.members.length} members
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1">
                    {group.description}
                  </p>
                  {group.lastMessage && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                      {group.lastMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedGroup ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getGroupIcon(selectedGroupData?.type || 'general')}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedGroupData?.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedGroupData?.members.length} members • {selectedGroupData?.description}
                    </p>
                  </div>
                </div>
                <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <Users className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {groupMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.senderId === currentUser?.uid
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}>
                    {message.senderId !== currentUser?.uid && (
                      <p className="text-xs font-medium mb-1 opacity-75">
                        {message.senderName}
                      </p>
                    )}
                    <p className="text-sm">{message.text}</p>
                    <p className={`text-xs mt-1 opacity-75 ${
                      message.senderId === currentUser?.uid ? 'text-emerald-100' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  rows={1}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Select a group to start messaging
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Choose a group from the sidebar to view and send messages to your students and colleagues.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherMessages;