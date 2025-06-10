import React, { useState, useEffect } from 'react';
import { Send, Users, Search, Plus, Hash, MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Message, MessageGroup } from '../types';

const Messages: React.FC = () => {
  const { currentUser } = useAuth();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for groups and messages
  const [groups] = useState<MessageGroup[]>([
    {
      id: 'class-12a',
      name: 'Class 12-A',
      description: 'General discussions for Class 12-A students',
      members: ['student1', 'student2', 'teacher1'],
      lastMessage: 'Hey everyone, don\'t forget about tomorrow\'s exam!',
      lastMessageTime: new Date('2024-01-20T10:30:00')
    },
    {
      id: 'physics-study',
      name: 'Physics Study Group',
      description: 'Physics discussions and doubt clearing',
      members: ['student1', 'student2', 'student3', 'physics-teacher'],
      lastMessage: 'Can someone explain electromagnetic induction?',
      lastMessageTime: new Date('2024-01-20T14:15:00')
    },
    {
      id: 'math-club',
      name: 'Mathematics Club',
      description: 'Advanced mathematics discussions',
      members: ['student1', 'student4', 'math-teacher'],
      lastMessage: 'The integration problem was challenging!',
      lastMessageTime: new Date('2024-01-19T16:45:00')
    },
    {
      id: 'science-fair',
      name: 'Science Fair Committee',
      description: 'Planning and coordination for Science Fair 2024',
      members: ['student1', 'student2', 'student3', 'coordinator'],
      lastMessage: 'Project submission deadline is next week',
      lastMessageTime: new Date('2024-01-19T09:20:00')
    }
  ]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hey everyone, don\'t forget about tomorrow\'s physics exam!',
      senderId: 'teacher1',
      senderName: 'Prof. Anderson',
      timestamp: new Date('2024-01-20T10:30:00'),
      groupId: 'class-12a'
    },
    {
      id: '2',
      text: 'Thanks for the reminder! What chapters should we focus on?',
      senderId: 'student2',
      senderName: 'Alice Johnson',
      timestamp: new Date('2024-01-20T10:32:00'),
      groupId: 'class-12a'
    },
    {
      id: '3',
      text: 'Chapters 8-12 are the most important. Make sure to review the formulas.',
      senderId: 'teacher1',
      senderName: 'Prof. Anderson',
      timestamp: new Date('2024-01-20T10:35:00'),
      groupId: 'class-12a'
    },
    {
      id: '4',
      text: 'Can someone explain electromagnetic induction? I\'m having trouble with Faraday\'s law.',
      senderId: 'student3',
      senderName: 'Bob Smith',
      timestamp: new Date('2024-01-20T14:15:00'),
      groupId: 'physics-study'
    },
    {
      id: '5',
      text: 'Sure! Faraday\'s law states that the induced EMF is proportional to the rate of change of magnetic flux.',
      senderId: 'physics-teacher',
      senderName: 'Dr. Rodriguez',
      timestamp: new Date('2024-01-20T14:20:00'),
      groupId: 'physics-study'
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
        senderName: currentUser.displayName || 'You',
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
                selectedGroup === group.id ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  <Hash className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {group.name}
                    </h3>
                    {group.lastMessageTime && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {group.lastMessageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                    {group.description}
                  </p>
                  {group.lastMessage && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 truncate mt-1">
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
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedGroupData?.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedGroupData?.members.length} members • {selectedGroupData?.description}
                  </p>
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
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}>
                    {message.senderId !== currentUser?.uid && (
                      <p className="text-xs font-medium mb-1 opacity-75">
                        {message.senderName}
                      </p>
                    )}
                    <p className="text-sm">{message.text}</p>
                    <p className={`text-xs mt-1 opacity-75 ${
                      message.senderId === currentUser?.uid ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                Choose a group from the sidebar to view and send messages.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;