import React, { useState } from 'react';
import { Calendar, MapPin, Users, Clock, Filter, Search, Plus } from 'lucide-react';
import type { Event } from '../types';

const Events: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'upcoming' | 'registered'>('all');
  const [events, setEvents] = useState<Event[]>([
    {
      id: '1',
      name: 'Science Fair 2024',
      date: '2024-02-15',
      description: 'Annual science fair showcasing student projects and innovations.',
      location: 'Main Auditorium',
      isRegistered: false
    },
    {
      id: '2',
      name: 'Mathematics Olympiad',
      date: '2024-01-28',
      description: 'Inter-school mathematics competition for advanced students.',
      location: 'Computer Lab',
      isRegistered: true
    },
    {
      id: '3',
      name: 'Cultural Fest',
      date: '2024-03-10',
      description: 'Celebrate diversity with music, dance, and cultural performances.',
      location: 'School Grounds',
      isRegistered: false
    },
    {
      id: '4',
      name: 'Career Guidance Workshop',
      date: '2024-01-25',
      description: 'Expert guidance on career choices and college admissions.',
      location: 'Conference Hall',
      isRegistered: true
    },
    {
      id: '5',
      name: 'Sports Day',
      date: '2024-04-05',
      description: 'Annual sports competition with various athletic events.',
      location: 'Sports Complex',
      isRegistered: false
    },
    {
      id: '6',
      name: 'Debate Competition',
      date: '2024-02-08',
      description: 'Inter-class debate competition on current affairs.',
      location: 'Library Hall',
      isRegistered: false
    }
  ]);

  const toggleRegistration = (eventId: string) => {
    setEvents(events.map(event => 
      event.id === eventId 
        ? { ...event, isRegistered: !event.isRegistered }
        : event
    ));
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'all') return matchesSearch;
    if (filterType === 'upcoming') {
      const eventDate = new Date(event.date);
      const today = new Date();
      return matchesSearch && eventDate >= today;
    }
    if (filterType === 'registered') return matchesSearch && event.isRegistered;
    
    return matchesSearch;
  });

  const getEventStatus = (date: string) => {
    const eventDate = new Date(date);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: 'Past Event', color: 'text-gray-500', bgColor: 'bg-gray-100 dark:bg-gray-700' };
    } else if (diffDays === 0) {
      return { text: 'Today', color: 'text-green-700', bgColor: 'bg-green-100 dark:bg-green-900/20' };
    } else if (diffDays === 1) {
      return { text: 'Tomorrow', color: 'text-yellow-700', bgColor: 'bg-yellow-100 dark:bg-yellow-900/20' };
    } else if (diffDays <= 7) {
      return { text: `${diffDays} days`, color: 'text-blue-700', bgColor: 'bg-blue-100 dark:bg-blue-900/20' };
    } else {
      return { text: `${diffDays} days`, color: 'text-purple-700', bgColor: 'bg-purple-100 dark:bg-purple-900/20' };
    }
  };

  const stats = [
    {
      title: 'Total Events',
      value: events.length,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Upcoming Events',
      value: events.filter(e => new Date(e.date) >= new Date()).length,
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Registered Events',
      value: events.filter(e => e.isRegistered).length,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: 'This Month',
      value: events.filter(e => {
        const eventDate = new Date(e.date);
        const today = new Date();
        return eventDate.getMonth() === today.getMonth() && eventDate.getFullYear() === today.getFullYear();
      }).length,
      icon: MapPin,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Events</h1>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          Create Event
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

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Events</option>
              <option value="upcoming">Upcoming</option>
              <option value="registered">Registered</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => {
          const status = getEventStatus(event.date);
          return (
            <div
              key={event.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                  {event.name}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.bgColor} ${status.color}`}>
                  {status.text}
                </span>
              </div>

              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                {event.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(event.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                {event.location && (
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <MapPin className="w-4 h-4 mr-2" />
                    {event.location}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => toggleRegistration(event.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    event.isRegistered
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/30'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {event.isRegistered ? 'Registered' : 'Register'}
                </button>
                
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No events found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm ? `No events match "${searchTerm}"` : 'No events available at the moment.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Events;