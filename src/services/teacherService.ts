import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
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

export interface TeacherProfile {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  department: string;
  subjects: string[];
  classes: string[];
  phone?: string;
  avatar?: string;
  bio?: string;
  qualifications: string[];
  experience: number;
  joinedAt: Date;
  lastLogin?: Date;
  isActive: boolean;
  permissions: {
    canCreateAssignments: boolean;
    canGradeAssignments: boolean;
    canMarkAttendance: boolean;
    canViewReports: boolean;
    canManageClasses: boolean;
  };
}

export interface ClassInfo {
  id: string;
  name: string;
  subject: string;
  grade: string;
  section: string;
  students: string[];
  teacherId: string;
  schedule: Array<{
    day: string;
    startTime: string;
    endTime: string;
  }>;
  isActive: boolean;
}

export interface StudentInfo {
  id: string;
  name: string;
  email: string;
  studentId: string;
  class: string;
  rollNumber: string;
  avatar?: string;
  parentContact?: string;
  isActive: boolean;
}

class TeacherService {
  // Initialize teacher profile
  async initializeTeacherProfile(userId: string, teacherData: {
    name: string;
    email: string;
    employeeId: string;
    department: string;
    subjects: string[];
  }) {
    try {
      const teacherRef = doc(db, 'faculty', userId);
      const teacherDoc = await getDoc(teacherRef);
      
      if (!teacherDoc.exists()) {
        const profileData: Omit<TeacherProfile, 'id'> = {
          ...teacherData,
          classes: [],
          qualifications: [],
          experience: 0,
          joinedAt: new Date(),
          isActive: true,
          permissions: {
            canCreateAssignments: true,
            canGradeAssignments: true,
            canMarkAttendance: true,
            canViewReports: true,
            canManageClasses: true
          }
        };
        
        await setDoc(teacherRef, {
          ...profileData,
          joinedAt: serverTimestamp(),
          createdAt: serverTimestamp()
        });
        
        console.log('✅ Teacher profile initialized:', userId);
        return { id: userId, ...profileData };
      } else {
        return { id: userId, ...teacherDoc.data() } as TeacherProfile;
      }
    } catch (error) {
      console.error('❌ Error initializing teacher profile:', error);
      throw error;
    }
  }

  // Get teacher profile
  async getTeacherProfile(userId: string): Promise<TeacherProfile | null> {
    try {
      const teacherDoc = await getDoc(doc(db, 'faculty', userId));
      if (teacherDoc.exists()) {
        const data = teacherDoc.data();
        return {
          id: userId,
          ...data,
          joinedAt: data.joinedAt?.toDate() || new Date(),
          lastLogin: data.lastLogin?.toDate()
        } as TeacherProfile;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting teacher profile:', error);
      return null;
    }
  }

  // Update last login
  async updateLastLogin(userId: string) {
    try {
      await updateDoc(doc(db, 'faculty', userId), {
        lastLogin: serverTimestamp()
      });
    } catch (error) {
      console.error('❌ Error updating last login:', error);
    }
  }

  // Get teacher's classes
  async getTeacherClasses(teacherId: string): Promise<ClassInfo[]> {
    try {
      const classesQuery = query(
        collection(db, 'classes'),
        where('teacherId', '==', teacherId),
        where('isActive', '==', true)
      );
      
      const snapshot = await getDocs(classesQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ClassInfo[];
    } catch (error) {
      console.error('❌ Error getting teacher classes:', error);
      return [];
    }
  }

  // Get students in a class
  async getClassStudents(classId: string): Promise<StudentInfo[]> {
    try {
      const classDoc = await getDoc(doc(db, 'classes', classId));
      if (!classDoc.exists()) return [];
      
      const classData = classDoc.data();
      const studentIds = classData.students || [];
      
      if (studentIds.length === 0) return [];
      
      const studentsQuery = query(
        collection(db, 'users'),
        where('__name__', 'in', studentIds)
      );
      
      const snapshot = await getDocs(studentsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        email: doc.data().email,
        studentId: doc.data().studentId,
        class: classData.name,
        rollNumber: doc.data().rollNumber || `R${Math.floor(Math.random() * 100)}`,
        avatar: doc.data().avatar,
        parentContact: doc.data().parentContact,
        isActive: true
      })) as StudentInfo[];
    } catch (error) {
      console.error('❌ Error getting class students:', error);
      return [];
    }
  }

