// Firebase service for dynamic database building based on user interactions
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  increment, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import type { Community, Event, Student } from '../types';

class FirebaseService {
  // Initialize user profile in Firestore when they first sign up
  async initializeUserProfile(userId: string, userData: {
    name: string;
    email: string;
    studentId?: string;
  }) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          ...userData,
          joinedCommunities: [],
          eventRegistrations: [],
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp(),
          profile: {
            bio: '',
            interests: [],
            academicYear: '',
            department: ''
          },
          stats: {
            communitiesJoined: 0,
            eventsAttended: 0,
            eventsCreated: 0,
            certificatesEarned: 0
          }
        });
        
        console.log('User profile initialized in Firestore');
      }
    } catch (error) {
      console.error('Error initializing user profile:', error);
    }
  }

  // Create or update community in Firestore
  async createCommunity(communityData: Omit<Community, 'id' | 'memberCount' | 'members'>, creatorId: string) {
    try {
      const communityRef = await addDoc(collection(db, 'communities'), {
        ...communityData,
        memberCount: 1,
        members: [creatorId],
        createdAt: serverTimestamp(),
        createdBy: creatorId,
        isActive: true,
        settings: {
          isPublic: true,
          allowMemberPosts: true,
          requireApproval: false
        },
        stats: {
          totalEvents: 0,
          totalPosts: 0,
          totalMembers: 1
        }
      });

      // Add community to user's joined communities
      await this.joinCommunity(communityRef.id, creatorId);
      
      console.log('Community created with ID:', communityRef.id);
      return communityRef.id;
    } catch (error) {
      console.error('Error creating community:', error);
      throw error;
    }
  }

  // Join a community - builds user and community relationships
  async joinCommunity(communityId: string, userId: string) {
    try {
      const batch = writeBatch(db);
      
      // Update user's joined communities
      const userRef = doc(db, 'users', userId);
      batch.update(userRef, {
        joinedCommunities: arrayUnion(communityId),
        'stats.communitiesJoined': increment(1),
        lastActive: serverTimestamp()
      });

      // Update community member count and members list
      const communityRef = doc(db, 'communities', communityId);
      batch.update(communityRef, {
        members: arrayUnion(userId),
        memberCount: increment(1),
        'stats.totalMembers': increment(1),
        lastActivity: serverTimestamp()
      });

      // Create membership record for analytics
      const membershipRef = doc(db, 'communities', communityId, 'memberships', userId);
      batch.set(membershipRef, {
        userId,
        joinedAt: serverTimestamp(),
        role: 'member',
        isActive: true
      });

      await batch.commit();
      console.log('User joined community successfully');
    } catch (error) {
      console.error('Error joining community:', error);
      throw error;
    }
  }

  // Leave a community
  async leaveCommunity(communityId: string, userId: string) {
    try {
      const batch = writeBatch(db);
      
      // Update user's joined communities
      const userRef = doc(db, 'users', userId);
      batch.update(userRef, {
        joinedCommunities: arrayRemove(communityId),
        'stats.communitiesJoined': increment(-1),
        lastActive: serverTimestamp()
      });

      // Update community member count and members list
      const communityRef = doc(db, 'communities', communityId);
      batch.update(communityRef, {
        members: arrayRemove(userId),
        memberCount: increment(-1),
        'stats.totalMembers': increment(-1),
        lastActivity: serverTimestamp()
      });

      // Update membership record
      const membershipRef = doc(db, 'communities', communityId, 'memberships', userId);
      batch.update(membershipRef, {
        isActive: false,
        leftAt: serverTimestamp()
      });

      await batch.commit();
      console.log('User left community successfully');
    } catch (error) {
      console.error('Error leaving community:', error);
      throw error;
    }
  }

  // Create event - builds event structure in Firestore
  async createEvent(eventData: Omit<Event, 'id' | 'currentParticipants' | 'registrations'>, creatorId: string) {
    try {
      const eventRef = await addDoc(collection(db, 'events'), {
        ...eventData,
        currentParticipants: 0,
        registrations: [],
        createdAt: serverTimestamp(),
        createdBy: creatorId,
        isActive: true,
        settings: {
          requireApproval: false,
          allowWaitlist: true,
          sendReminders: true
        },
        stats: {
          totalRegistrations: 0,
          totalAttendees: 0,
          totalCertificatesIssued: 0
        }
      });

      // If event is associated with a community, update community stats
      if (eventData.communityId) {
        const communityRef = doc(db, 'communities', eventData.communityId);
        await updateDoc(communityRef, {
          'stats.totalEvents': increment(1),
          lastActivity: serverTimestamp()
        });
      }

      // Update user stats
      const userRef = doc(db, 'users', creatorId);
      await updateDoc(userRef, {
        'stats.eventsCreated': increment(1),
        lastActive: serverTimestamp()
      });

      console.log('Event created with ID:', eventRef.id);
      return eventRef.id;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  // Register for event - builds registration relationships
  async registerForEvent(eventId: string, userId: string) {
    try {
      const batch = writeBatch(db);
      
      // Create registration record
      const registrationRef = doc(db, 'events', eventId, 'registrations', userId);
      batch.set(registrationRef, {
        userId,
        registeredAt: serverTimestamp(),
        status: 'registered',
        attendanceStatus: 'pending',
        paymentStatus: 'not_required'
      });

      // Update event participant count
      const eventRef = doc(db, 'events', eventId);
      batch.update(eventRef, {
        registrations: arrayUnion(userId),
        currentParticipants: increment(1),
        'stats.totalRegistrations': increment(1),
        lastActivity: serverTimestamp()
      });

      // Update user's event registrations
      const userRef = doc(db, 'users', userId);
      batch.update(userRef, {
        eventRegistrations: arrayUnion(eventId),
        lastActive: serverTimestamp()
      });

      await batch.commit();
      console.log('User registered for event successfully');
    } catch (error) {
      console.error('Error registering for event:', error);
      throw error;
    }
  }

  // Unregister from event
  async unregisterFromEvent(eventId: string, userId: string) {
    try {
      const batch = writeBatch(db);
      
      // Update registration record
      const registrationRef = doc(db, 'events', eventId, 'registrations', userId);
      batch.update(registrationRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp()
      });

      // Update event participant count
      const eventRef = doc(db, 'events', eventId);
      batch.update(eventRef, {
        registrations: arrayRemove(userId),
        currentParticipants: increment(-1),
        'stats.totalRegistrations': increment(-1),
        lastActivity: serverTimestamp()
      });

      // Update user's event registrations
      const userRef = doc(db, 'users', userId);
      batch.update(userRef, {
        eventRegistrations: arrayRemove(eventId),
        lastActive: serverTimestamp()
      });

      await batch.commit();
      console.log('User unregistered from event successfully');
    } catch (error) {
      console.error('Error unregistering from event:', error);
      throw error;
    }
  }

  // Add post to community - builds community content
  async addCommunityPost(communityId: string, userId: string, content: string) {
    try {
      const postRef = await addDoc(collection(db, 'communities', communityId, 'posts'), {
        content,
        authorId: userId,
        createdAt: serverTimestamp(),
        likes: [],
        likeCount: 0,
        comments: [],
        commentCount: 0,
        isActive: true
      });

      // Update community stats
      const communityRef = doc(db, 'communities', communityId);
      await updateDoc(communityRef, {
        'stats.totalPosts': increment(1),
        lastActivity: serverTimestamp()
      });

      console.log('Community post added with ID:', postRef.id);
      return postRef.id;
    } catch (error) {
      console.error('Error adding community post:', error);
      throw error;
    }
  }

  // Mark event attendance - builds attendance records
  async markEventAttendance(eventId: string, userId: string, attended: boolean) {
    try {
      const registrationRef = doc(db, 'events', eventId, 'registrations', userId);
      await updateDoc(registrationRef, {
        attendanceStatus: attended ? 'attended' : 'absent',
        attendanceMarkedAt: serverTimestamp()
      });

      if (attended) {
        // Update event stats
        const eventRef = doc(db, 'events', eventId);
        await updateDoc(eventRef, {
          'stats.totalAttendees': increment(1)
        });

        // Update user stats
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          'stats.eventsAttended': increment(1),
          lastActive: serverTimestamp()
        });
      }

      console.log('Event attendance marked successfully');
    } catch (error) {
      console.error('Error marking event attendance:', error);
      throw error;
    }
  }

  // Issue certificate - builds certificate records
  async issueCertificate(eventId: string, userId: string, certificateData: {
    type: 'participation' | 'achievement' | 'completion';
    title: string;
    description?: string;
  }) {
    try {
      const certificateRef = await addDoc(collection(db, 'certificates'), {
        eventId,
        userId,
        ...certificateData,
        issuedAt: serverTimestamp(),
        certificateId: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        isValid: true,
        downloadCount: 0
      });

      // Update event stats
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        'stats.totalCertificatesIssued': increment(1)
      });

      // Update user stats
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        'stats.certificatesEarned': increment(1),
        lastActive: serverTimestamp()
      });

      console.log('Certificate issued with ID:', certificateRef.id);
      return certificateRef.id;
    } catch (error) {
      console.error('Error issuing certificate:', error);
      throw error;
    }
  }

  // Get user's complete profile with all relationships
  async getUserProfile(userId: string) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }

      const userData = userDoc.data();
      
      // Get user's communities
      const communities = await Promise.all(
        (userData.joinedCommunities || []).map(async (communityId: string) => {
          const communityDoc = await getDoc(doc(db, 'communities', communityId));
          return communityDoc.exists() ? { id: communityDoc.id, ...communityDoc.data() } : null;
        })
      );

      // Get user's events
      const events = await Promise.all(
        (userData.eventRegistrations || []).map(async (eventId: string) => {
          const eventDoc = await getDoc(doc(db, 'events', eventId));
          return eventDoc.exists() ? { id: eventDoc.id, ...eventDoc.data() } : null;
        })
      );

      // Get user's certificates
      const certificatesQuery = query(
        collection(db, 'certificates'),
        where('userId', '==', userId),
        orderBy('issuedAt', 'desc')
      );
      const certificatesSnapshot = await getDocs(certificatesQuery);
      const certificates = certificatesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return {
        ...userData,
        communities: communities.filter(Boolean),
        events: events.filter(Boolean),
        certificates
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  // Real-time listeners for live updates
  subscribeToUserCommunities(userId: string, callback: (communities: Community[]) => void) {
    const userRef = doc(db, 'users', userId);
    
    return onSnapshot(userRef, async (userDoc) => {
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const communityIds = userData.joinedCommunities || [];
        
        if (communityIds.length > 0) {
          const communitiesQuery = query(
            collection(db, 'communities'),
            where('__name__', 'in', communityIds)
          );
          
          const communitiesSnapshot = await getDocs(communitiesQuery);
          const communities = communitiesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Community[];
          
          callback(communities);
        } else {
          callback([]);
        }
      }
    });
  }

  subscribeToUserEvents(userId: string, callback: (events: Event[]) => void) {
    const userRef = doc(db, 'users', userId);
    
    return onSnapshot(userRef, async (userDoc) => {
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const eventIds = userData.eventRegistrations || [];
        
        if (eventIds.length > 0) {
          const eventsQuery = query(
            collection(db, 'events'),
            where('__name__', 'in', eventIds)
          );
          
          const eventsSnapshot = await getDocs(eventsQuery);
          const events = eventsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Event[];
          
          callback(events);
        } else {
          callback([]);
        }
      }
    });
  }

  // Analytics and insights
  async getCommunityAnalytics(communityId: string) {
    try {
      const communityDoc = await getDoc(doc(db, 'communities', communityId));
      if (!communityDoc.exists()) {
        throw new Error('Community not found');
      }

      // Get member growth over time
      const membershipsQuery = query(
        collection(db, 'communities', communityId, 'memberships'),
        orderBy('joinedAt', 'asc')
      );
      const membershipsSnapshot = await getDocs(membershipsQuery);
      
      // Get community events
      const eventsQuery = query(
        collection(db, 'events'),
        where('communityId', '==', communityId),
        orderBy('createdAt', 'desc')
      );
      const eventsSnapshot = await getDocs(eventsQuery);

      return {
        community: { id: communityDoc.id, ...communityDoc.data() },
        membershipHistory: membershipsSnapshot.docs.map(doc => doc.data()),
        events: eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        totalMembers: membershipsSnapshot.size,
        totalEvents: eventsSnapshot.size
      };
    } catch (error) {
      console.error('Error getting community analytics:', error);
      throw error;
    }
  }

  // Bulk operations for admin/setup
  async seedInitialData() {
    try {
      // This would be called once to set up initial communities and events
      const batch = writeBatch(db);
      
      // Add some initial communities
      const techClubRef = doc(collection(db, 'communities'));
      batch.set(techClubRef, {
        name: 'Technology Club',
        description: 'Explore the latest in technology, coding, and innovation.',
        tags: ['Technology', 'Programming', 'Innovation'],
        memberCount: 0,
        members: [],
        createdAt: serverTimestamp(),
        isActive: true
      });

      // Add more initial data as needed...
      
      await batch.commit();
      console.log('Initial data seeded successfully');
    } catch (error) {
      console.error('Error seeding initial data:', error);
      throw error;
    }
  }
}

export const firebaseService = new FirebaseService();