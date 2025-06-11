import React, { useState, useEffect } from 'react';
import { Users, Tag, Plus, Search, Filter, X, Calendar, MapPin, Clock } from 'lucide-react';
import { collection, getDocs, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../contexts/AuthContext';
import { firebaseService } from '../services/firebaseService';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';

interface Community {
  id: string;
  name: string;
  description: string;
  logo?: string;
  tags: string[];
  memberCount: number;
  members: string[];
  createdAt: Date;
  upcomingEvents?: Event[];
  recentPosts?: Array<{
    id: string;
    content: string;
    author: string;
    timestamp: Date;
  }>;
}

interface Event {
  id: string;
  name: string;
  date: string;
  communityId: string;
  description: string;
}

const Communities: React.FC = () => {
  const { currentUser } = useFirebaseAuth(); // This will auto-initialize user profile
  const [communities, setCommunities] = useState<Community[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'members' | 'recent'>('members');
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [userCommunities, setUserCommunities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for development - this will be replaced by real Firestore data
  const mockCommunities: Community[] = [
    {
      id: 'tech-club',
      name: 'Technology Club',
      description: 'Explore the latest in technology, coding, and innovation. Join us for workshops, hackathons, and tech talks.',
      tags: ['Technology', 'Programming', 'Innovation'],
      memberCount: 156,
      members: ['user1', 'user2'],
      createdAt: new Date('2024-01-01'),
      upcomingEvents: [
        {
          id: 'hackathon-2024',
          name: 'Annual Hackathon',
          date: '2024-02-15',
          communityId: 'tech-club',
          description: '48-hour coding challenge'
        }
      ],
      recentPosts: [
        {
          id: 'post1',
          content: 'New Python workshop this Friday!',
          author: 'Tech Lead',
          timestamp: new Date('2024-01-20')
        }
      ]
    },
    {
      id: 'debate-society',
      name: 'Debate Society',
      description: 'Sharpen your argumentation skills and engage in intellectual discussions on current affairs and philosophical topics.',
      tags: ['Debate', 'Public Speaking', 'Critical Thinking'],
      memberCount: 89,
      members: ['user3', 'user4'],
      createdAt: new Date('2024-01-05'),
      upcomingEvents: [
        {
          id: 'debate-championship',
          name: 'Inter-School Debate Championship',
          date: '2024-02-20',
          communityId: 'debate-society',
          description: 'Regional debate competition'
        }
      ]
    },
    {
      id: 'music-ensemble',
      name: 'Music Ensemble',
      description: 'Express yourself through music! From classical to contemporary, we welcome all musical talents and interests.',
      tags: ['Music', 'Performance', 'Arts'],
      memberCount: 124,
      members: ['user5'],
      createdAt: new Date('2024-01-10'),
      upcomingEvents: []
    },
    {
      id: 'environmental-club',
      name: 'Environmental Club',
      description: 'Make a difference for our planet. Join environmental initiatives, sustainability projects, and awareness campaigns.',
      tags: ['Environment', 'Sustainability', 'Social Impact'],
      memberCount: 67,
      members: [],
      createdAt: new Date('2024-01-15'),
      upcomingEvents: []
    },
    {
      id: 'photography-club',
      name: 'Photography Club',
      description: 'Capture moments and tell stories through the lens. Learn techniques, share work, and explore visual storytelling.',
      tags: ['Photography', 'Arts', 'Creative'],
      memberCount: 92,
      members: [],
      createdAt: new Date('2024-01-12'),
      upcomingEvents: []
    },
    {
      id: 'robotics-team',
      name: 'Robotics Team',
      description: 'Build, program, and compete with robots. Perfect for students interested in engineering and automation.',
      tags: ['Robotics', 'Engineering', 'Competition'],
      memberCount: 45,
      members: [],
      createdAt: new Date('2024-01-08'),
      upcomingEvents: []
    }
  ];

  useEffect(() => {
    loadCommunities();
    if (currentUser) {
      loadUserCommunities();
    }
  }, [currentUser]);

  useEffect(() => {
    filterCommunities();
  }, [communities, searchTerm, selectedTag, sortBy]);

  const loadCommunities = async () => {
    try {
      // Try to load from Firestore first
      const communitiesRef = collection(db, 'communities');
      const snapshot = await getDocs(query(communitiesRef, orderBy('memberCount', 'desc')));
      
      if (snapshot.empty) {
        // If no communities exist, seed with mock data and create them in Firestore
        console.log('No communities found, seeding with initial data...');
        await seedCommunitiesInFirestore();
        setCommunities(mockCommunities);
      } else {
        const communitiesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        })) as Community[];
        setCommunities(communitiesData);
      }
    } catch (error) {
      console.error('Error loading communities:', error);
      // Fallback to mock data
      setCommunities(mockCommunities);
    } finally {
      setLoading(false);
    }
  };

  const seedCommunitiesInFirestore = async () => {
    try {
      for (const community of mockCommunities) {
        await firebaseService.createCommunity({
          name: community.name,
          description: community.description,
          tags: community.tags,
          createdAt: community.createdAt
        }, 'system'); // Use system as creator for initial seed
      }
      console.log('Communities seeded in Firestore');
    } catch (error) {
      console.error('Error seeding communities:', error);
    }
  };

  const loadUserCommunities = async () => {
    if (!currentUser) return;
    
    try {
      // Set up real-time listener for user's communities
      const unsubscribe = firebaseService.subscribeToUserCommunities(
        currentUser.uid,
        (userCommunitiesData) => {
          setUserCommunities(userCommunitiesData.map(c => c.id));
        }
      );

      // Return cleanup function
      return unsubscribe;
    } catch (error) {
      console.error('Error loading user communities:', error);
      // Fallback to mock data
      setUserCommunities(['tech-club', 'music-ensemble']);
    }
  };

  const filterCommunities = () => {
    let filtered = communities.filter(community => {
      const matchesSearch = community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           community.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTag = selectedTag === 'all' || community.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    });

    // Sort communities
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'members':
          return b.memberCount - a.memberCount;
        case 'recent':
          return b.createdAt.getTime() - a.createdAt.getTime();
        default:
          return 0;
      }
    });

    setFilteredCommunities(filtered);
  };

  const toggleCommunityMembership = async (communityId: string) => {
    if (!currentUser) return;

    try {
      const isJoined = userCommunities.includes(communityId);
      
      if (isJoined) {
        await firebaseService.leaveCommunity(communityId, currentUser.uid);
      } else {
        await firebaseService.joinCommunity(communityId, currentUser.uid);
      }

      // The real-time listener will update the UI automatically
      console.log(`${isJoined ? 'Left' : 'Joined'} community successfully`);
    } catch (error) {
      console.error('Error updating community membership:', error);
      // Fallback to local state update for development
      if (userCommunities.includes(communityId)) {
        setUserCommunities(prev => prev.filter(id => id !== communityId));
        setCommunities(prev => prev.map(community => 
          community.id === communityId 
            ? { ...community, memberCount: community.memberCount - 1 }
            : community
        ));
      } else {
        setUserCommunities(prev => [...prev, communityId]);
        setCommunities(prev => prev.map(community => 
          community.id === communityId 
            ? { ...community, memberCount: community.memberCount + 1 }
            : community
        ));
      }
    }
  };

  const allTags = Array.from(new Set(communities.flatMap(c => c.tags)));

  const getCommunityIcon = (tags: string[]) => {
    if (tags.includes('Technology') || tags.includes('Programming')) return '💻';
    if (tags.includes('Music') || tags.includes('Arts')) return '🎵';
    if (tags.includes('Debate') || tags.includes('Public Speaking')) return '🗣️';
    if (tags.includes('Environment')) return '🌱';
    if (tags.includes('Photography')) return '📸';
    if (tags.includes('Robotics') || tags.includes('Engineering')) return '🤖';
    return '👥';
  };

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Communities</h1>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          Create Community
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Communities</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{communities.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Your Communities</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{userCommunities.length}</p>
            </div>
            <Tag className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Members</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                {communities.reduce((sum, c) => sum + c.memberCount, 0)}
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
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
              placeholder="Search communities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="members">Most Members</option>
              <option value="name">Name</option>
              <option value="recent">Recently Created</option>
            </select>
          </div>
        </div>
      </div>

      {/* Communities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCommunities.map((community) => {
          const isJoined = userCommunities.includes(community.id);
          return (
            <div
              key={community.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedCommunity(community)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{getCommunityIcon(community.tags)}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {community.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {community.memberCount} members
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                {community.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {community.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {community.tags.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                    +{community.tags.length - 3}
                  </span>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCommunityMembership(community.id);
                }}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  isJoined
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/30'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isJoined ? 'Joined' : 'Join Community'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Community Detail Modal */}
      {selectedCommunity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-4xl">{getCommunityIcon(selectedCommunity.tags)}</div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedCommunity.name}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                      {selectedCommunity.memberCount} members
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCommunity(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">About</h3>
                <p className="text-gray-600 dark:text-gray-400">{selectedCommunity.description}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCommunity.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {selectedCommunity.upcomingEvents && selectedCommunity.upcomingEvents.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Upcoming Events</h3>
                  <div className="space-y-2">
                    {selectedCommunity.upcomingEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                      >
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <h4 className="font-medium text-gray-900 dark:text-white">{event.name}</h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {new Date(event.date).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedCommunity.recentPosts && selectedCommunity.recentPosts.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Recent Updates</h3>
                  <div className="space-y-3">
                    {selectedCommunity.recentPosts.map((post) => (
                      <div
                        key={post.id}
                        className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <p className="text-gray-900 dark:text-white">{post.content}</p>
                        <div className="flex items-center justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
                          <span>By {post.author}</span>
                          <span>{post.timestamp.toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  toggleCommunityMembership(selectedCommunity.id);
                  setSelectedCommunity(null);
                }}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  userCommunities.includes(selectedCommunity.id)
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {userCommunities.includes(selectedCommunity.id) ? 'Leave Community' : 'Join Community'}
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredCommunities.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No communities found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm ? `No communities match "${searchTerm}"` : 'No communities available at the moment.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Communities;