  // Mark attendance for a class
  async markClassAttendance(classId: string, date: string, attendanceData: Array<{
    studentId: string;
    status: 'present' | 'absent' | 'late';
  }>) {
    try {
      const batch = writeBatch(db);
      
      // Create attendance records for each student
      attendanceData.forEach(({ studentId, status }) => {
        const attendanceRef = doc(collection(db, 'attendance'));
        batch.set(attendanceRef, {
          studentId,
          classId,
          date,
          status,
          markedAt: serverTimestamp(),
          markedBy: 'teacher'
        });
      });
      
      await batch.commit();
      console.log('✅ Class attendance marked successfully');
    } catch (error) {
      console.error('❌ Error marking class attendance:', error);
      throw error;
    }
  }

  // Get attendance for a class and date
  async getClassAttendance(classId: string, date: string) {
    try {
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('classId', '==', classId),
        where('date', '==', date)
      );
      
      const snapshot = await getDocs(attendanceQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('❌ Error getting class attendance:', error);
      return [];
    }
  }

  // Create assignment
  async createAssignment(assignmentData: {
    title: string;
    description: string;
    classId: string;
    subject: string;
    dueDate: string;
    maxMarks: number;
    instructions?: string;
    attachments?: string[];
  }, teacherId: string) {
    try {
      const assignmentRef = await addDoc(collection(db, 'assignments'), {
        ...assignmentData,
        teacherId,
        createdAt: serverTimestamp(),
        isActive: true,
        submissions: [],
        stats: {
          totalSubmissions: 0,
          averageGrade: 0,
          submissionRate: 0
        }
      });
      
      console.log('✅ Assignment created:', assignmentRef.id);
      return assignmentRef.id;
    } catch (error) {
      console.error('❌ Error creating assignment:', error);
      throw error;
    }
  }

  // Get teacher's assignments
  async getTeacherAssignments(teacherId: string) {
    try {
      const assignmentsQuery = query(
        collection(db, 'assignments'),
        where('teacherId', '==', teacherId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(assignmentsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        dueDate: doc.data().dueDate
      }));
    } catch (error) {
      console.error('❌ Error getting teacher assignments:', error);
      return [];
    }
  }

