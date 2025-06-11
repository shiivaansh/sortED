import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Clock, Filter, Search, Plus, Trophy, Award, X, Download } from 'lucide-react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../contexts/AuthContext';
import { firebaseService } from '../services/firebaseService';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';

interface Event {
  id: string;
  name: string;
  date: string;
  endDate?: string;
  type: 'Intra-school' | 'Inter-school';
  hostedBy: string;
  communityId?: string;
  description: string;
  fullDescription?: string;
  location?: string;
  maxParticipants?: number;
  currentParticipants: number;
  registrations: string[];
  rules?: string[];
  schedule?: Array<{
    time: string;
    activity: string;
  }>;
  rounds?: Array<{
    name: string;
    description: string;
    date: string;
  }>;
  results?: Array<{
    position: number;
    participant: string;
    score?: number;
  }>;
  status: 'upcoming' | 'ongoing' | 'completed';
  registrationDeadline?: string;
  tags: string[];
}

const Events: React.FC = () => {
  const { currentUser } = useFirebaseAuth(); // This will auto-initialize user profile
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'past' | 'registered'>('upcoming');
  const [filterCommunity, setFilterCommunity] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [userRegistrations, setUserRegistrations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for development
  const mockEvents: Event[] = [
    {
      id: 'science-fair-2024',
      name: 'Science Fair 2024',
      date: '2024-02-15',
      endDate: '2024-02-16',
      type: 'Inter-school',
      hostedBy: 'Science Department',
      description: 'Annual science fair showcasing student projects and innovations.',
      fullDescription: 'Join us for the most anticipated science event of the year! Students from various schools will present their innovative projects across multiple categories including Physics, Chemistry, Biology, and Environmental Science.',
      location: 'Main Auditorium',
      maxParticipants: 200,
      currentParticipants: 156,
      registrations: ['user1', 'user2'],
      rules: [
        'Projects must be original work',
        'Maximum team size of 3 students',
        'Presentation time limit: 10 minutes',
        'All materials must be provided by participants'
      ],
      schedule: [
        { time: '09:00 AM', activity: 'Registration and Setup' },
        { time: '10:00 AM', activity: 'Opening Ceremony' },
        { time: '10:30 AM', activity: 'Project Presentations Begin' },
        { time: '12:30 PM', activity: 'Lunch Break' },
        { time: '01:30 PM', activity: 'Judging Round' },
        { time: '04:00 PM', activity: 'Results and Awards' }
      ],
      rounds: [
        {
          name: 'Preliminary Round',
          description: 'Initial project presentation and screening',
          date: '2024-02-15'
        },
        {
          name: 'Final Round',
          description: 'Top 20 projects compete for awards',
          date: '2024-02-16'
        }
      ],
      status: 'upcoming',
      registrationDeadline: '2024-02-10',
      tags: ['Science', 'Innovation', 'Competition']
    },
    {
      id: 'debate-championship',
      name: 'Inter-School Debate Championship',
      date: '2024-02-20',
      type: 'Inter-school',
      hostedBy: 'Debate Society',
      communityId: 'debate-society',
      description: 'Regional debate competition on current affairs.',
      fullDescription: 'Test your argumentation skills in this prestigious debate championship. Teams will debate on contemporary issues affecting society.',
      location: 'Conference Hall',
      maxParticipants: 64,
      currentParticipants: 48,
      registrations: ['user3'],
      rules: [
        'Teams of 2 speakers each',
        'Topics announced 30 minutes before debate',
        'Each speaker gets 4 minutes',
        'No electronic devices allowed'
      ],
      schedule: [
        { time: '09:00 AM', activity: 'Team Registration' },
        { time: '09:30 AM', activity: 'Opening and Rules Briefing' },
        { time: '10:00 AM', activity: 'Preliminary Rounds' },
        { time: '02:00 PM', activity: 'Semi-Finals' },
        { time: '04:00 PM', activity: 'Final Round' },
        { time: '05:30 PM', activity: 'Award Ceremony' }
      ],
      status: 'upcoming',
      registrationDeadline: '2024-02-18',
      tags: ['Debate', 'Public Speaking', 'Competition']
    },
    {
      id: 'cultural-fest',
      name: 'Cultural Fest 2024',
      date: '2024-03-10',
      endDate: '2024-03-12',
      type: 'Intra-school',
      hostedBy: 'Cultural Committee',
      description: 'Celebrate diversity with music, dance, and cultural performances.',
      fullDescription: 'A three-day celebration of culture featuring performances, food stalls, art exhibitions, and cultural workshops from around the world.',
      location: 'School Grounds',
      currentParticipants: 89,
      registrations: [],
      status: 'upcoming',
      tags: ['Culture', 'Performance', 'Arts']
    },
    {
      id: 'math-olympiad-2023',
      name: 'Mathematics Olympiad 2023',
      date: '2024-01-15',
      type: 'Inter-school',
      hostedBy: 'Mathematics Department',
      description: 'Annual mathematics competition completed.',
      location: 'Computer Lab',
      currentParticipants: 120,
      registrations: ['user1', 'user4'],
      results: [
        { position: 1, participant: 'Alice Johnson', score: 95 },
        { position: 2, participant: 'Bob Smith', score: 92 },
        { position: 3, participant: 'Carol Davis', score: 89 }
      ],
      status: 'completed',
      tags: ['Mathematics', 'Competition', 'Academic']
    },
    {
      id: 'robotics-competition',
      name: 'Robotics Competition',
      date: '2024-04-05',
      type: 'Inter-school',
      hostedBy: 'Robotics Team',
      communityId: 'robotics-team',
      description: 'Build and program robots to complete challenging tasks.',
      fullDescription: 'Teams will design, build, and program autonomous robots to navigate obstacle courses and complete specific tasks.',
      location: 'Engineering Lab',
      maxParticipants: 40,
      currentParticipants: 28,
      registrations: [],
      status: 'upcoming',
      registrationDeadline: '2024-03-25',
      tags: ['Robotics', 'Engineering', 'Technology']
    }
  ];

  useEffect(() => {
    loadEvents();
    if (currentUser) {
      loadUserRegistrations();
    }
  }, [currentUser]);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, filterStatus, filterCommunity]);

  const loadEvents = async () => {
    try {
      // Try to load from Firestore first
      const eventsRef = collection(db, 'events');
      const snapshot = await getDocs(query(eventsRef, orderBy('date', 'asc')));
      
      if (snapshot.empty) {
        // If no events exist, seed with mock data and create them in Firestore
        console.log('No events found, seeding with initial data...');
        await seedEventsInFirestore();
        setEvents(mockEvents);
      } else {
        const eventsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Event[];
        setEvents(eventsData);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      // Fallback to mock data
      setEvents(mockEvents);
    } finally {
      setLoading(false);
    }
  };

  const seedEventsInFirestore = async () => {
    try {
      for (const event of mockEvents) {
        await firebaseService.createEvent({
          name: event.name,
          date: event.date,
          endDate: event.endDate,
          type: event.type,
          hostedBy: event.hostedBy,
          communityId: event.communityId,
          description: event.description,
          fullDescription: event.fullDescription,
          location: event.location,
          maxParticipants: event.maxParticipants,
          rules: event.rules,
          schedule: event.schedule,
          rounds: event.rounds,
          results: event.results,
          status: event.status,
          registrationDeadline: event.registrationDeadline,
          tags: event.tags
        }, 'system'); // Use system as creator for initial seed
      }
      console.log('Events seeded in Firestore');
    } catch (error) {
      console.error('Error seeding events:', error);
    }
  };

  const loadUserRegistrations = async () => {
    if (!currentUser) return;
    
    try {
      // Set up real-time listener for user's events
      const unsubscribe = firebaseService.subscribeToUserEvents(
        currentUser.uid,
        (userEventsData) => {
          setUserRegistrations(userEventsData.map(e => e.id));
        }
      );

      // Return cleanup function
      return unsubscribe;
    } catch (error) {
      console.error('Error loading user registrations:', error);
      // Fallback to mock data
      setUserRegistrations(['science-fair-2024', 'math-olympiad-2023']);
    }
  };

  const filterEvents = () => {
    let filtered = events.filter(event => {
      const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.hostedBy.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesStatus = true;
      const eventDate = new Date(event.date);
      const today = new Date();
      
      switch (filterStatus) {
        case 'upcoming':
          matchesStatus = eventDate >= today;
          break;
        case 'past':
          matchesStatus = eventDate < today;
          break;
        case 'registered':
          matchesStatus = userRegistrations.includes(event.id);
          break;
      }
      
      const matchesCommunity = filterCommunity === 'all' || event.hostedBy === filterCommunity;
      
      return matchesSearch && matchesStatus && matchesCommunity;
    });

    setFilteredEvents(filtered);
  };

  const toggleEventRegistration = async (eventId: string) => {
    if (!currentUser) return;

    try {
      const isRegistered = userRegistrations.includes(eventId);
      
      if (isRegistered) {
        await firebaseService.unregisterFromEvent(eventId, currentUser.uid);
      } else {
        await firebaseService.registerForEvent(eventId, currentUser.uid);
      }

      // The real-time listener will update the UI automatically
      console.log(`${isRegistered ? 'Unregistered from' : 'Registered for'} event successfully`);
    } catch (error) {
      console.error('Error updating event registration:', error);
      // Fallback to local state update for development
      if (userRegistrations.includes(eventId)) {
        setUserRegistrations(prev => prev.filter(id => id !== eventId));
        setEvents(prev => prev.map(event => 
          event.id === eventId 
            ? { 
                ...event, 
                currentParticipants: event.currentParticipants - 1,
                registrations: event.registrations.filter(id => id !== currentUser.uid)
              }
            : event
        ));
      } else {
        setUserRegistrations(prev => [...prev, eventId]);
        setEvents(prev => prev.map(event => 
          event.id === eventId 
            ? { 
                ...event, 
                currentParticipants: event.currentParticipants + 1,
                registrations: [...event.registrations, currentUser.uid]
              }
            : event
        ));
      }
    }
  };

  const getEventStatusColor = (status: Event['status']) => {
    switch (status) {
      case 'upcoming':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300';
      case 'ongoing':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-300';
      case 'completed':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getEventTypeColor = (type: Event['type']) => {
    return type === 'Inter-school' 
      ? 'text-purple-600 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300'
      : 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-300';
  };

  const generateCertificate = async (event: Event) => {
    if (!currentUser) return;
    
    try {
      await firebaseService.issueCertificate(event.id, currentUser.uid, {
        type: 'participation',
        title: `Certificate of Participation - ${event.name}`,
        description: `Awarded for participating in ${event.name}`
      });
      
      alert(`Certificate for ${event.name} has been issued! Check your profile for download.`);
    } catch (error) {
      console.error('Error generating certificate:', error);
      alert(`Certificate for ${event.name} would be generated here!`);
    }
  };

  const uniqueHosts = Array.from(new Set(events.map(e => e.hostedBy)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Events</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{events.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Upcoming</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {events.filter(e => new Date(e.date) >= new Date()).length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Registered</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{userRegistrations.length}</p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {events.filter(e => e.status === 'completed').length}
              </p>
            </div>
            <Trophy className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
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
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Events</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
                <option value="registered">Registered</option>
              </select>
            </div>
            
            <select
              value={filterCommunity}
              onChange={(e) => setFilterCommunity(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Hosts</option>
              {uniqueHosts.map(host => (
                <option key={host} value={host}>{host}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => {
          const isRegistered = userRegistrations.includes(event.id);
          const isRegistrationClosed = event.registrationDeadline && new Date(event.registrationDeadline) < new Date();
          const isFull = event.maxParticipants && event.currentParticipants >= event.maxParticipants;
          
          return (
            <div
              key={event.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedEvent(event)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {event.name}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEventStatusColor(event.status)}`}>
                      {event.status}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEventTypeColor(event.type)}`}>
                      {event.type}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                {event.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(event.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                  {event.endDate && ` - ${new Date(event.endDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}`}
                </div>
                
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Users className="w-4 h-4 mr-2" />
                  Hosted by {event.hostedBy}
                </div>
                
                {event.location && (
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <MapPin className="w-4 h-4 mr-2" />
                    {event.location}
                  </div>
                )}
                
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Users className="w-4 h-4 mr-2" />
                  {event.currentParticipants} participants
                  {event.maxParticipants && ` / ${event.maxParticipants}`}
                </div>
              </div>

              <div className="flex space-x-2">
                {event.status === 'upcoming' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleEventRegistration(event.id);
                    }}
                    disabled={!isRegistered && (isRegistrationClosed || isFull)}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      isRegistered
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/30'
                        : isRegistrationClosed || isFull
                        ? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isRegistered ? 'Registered' : 
                     isRegistrationClosed ? 'Registration Closed' :
                     isFull ? 'Event Full' : 'Register'}
                  </button>
                )}
                
                {event.status === 'completed' && isRegistered && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      generateCertificate(event);
                    }}
                    className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                  >
                    <Award className="w-4 h-4 mr-2" />
                    Certificate
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {selectedEvent.name}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getEventStatusColor(selectedEvent.status)}`}>
                      {selectedEvent.status}
                    </span>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getEventTypeColor(selectedEvent.type)}`}>
                      {selectedEvent.type}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Event Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Calendar className="w-5 h-5 mr-3" />
                      <div>
                        <p className="font-medium">
                          {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        {selectedEvent.endDate && (
                          <p className="text-sm">
                            to {new Date(selectedEvent.endDate).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Users className="w-5 h-5 mr-3" />
                      <span>Hosted by {selectedEvent.hostedBy}</span>
                    </div>
                    
                    {selectedEvent.location && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <MapPin className="w-5 h-5 mr-3" />
                        <span>{selectedEvent.location}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Users className="w-5 h-5 mr-3" />
                      <span>
                        {selectedEvent.currentParticipants} participants
                        {selectedEvent.maxParticipants && ` / ${selectedEvent.maxParticipants} max`}
                      </span>
                    </div>
                    
                    {selectedEvent.registrationDeadline && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Clock className="w-5 h-5 mr-3" />
                        <span>
                          Registration deadline: {new Date(selectedEvent.registrationDeadline).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Registration Status</h3>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    {userRegistrations.includes(selectedEvent.id) ? (
                      <div className="text-green-600 dark:text-green-400">
                        <div className="flex items-center mb-2">
                          <Users className="w-5 h-5 mr-2" />
                          <span className="font-medium">You are registered!</span>
                        </div>
                        <p className="text-sm">You will receive updates about this event.</p>
                      </div>
                    ) : (
                      <div className="text-gray-600 dark:text-gray-400">
                        <div className="flex items-center mb-2">
                          <Clock className="w-5 h-5 mr-2" />
                          <span className="font-medium">Not registered</span>
                        </div>
                        <p className="text-sm">Register to participate in this event.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Description</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedEvent.fullDescription || selectedEvent.description}
                </p>
              </div>

              {selectedEvent.rules && selectedEvent.rules.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Rules & Guidelines</h3>
                  <ul className="space-y-2">
                    {selectedEvent.rules.map((rule, index) => (
                      <li key={index} className="flex items-start text-gray-600 dark:text-gray-400">
                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedEvent.schedule && selectedEvent.schedule.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Schedule</h3>
                  <div className="space-y-3">
                    {selectedEvent.schedule.map((item, index) => (
                      <div key={index} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="w-20 text-sm font-medium text-blue-600 dark:text-blue-400">
                          {item.time}
                        </div>
                        <div className="flex-1 text-gray-900 dark:text-white">
                          {item.activity}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedEvent.rounds && selectedEvent.rounds.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Competition Rounds</h3>
                  <div className="space-y-3">
                    {selectedEvent.rounds.map((round, index) => (
                      <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">{round.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{round.description}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Date: {new Date(round.date).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedEvent.results && selectedEvent.results.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                    <Trophy className="w-5 h-5 mr-2" />
                    Results & Leaderboard
                  </h3>
                  <div className="space-y-2">
                    {selectedEvent.results.map((result, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          result.position === 1 ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                          result.position === 2 ? 'bg-gray-50 dark:bg-gray-700/50' :
                          result.position === 3 ? 'bg-orange-50 dark:bg-orange-900/20' :
                          'bg-gray-50 dark:bg-gray-700/50'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                            result.position === 1 ? 'bg-yellow-500 text-white' :
                            result.position === 2 ? 'bg-gray-400 text-white' :
                            result.position === 3 ? 'bg-orange-500 text-white' :
                            'bg-gray-300 text-gray-700'
                          }`}>
                            {result.position}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {result.participant}
                          </span>
                        </div>
                        {result.score && (
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Score: {result.score}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                {selectedEvent.status === 'upcoming' && (
                  <button
                    onClick={() => {
                      toggleEventRegistration(selectedEvent.id);
                      setSelectedEvent(null);
                    }}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                      userRegistrations.includes(selectedEvent.id)
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {userRegistrations.includes(selectedEvent.id) ? 'Unregister' : 'Register Now'}
                  </button>
                )}
                
                {selectedEvent.status === 'completed' && userRegistrations.includes(selectedEvent.id) && (
                  <button
                    onClick={() => generateCertificate(selectedEvent)}
                    className="flex-1 py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download Certificate
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No events found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm ? `No events match "${searchTerm}"` : 'No events available for the selected filters.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Events;