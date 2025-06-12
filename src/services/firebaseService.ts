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
  writeBatch,
  Timestamp
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
        const profileData = {
          ...userData,
          studentId: userData.studentId || `STU-${Date.now()}`,
          rollNumber: `R${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
          joinedCommunities: [],
          eventRegistrations: [],
          assignmentSubmissions: [],
          attendanceRecords: [],
          gradeRecords: [],
          messageGroups: [],
          learningProgress: {},
          createdAt: serverTimestamp(),
          lastActive: serverTimestamp(),
          profile: {
            bio: '',
            interests: [],
            academicYear: 'Year 12',
            department: 'Science',
            avatar: '',
            grade: '12',
            section: 'A',
            parentContact: `+1-${Math.floor(Math.random() * 9000000000) + 1000000000}`
          },
          stats: {
            communitiesJoined: 0,
            eventsAttended: 0,
            eventsCreated: 0,
            certificatesEarned: 0,
            assignmentsSubmitted: 0,
            attendancePercentage: 0,
            currentGPA: 0
          },
          preferences: {
            notifications: true,
            emailUpdates: true,
            theme: 'light'
          },
          isActive: true,
          enrolledClasses: [] // Classes the student is enrolled in
        };
        
        await setDoc(userRef, profileData);
        console.log('✅ User profile initialized in Firestore:', userId);
        
        // Auto-enroll student in default classes based on grade
        await this.autoEnrollStudentInClasses(userId, profileData.profile.grade, profileData.profile.section);
        
        // Also create initial attendance records
        await this.initializeAttendanceRecords(userId);
        
        // Create initial assignment submissions
        await this.initializeAssignmentSubmissions(userId);
        
        // Create initial grade records
        await this.initializeGradeRecords(userId);
        
        return profileData;
      } else {
        console.log('✅ User profile already exists:', userId);
        return userDoc.data();
      }
    } catch (error) {
      console.error('❌ Error initializing user profile:', error);
      throw error;
    }
  }

  // Auto-enroll student in classes based on their grade and section
  async autoEnrollStudentInClasses(userId: string, grade: string, section: string) {
    try {
      // Find classes that match the student's grade and section
      const classesQuery = query(
        collection(db, 'classes'),
        where('grade', '==', grade),
        where('isActive', '==', true)
      );
      
      const classesSnapshot = await getDocs(classesQuery);
      const batch = writeBatch(db);
      const enrolledClasses = [];
      
      for (const classDoc of classesSnapshot.docs) {
        const classData = classDoc.data();
        
        // Enroll student in class
        const classRef = doc(db, 'classes', classDoc.id);
        batch.update(classRef, {
          students: arrayUnion(userId),
          lastUpdated: serverTimestamp()
        });
        
        enrolledClasses.push(classDoc.id);
        
        console.log(`📚 Auto-enrolled student ${userId} in class: ${classData.name}`);
      }
      
      // Update student's enrolled classes
      const userRef = doc(db, 'users', userId);
      batch.update(userRef, {
        enrolledClasses: enrolledClasses,
        lastActive: serverTimestamp()
      });
      
      await batch.commit();
      console.log('✅ Student auto-enrolled in classes successfully');
      
      return enrolledClasses;
    } catch (error) {
      console.error('❌ Error auto-enrolling student:', error);
      return [];
    }
  }

  // Get all students for teachers (real-time)
  subscribeToAllStudents(callback: (students: any[]) => void) {
    const studentsQuery = query(
      collection(db, 'users'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(studentsQuery, (snapshot) => {
      const students = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        lastActive: doc.data().lastActive?.toDate()
      }));
      
      console.log(`📊 Real-time students update: ${students.length} students`);
      callback(students);
    });
  }

  // Get students by class (real-time)
  subscribeToClassStudents(classId: string, callback: (students: any[]) => void) {
    const classRef = doc(db, 'classes', classId);
    
    return onSnapshot(classRef, async (classDoc) => {
      if (classDoc.exists()) {
        const classData = classDoc.data();
        const studentIds = classData.students || [];
        
        if (studentIds.length > 0) {
          // Get student details
          const studentsQuery = query(
            collection(db, 'users'),
            where('__name__', 'in', studentIds)
          );
          
          const studentsSnapshot = await getDocs(studentsQuery);
          const students = studentsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            lastActive: doc.data().lastActive?.toDate()
          }));
          
          callback(students);
        } else {
          callback([]);
        }
      }
    });
  }

  // Create assignment for specific class
  async createAssignmentForClass(assignmentData: {
    title: string;
    description: string;
    classId: string;
    subject: string;
    dueDate: string;
    maxMarks: number;
    instructions?: string;
  }, teacherId: string) {
    try {
      // Get class students
      const classDoc = await getDoc(doc(db, 'classes', assignmentData.classId));
      if (!classDoc.exists()) {
        throw new Error('Class not found');
      }
      
      const classData = classDoc.data();
      const studentIds = classData.students || [];
      
      // Create assignment
      const assignmentRef = await addDoc(collection(db, 'assignments'), {
        ...assignmentData,
        teacherId,
        studentIds, // Store which students this assignment is for
        createdAt: serverTimestamp(),
        isActive: true,
        stats: {
          totalSubmissions: 0,
          averageGrade: 0,
          submissionRate: 0,
          totalStudents: studentIds.length
        }
      });
      
      // Create submission placeholders for each student
      const batch = writeBatch(db);
      
      for (const studentId of studentIds) {
        const submissionRef = doc(collection(db, 'assignments', assignmentRef.id, 'submissions'));
        batch.set(submissionRef, {
          studentId,
          assignmentId: assignmentRef.id,
          status: 'pending',
          submittedAt: null,
          content: null,
          grade: null,
          feedback: null,
          createdAt: serverTimestamp()
        });
        
        // Add to student's assignment list
        const studentRef = doc(db, 'users', studentId);
        batch.update(studentRef, {
          assignmentSubmissions: arrayUnion(assignmentRef.id),
          lastActive: serverTimestamp()
        });
      }
      
      await batch.commit();
      
      console.log(`✅ Assignment created for ${studentIds.length} students in class ${assignmentData.classId}`);
      return assignmentRef.id;
    } catch (error) {
      console.error('❌ Error creating assignment for class:', error);
      throw error;
    }
  }

  // Mark attendance for entire class
  async markClassAttendance(classId: string, date: string, attendanceData: Array<{
    studentId: string;
    status: 'present' | 'absent' | 'late';
  }>) {
    try {
      const batch = writeBatch(db);
      
      // Create attendance records for each student
      for (const { studentId, status } of attendanceData) {
        const attendanceRef = doc(collection(db, 'attendance'));
        batch.set(attendanceRef, {
          studentId,
          classId,
          date,
          status,
          markedAt: serverTimestamp(),
          markedBy: 'teacher'
        });
        
        // Update student's attendance records
        const studentRef = doc(db, 'users', studentId);
        const studentDoc = await getDoc(studentRef);
        
        if (studentDoc.exists()) {
          const studentData = studentDoc.data();
          const attendanceRecords = studentData.attendanceRecords || [];
          const updatedRecords = [...attendanceRecords.filter((r: any) => r.date !== date), { date, status }];
          
          // Calculate attendance percentage
          const presentDays = updatedRecords.filter((r: any) => r.status === 'present').length;
          const attendancePercentage = Math.round((presentDays / updatedRecords.length) * 100);
          
          batch.update(studentRef, {
            attendanceRecords: updatedRecords,
            'stats.attendancePercentage': attendancePercentage,
            lastActive: serverTimestamp()
          });
        }
      }
      
      await batch.commit();
      console.log(`✅ Attendance marked for ${attendanceData.length} students on ${date}`);
    } catch (error) {
      console.error('❌ Error marking class attendance:', error);
      throw error;
    }
  }

  // Update marks for multiple students
  async updateStudentMarks(classId: string, subject: string, marksData: Array<{
    studentId: string;
    marks: number;
    maxMarks: number;
    examType: string;
  }>) {
    try {
      const batch = writeBatch(db);
      
      for (const { studentId, marks, maxMarks, examType } of marksData) {
        // Create grade record
        const gradeRef = doc(collection(db, 'grades'));
        batch.set(gradeRef, {
          studentId,
          classId,
          subject,
          marks,
          maxMarks,
          examType,
          recordedAt: serverTimestamp(),
          recordedBy: 'teacher'
        });
        
        // Update student's grade records and GPA
        const studentRef = doc(db, 'users', studentId);
        const studentDoc = await getDoc(studentRef);
        
        if (studentDoc.exists()) {
          const studentData = studentDoc.data();
          const gradeRecords = studentData.gradeRecords || [];
          
          // Update or add grade record
          const existingIndex = gradeRecords.findIndex((g: any) => g.name === subject);
          if (existingIndex >= 0) {
            gradeRecords[existingIndex] = { name: subject, marks, maxMarks };
          } else {
            gradeRecords.push({ name: subject, marks, maxMarks });
          }
          
          // Calculate GPA
          const totalPercentage = gradeRecords.reduce((sum: number, grade: any) => 
            sum + (grade.marks / grade.maxMarks) * 100, 0);
          const averagePercentage = totalPercentage / gradeRecords.length;
          const gpa = averagePercentage >= 90 ? 10 : Math.floor(averagePercentage / 10) + 1;
          
          batch.update(studentRef, {
            gradeRecords,
            'stats.currentGPA': gpa,
            lastActive: serverTimestamp()
          });
        }
      }
      
      await batch.commit();
      console.log(`✅ Marks updated for ${marksData.length} students in ${subject}`);
    } catch (error) {
      console.error('❌ Error updating student marks:', error);
      throw error;
    }
  }

  // Get real-time attendance for a class and date
  subscribeToClassAttendance(classId: string, date: string, callback: (attendance: any[]) => void) {
    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('classId', '==', classId),
      where('date', '==', date)
    );
    
    return onSnapshot(attendanceQuery, (snapshot) => {
      const attendance = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        markedAt: doc.data().markedAt?.toDate()
      }));
      
      console.log(`📅 Real-time attendance update for ${classId} on ${date}: ${attendance.length} records`);
      callback(attendance);
    });
  }

  // Get real-time assignment submissions
  subscribeToAssignmentSubmissions(assignmentId: string, callback: (submissions: any[]) => void) {
    const submissionsQuery = query(
      collection(db, 'assignments', assignmentId, 'submissions'),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(submissionsQuery, async (snapshot) => {
      const submissions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      
      // Enrich with student data
      const enrichedSubmissions = await Promise.all(
        submissions.map(async (submission) => {
          const studentDoc = await getDoc(doc(db, 'users', submission.studentId));
          const studentData = studentDoc.exists() ? studentDoc.data() : {};
          
          return {
            ...submission,
            studentName: studentData.name || 'Unknown Student',
            studentId: studentData.studentId || 'N/A',
            rollNumber: studentData.rollNumber || 'N/A'
          };
        })
      );
      
      console.log(`📝 Real-time submissions update for assignment ${assignmentId}: ${enrichedSubmissions.length} submissions`);
      callback(enrichedSubmissions);
    });
  }

  // Initialize attendance records for a user
  async initializeAttendanceRecords(userId: string) {
    try {
      const attendanceRef = collection(db, 'attendance');
      const batch = writeBatch(db);
      
      // Create attendance records for the past 30 days
      const today = new Date();
      const attendanceData = [];
      
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue;
        
        const status = Math.random() > 0.1 ? 'present' : Math.random() > 0.5 ? 'absent' : 'late';
        const dateStr = date.toISOString().split('T')[0];
        
        const recordRef = doc(attendanceRef);
        batch.set(recordRef, {
          userId,
          date: dateStr,
          status,
          subject: 'General',
          markedAt: Timestamp.fromDate(date),
          markedBy: 'system'
        });
        
        attendanceData.push({ date: dateStr, status });
      }
      
      await batch.commit();
      
      // Update user's attendance records
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        attendanceRecords: attendanceData,
        'stats.attendancePercentage': Math.round((attendanceData.filter(a => a.status === 'present').length / attendanceData.length) * 100)
      });
      
      console.log('✅ Attendance records initialized for user:', userId);
    } catch (error) {
      console.error('❌ Error initializing attendance records:', error);
    }
  }

  // Initialize assignment submissions
  async initializeAssignmentSubmissions(userId: string) {
    try {
      const assignmentsRef = collection(db, 'assignments');
      const batch = writeBatch(db);
      
      const subjects = ['Mathematics', 'Physics', 'Chemistry', 'English', 'History', 'Computer Science'];
      const assignments = [];
      
      subjects.forEach((subject, index) => {
        const assignmentRef = doc(assignmentsRef);
        const assignmentData = {
          subject,
          title: `${subject} Assignment #${index + 1}`,
          description: `Complete the ${subject.toLowerCase()} assignment covering recent topics.`,
          dueDate: new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          maxMarks: 100,
          difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)],
          createdAt: serverTimestamp(),
          createdBy: 'system',
          submissions: [],
          stats: {
            totalSubmissions: 0,
            averageGrade: 0
          }
        };
        
        batch.set(assignmentRef, assignmentData);
        assignments.push({ id: assignmentRef.id, ...assignmentData });
        
        // Create submission for this user
        const submissionRef = doc(collection(db, 'assignments', assignmentRef.id, 'submissions'));
        const submissionData = {
          userId,
          submittedAt: serverTimestamp(),
          content: `Submitted assignment for ${subject}`,
          grade: Math.floor(Math.random() * 30) + 70, // 70-100
          feedback: 'Good work! Keep it up.',
          status: Math.random() > 0.3 ? 'submitted' : 'pending'
        };
        
        batch.set(submissionRef, submissionData);
      });
      
      await batch.commit();
      
      // Update user's assignment submissions
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        assignmentSubmissions: assignments.map(a => a.id),
        'stats.assignmentsSubmitted': assignments.length
      });
      
      console.log('✅ Assignment submissions initialized for user:', userId);
    } catch (error) {
      console.error('❌ Error initializing assignment submissions:', error);
    }
  }

  // Initialize grade records
  async initializeGradeRecords(userId: string) {
    try {
      const gradesRef = collection(db, 'grades');
      const batch = writeBatch(db);
      
      const subjects = [
        { name: 'Mathematics', marks: 85, maxMarks: 100 },
        { name: 'Physics', marks: 78, maxMarks: 100 },
        { name: 'Chemistry', marks: 92, maxMarks: 100 },
        { name: 'English', marks: 88, maxMarks: 100 },
        { name: 'Computer Science', marks: 95, maxMarks: 100 },
        { name: 'History', marks: 82, maxMarks: 100 }
      ];
      
      subjects.forEach((subject) => {
        const gradeRef = doc(gradesRef);
        batch.set(gradeRef, {
          userId,
          subject: subject.name,
          marks: subject.marks,
          maxMarks: subject.maxMarks,
          semester: 'Semester 1',
          examType: 'Final',
          recordedAt: serverTimestamp(),
          recordedBy: 'system'
        });
      });
      
      await batch.commit();
      
      // Calculate and update GPA
      const totalPercentage = subjects.reduce((sum, subject) => sum + (subject.marks / subject.maxMarks) * 100, 0);
      const averagePercentage = totalPercentage / subjects.length;
      const gpa = averagePercentage >= 90 ? 10 : Math.floor(averagePercentage / 10) + 1;
      
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        gradeRecords: subjects,
        'stats.currentGPA': gpa
      });
      
      console.log('✅ Grade records initialized for user:', userId);
    } catch (error) {
      console.error('❌ Error initializing grade records:', error);
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
      
      console.log('✅ Community created with ID:', communityRef.id);
      return communityRef.id;
    } catch (error) {
      console.error('❌ Error creating community:', error);
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
      console.log('✅ User joined community successfully:', { communityId, userId });
    } catch (error) {
      console.error('❌ Error joining community:', error);
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
      console.log('✅ User left community successfully:', { communityId, userId });
    } catch (error) {
      console.error('❌ Error leaving community:', error);
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

      console.log('✅ Event created with ID:', eventRef.id);
      return eventRef.id;
    } catch (error) {
      console.error('❌ Error creating event:', error);
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
      console.log('✅ User registered for event successfully:', { eventId, userId });
    } catch (error) {
      console.error('❌ Error registering for event:', error);
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
      console.log('✅ User unregistered from event successfully:', { eventId, userId });
    } catch (error) {
      console.error('❌ Error unregistering from event:', error);
      throw error;
    }
  }

  // Submit assignment - builds assignment submission records
  async submitAssignment(assignmentId: string, userId: string, submissionData: {
    content: string;
    attachments?: string[];
  }) {
    try {
      const batch = writeBatch(db);
      
      // Create submission record
      const submissionRef = doc(db, 'assignments', assignmentId, 'submissions', userId);
      batch.set(submissionRef, {
        userId,
        ...submissionData,
        submittedAt: serverTimestamp(),
        status: 'submitted',
        grade: null,
        feedback: null
      });

      // Update assignment stats
      const assignmentRef = doc(db, 'assignments', assignmentId);
      batch.update(assignmentRef, {
        'stats.totalSubmissions': increment(1),
        lastActivity: serverTimestamp()
      });

      // Update user stats
      const userRef = doc(db, 'users', userId);
      batch.update(userRef, {
        assignmentSubmissions: arrayUnion(assignmentId),
        'stats.assignmentsSubmitted': increment(1),
        lastActive: serverTimestamp()
      });

      await batch.commit();
      console.log('✅ Assignment submitted successfully:', { assignmentId, userId });
    } catch (error) {
      console.error('❌ Error submitting assignment:', error);
      throw error;
    }
  }

  // Mark attendance - builds attendance records
  async markAttendance(userId: string, date: string, status: 'present' | 'absent' | 'late', subject?: string) {
    try {
      const attendanceRef = await addDoc(collection(db, 'attendance'), {
        userId,
        date,
        status,
        subject: subject || 'General',
        markedAt: serverTimestamp(),
        markedBy: 'system'
      });

      // Update user's attendance records
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const attendanceRecords = userData.attendanceRecords || [];
        const updatedRecords = [...attendanceRecords, { date, status }];
        
        // Calculate attendance percentage
        const presentDays = updatedRecords.filter(r => r.status === 'present').length;
        const attendancePercentage = Math.round((presentDays / updatedRecords.length) * 100);
        
        await updateDoc(userRef, {
          attendanceRecords: updatedRecords,
          'stats.attendancePercentage': attendancePercentage,
          lastActive: serverTimestamp()
        });
      }

      console.log('✅ Attendance marked successfully:', { userId, date, status });
      return attendanceRef.id;
    } catch (error) {
      console.error('❌ Error marking attendance:', error);
      throw error;
    }
  }

  // Update grades - builds grade records
  async updateGrade(userId: string, subject: string, marks: number, maxMarks: number) {
    try {
      const gradeRef = await addDoc(collection(db, 'grades'), {
        userId,
        subject,
        marks,
        maxMarks,
        semester: 'Current',
        examType: 'Assessment',
        recordedAt: serverTimestamp(),
        recordedBy: 'system'
      });

      // Update user's grade records and GPA
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const gradeRecords = userData.gradeRecords || [];
        
        // Update or add grade record
        const existingIndex = gradeRecords.findIndex((g: any) => g.name === subject);
        if (existingIndex >= 0) {
          gradeRecords[existingIndex] = { name: subject, marks, maxMarks };
        } else {
          gradeRecords.push({ name: subject, marks, maxMarks });
        }
        
        // Calculate GPA
        const totalPercentage = gradeRecords.reduce((sum: number, grade: any) => 
          sum + (grade.marks / grade.maxMarks) * 100, 0);
        const averagePercentage = totalPercentage / gradeRecords.length;
        const gpa = averagePercentage >= 90 ? 10 : Math.floor(averagePercentage / 10) + 1;
        
        await updateDoc(userRef, {
          gradeRecords,
          'stats.currentGPA': gpa,
          lastActive: serverTimestamp()
        });
      }

      console.log('✅ Grade updated successfully:', { userId, subject, marks, maxMarks });
      return gradeRef.id;
    } catch (error) {
      console.error('❌ Error updating grade:', error);
      throw error;
    }
  }

  // Add learning resource interaction
  async trackLearningProgress(userId: string, resourceId: string, progressData: {
    viewedAt?: Date;
    completionStatus?: 'started' | 'in_progress' | 'completed';
    timeSpent?: number;
  }) {
    try {
      const progressRef = doc(db, 'learningProgress', `${userId}_${resourceId}`);
      await setDoc(progressRef, {
        userId,
        resourceId,
        ...progressData,
        viewedAt: progressData.viewedAt || serverTimestamp(),
        lastUpdated: serverTimestamp()
      }, { merge: true });

      // Update user's learning progress
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        [`learningProgress.${resourceId}`]: progressData,
        lastActive: serverTimestamp()
      });

      console.log('✅ Learning progress tracked:', { userId, resourceId });
    } catch (error) {
      console.error('❌ Error tracking learning progress:', error);
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

      console.log('✅ Certificate issued with ID:', certificateRef.id);
      return certificateRef.id;
    } catch (error) {
      console.error('❌ Error issuing certificate:', error);
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
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
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

  // Get comprehensive user data for debugging
  async getUserCompleteData(userId: string) {
    try {
      console.log('🔍 Fetching complete user data for:', userId);
      
      // Get user profile
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.exists() ? userDoc.data() : null;
      
      // Get attendance records
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const attendanceRecords = attendanceSnapshot.docs.map(doc => doc.data());
      
      // Get assignment submissions
      const assignmentsQuery = query(collection(db, 'assignments'));
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      const assignments = [];
      
      for (const assignmentDoc of assignmentsSnapshot.docs) {
        const submissionDoc = await getDoc(doc(db, 'assignments', assignmentDoc.id, 'submissions', userId));
        if (submissionDoc.exists()) {
          assignments.push({
            assignment: { id: assignmentDoc.id, ...assignmentDoc.data() },
            submission: submissionDoc.data()
          });
        }
      }
      
      // Get grade records
      const gradesQuery = query(
        collection(db, 'grades'),
        where('userId', '==', userId)
      );
      const gradesSnapshot = await getDocs(gradesQuery);
      const grades = gradesSnapshot.docs.map(doc => doc.data());
      
      // Get certificates
      const certificatesQuery = query(
        collection(db, 'certificates'),
        where('userId', '==', userId)
      );
      const certificatesSnapshot = await getDocs(certificatesQuery);
      const certificates = certificatesSnapshot.docs.map(doc => doc.data());
      
      const completeData = {
        profile: userData,
        attendance: attendanceRecords,
        assignments,
        grades,
        certificates,
        summary: {
          totalAttendanceRecords: attendanceRecords.length,
          totalAssignments: assignments.length,
          totalGrades: grades.length,
          totalCertificates: certificates.length
        }
      };
      
      console.log('📊 Complete user data:', completeData);
      return completeData;
    } catch (error) {
      console.error('❌ Error fetching complete user data:', error);
      throw error;
    }
  }

  // Force refresh all user data
  async refreshUserData(userId: string) {
    try {
      console.log('🔄 Refreshing all user data for:', userId);
      
      // Re-initialize all user data
      await this.initializeAttendanceRecords(userId);
      await this.initializeAssignmentSubmissions(userId);
      await this.initializeGradeRecords(userId);
      
      console.log('✅ User data refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing user data:', error);
      throw error;
    }
  }
}

export const firebaseService = new FirebaseService();