  // Get assignment submissions
  async getAssignmentSubmissions(assignmentId: string) {
    try {
      const submissionsQuery = query(
        collection(db, 'assignments', assignmentId, 'submissions'),
        orderBy('submittedAt', 'desc')
      );
      
      const snapshot = await getDocs(submissionsQuery);
      const submissions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate()
      }));
      
      // Get student details for each submission
      const enrichedSubmissions = await Promise.all(
        submissions.map(async (submission) => {
          const studentDoc = await getDoc(doc(db, 'users', submission.userId));
          const studentData = studentDoc.exists() ? studentDoc.data() : {};
          
          return {
            ...submission,
            studentName: studentData.name || 'Unknown Student',
            studentId: studentData.studentId || 'N/A'
          };
        })
      );
      
      return enrichedSubmissions;
    } catch (error) {
      console.error('❌ Error getting assignment submissions:', error);
      return [];
    }
  }

  // Grade assignment submission
  async gradeSubmission(assignmentId: string, submissionId: string, gradeData: {
    grade: number;
    feedback: string;
  }) {
    try {
      const submissionRef = doc(db, 'assignments', assignmentId, 'submissions', submissionId);
      await updateDoc(submissionRef, {
        ...gradeData,
        gradedAt: serverTimestamp(),
        status: 'graded'
      });
      
      console.log('✅ Submission graded successfully');
    } catch (error) {
      console.error('❌ Error grading submission:', error);
      throw error;
    }
  }

  // Update student marks
  async updateStudentMarks(classId: string, subject: string, marksData: Array<{
    studentId: string;
    marks: number;
    maxMarks: number;
    examType: string;
  }>) {
    try {
      const batch = writeBatch(db);
      
      marksData.forEach(({ studentId, marks, maxMarks, examType }) => {
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
      });
      
      await batch.commit();
      console.log('✅ Student marks updated successfully');
    } catch (error) {
      console.error('❌ Error updating student marks:', error);
      throw error;
    }
  }

  // Get student performance data for AI reports
  async getStudentPerformanceData(studentId: string) {
    try {
      // Get attendance records
      const attendanceQuery = query(
        collection(db, 'attendance'),
        where('studentId', '==', studentId),
        orderBy('date', 'desc')
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const attendance = attendanceSnapshot.docs.map(doc => doc.data());
      
      // Get grade records
      const gradesQuery = query(
        collection(db, 'grades'),
        where('studentId', '==', studentId),
        orderBy('recordedAt', 'desc')
      );
      const gradesSnapshot = await getDocs(gradesQuery);
      const grades = gradesSnapshot.docs.map(doc => doc.data());
      
      // Get assignment submissions
      const assignmentsQuery = query(collection(db, 'assignments'));
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      const assignments = [];
      
      for (const assignmentDoc of assignmentsSnapshot.docs) {
        const submissionDoc = await getDoc(
          doc(db, 'assignments', assignmentDoc.id, 'submissions', studentId)
        );
        if (submissionDoc.exists()) {
          assignments.push({
            assignment: { id: assignmentDoc.id, ...assignmentDoc.data() },
            submission: submissionDoc.data()
          });
        }
      }
      
      return {
        attendance,
        grades,
        assignments,
        summary: {
          attendanceRate: attendance.length > 0 
            ? (attendance.filter(a => a.status === 'present').length / attendance.length) * 100 
            : 0,
          averageGrade: grades.length > 0 
            ? grades.reduce((sum, g) => sum + (g.marks / g.maxMarks) * 100, 0) / grades.length 
            : 0,
          assignmentSubmissionRate: assignments.length > 0 
            ? (assignments.filter(a => a.submission.status === 'submitted').length / assignments.length) * 100 
            : 0
        }
      };
    } catch (error) {
      console.error('❌ Error getting student performance data:', error);
      return null;
    }
  }

  // Real-time listeners
  subscribeToClassAttendance(classId: string, date: string, callback: (attendance: any[]) => void) {
    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('classId', '==', classId),
      where('date', '==', date)
    );
    
    return onSnapshot(attendanceQuery, (snapshot) => {
      const attendance = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(attendance);
    });
  }

  subscribeToAssignmentSubmissions(assignmentId: string, callback: (submissions: any[]) => void) {
    const submissionsQuery = query(
      collection(db, 'assignments', assignmentId, 'submissions'),
      orderBy('submittedAt', 'desc')
    );
    
    return onSnapshot(submissionsQuery, async (snapshot) => {
      const submissions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate()
      }));
      
      // Enrich with student data
      const enrichedSubmissions = await Promise.all(
        submissions.map(async (submission) => {
          const studentDoc = await getDoc(doc(db, 'users', submission.userId));
          const studentData = studentDoc.exists() ? studentDoc.data() : {};
          
          return {
            ...submission,
            studentName: studentData.name || 'Unknown Student',
            studentId: studentData.studentId || 'N/A'
          };
        })
      );
      
      callback(enrichedSubmissions);
    });
  }

  // Seed initial teacher data
  async seedTeacherData() {
    try {
      const teachers = [
        {
          id: 'teacher1',
          name: 'Dr. Sarah Johnson',
          email: 'sarah.johnson@school.edu',
          employeeId: 'EMP001',
          department: 'Mathematics',
          subjects: ['Mathematics', 'Statistics']
        },
        {
          id: 'teacher2',
          name: 'Prof. Michael Chen',
          email: 'michael.chen@school.edu',
          employeeId: 'EMP002',
          department: 'Science',
          subjects: ['Physics', 'Chemistry']
        },
        {
          id: 'teacher3',
          name: 'Ms. Emily Rodriguez',
          email: 'emily.rodriguez@school.edu',
          employeeId: 'EMP003',
          department: 'Languages',
          subjects: ['English', 'Literature']
        }
      ];

      const classes = [
        {
          id: 'class-12a',
          name: 'Class 12-A',
          subject: 'Mathematics',
          grade: '12',
          section: 'A',
          teacherId: 'teacher1',
          students: ['student1', 'student2', 'student3'],
          schedule: [
            { day: 'Monday', startTime: '09:00', endTime: '10:00' },
            { day: 'Wednesday', startTime: '10:00', endTime: '11:00' },
            { day: 'Friday', startTime: '11:00', endTime: '12:00' }
          ],
          isActive: true
        },
        {
          id: 'class-12b',
          name: 'Class 12-B',
          subject: 'Physics',
          grade: '12',
          section: 'B',
          teacherId: 'teacher2',
          students: ['student4', 'student5', 'student6'],
          schedule: [
            { day: 'Tuesday', startTime: '09:00', endTime: '10:00' },
            { day: 'Thursday', startTime: '10:00', endTime: '11:00' }
          ],
          isActive: true
        }
      ];

      // Create teacher profiles
      for (const teacher of teachers) {
        await this.initializeTeacherProfile(teacher.id, teacher);
      }

      // Create classes
      for (const classData of classes) {
        await setDoc(doc(db, 'classes', classData.id), {
          ...classData,
          createdAt: serverTimestamp()
        });
      }

      console.log('✅ Teacher data seeded successfully');
    } catch (error) {
      console.error('❌ Error seeding teacher data:', error);
    }
  }
}

export const teacherService = new TeacherService();