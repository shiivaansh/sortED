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
import { firebaseService } from './firebaseService';

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

  // Get teacher's classes with real-time student count
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

  // Get students in a class with real-time updates
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
        parentContact: doc.data().parentContact || doc.data().profile?.parentContact,
        isActive: doc.data().isActive !== false
      })) as StudentInfo[];
    } catch (error) {
      console.error('❌ Error getting class students:', error);
      return [];
    }
  }

  // Real-time subscription to class students
  subscribeToClassStudents(classId: string, callback: (students: StudentInfo[]) => void) {
    return firebaseService.subscribeToClassStudents(classId, callback);
  }

  // Create assignment for a class with real-time updates
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
      return await firebaseService.createAssignmentForClass(assignmentData, teacherId);
    } catch (error) {
      console.error('❌ Error creating assignment:', error);
      throw error;
    }
  }

  // Get teacher's assignments with real-time updates
  async getTeacherAssignments(teacherId: string) {
    try {
      const assignmentsQuery = query(
        collection(db, 'assignments'),
        where('teacherId', '==', teacherId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(assignmentsQuery);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate(),
          dueDate: data.dueDate,
          stats: {
            totalSubmissions: data.stats?.totalSubmissions || 0,
            averageGrade: data.stats?.averageGrade || 0,
            submissionRate: data.stats?.submissionRate || 0,
            totalStudents: data.stats?.totalStudents || 0
          }
        };
      });
    } catch (error) {
      console.error('❌ Error getting teacher assignments:', error);
      return [];
    }
  }

  // Get assignment submissions with real-time updates
  async getAssignmentSubmissions(assignmentId: string) {
    try {
      const submissionsQuery = query(
        collection(db, 'assignments', assignmentId, 'submissions'),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(submissionsQuery);
      const submissions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      
      // Get student details for each submission
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
      
      return enrichedSubmissions;
    } catch (error) {
      console.error('❌ Error getting assignment submissions:', error);
      return [];
    }
  }

  // Real-time subscription to assignment submissions
  subscribeToAssignmentSubmissions(assignmentId: string, callback: (submissions: any[]) => void) {
    return firebaseService.subscribeToAssignmentSubmissions(assignmentId, callback);
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

  // Mark attendance for entire class with real-time updates
  async markClassAttendance(classId: string, date: string, attendanceData: Array<{
    studentId: string;
    status: 'present' | 'absent' | 'late';
  }>) {
    try {
      await firebaseService.markClassAttendance(classId, date, attendanceData);
      console.log(`✅ Attendance marked for ${attendanceData.length} students`);
    } catch (error) {
      console.error('❌ Error marking class attendance:', error);
      throw error;
    }
  }

  // Get attendance for a class and date with real-time updates
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

  // Real-time subscription to class attendance
  subscribeToClassAttendance(classId: string, date: string, callback: (attendance: any[]) => void) {
    return firebaseService.subscribeToClassAttendance(classId, date, callback);
  }

  // Update student marks with real-time updates
  async updateStudentMarks(classId: string, subject: string, marksData: Array<{
    studentId: string;
    marks: number;
    maxMarks: number;
    examType: string;
  }>) {
    try {
      await firebaseService.updateStudentMarks(classId, subject, marksData);
      console.log(`✅ Marks updated for ${marksData.length} students`);
    } catch (error) {
      console.error('❌ Error updating student marks:', error);
      throw error;
    }
  }

  // Get all students across all classes (for teacher dashboard)
  async getAllStudents(): Promise<StudentInfo[]> {
    try {
      const studentsQuery = query(
        collection(db, 'users'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(studentsQuery);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          email: data.email,
          studentId: data.studentId,
          class: data.profile?.grade ? `Grade ${data.profile.grade}-${data.profile.section}` : 'Not Assigned',
          rollNumber: data.rollNumber || 'N/A',
          avatar: data.avatar,
          parentContact: data.parentContact || data.profile?.parentContact,
          isActive: data.isActive !== false
        };
      }) as StudentInfo[];
    } catch (error) {
      console.error('❌ Error getting all students:', error);
      return [];
    }
  }

  // Real-time subscription to all students
  subscribeToAllStudents(callback: (students: StudentInfo[]) => void) {
    return firebaseService.subscribeToAllStudents((students) => {
      const formattedStudents = students.map(student => ({
        id: student.id,
        name: student.name,
        email: student.email,
        studentId: student.studentId,
        class: student.profile?.grade ? `Grade ${student.profile.grade}-${student.profile.section}` : 'Not Assigned',
        rollNumber: student.rollNumber || 'N/A',
        avatar: student.avatar,
        parentContact: student.parentContact || student.profile?.parentContact,
        isActive: student.isActive !== false
      }));
      callback(formattedStudents);
    });
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

  // Check if faculty collection exists and seed if needed
  async checkAndSeedFacultyData() {
    try {
      const facultySnapshot = await getDocs(collection(db, 'faculty'));
      
      if (facultySnapshot.empty) {
        console.log('🌱 No faculty data found, seeding initial teacher accounts...');
        await this.seedTeacherData();
        return true;
      } else {
        console.log('✅ Faculty collection exists with', facultySnapshot.size, 'teachers');
        return false;
      }
    } catch (error) {
      console.error('❌ Error checking faculty data:', error);
      return false;
    }
  }

  // Seed initial teacher data
  async seedTeacherData() {
    try {
      const teachers = [
        {
          id: 'demo-teacher-001',
          name: 'Dr. Sarah Johnson',
          email: 'teacher@demo.com',
          employeeId: 'EMP001',
          department: 'Mathematics',
          subjects: ['Mathematics', 'Statistics'],
          experience: 8,
          qualifications: ['PhD Mathematics', 'M.Sc Statistics']
        },
        {
          id: 'teacher-demo-2',
          name: 'Prof. Michael Chen',
          email: 'michael.chen@demo.com',
          employeeId: 'EMP002',
          department: 'Science',
          subjects: ['Physics', 'Chemistry'],
          experience: 12,
          qualifications: ['PhD Physics', 'M.Sc Chemistry']
        },
        {
          id: 'teacher-demo-3',
          name: 'Ms. Emily Rodriguez',
          email: 'emily.rodriguez@demo.com',
          employeeId: 'EMP003',
          department: 'Languages',
          subjects: ['English', 'Literature'],
          experience: 6,
          qualifications: ['MA English Literature', 'B.Ed']
        }
      ];

      const classes = [
        {
          id: 'class-12a-math',
          name: 'Class 12-A Mathematics',
          subject: 'Mathematics',
          grade: '12',
          section: 'A',
          teacherId: 'demo-teacher-001',
          students: [], // Will be populated when students join
          schedule: [
            { day: 'Monday', startTime: '09:00', endTime: '10:00' },
            { day: 'Wednesday', startTime: '10:00', endTime: '11:00' },
            { day: 'Friday', startTime: '11:00', endTime: '12:00' }
          ],
          isActive: true
        },
        {
          id: 'class-12b-physics',
          name: 'Class 12-B Physics',
          subject: 'Physics',
          grade: '12',
          section: 'B',
          teacherId: 'teacher-demo-2',
          students: [],
          schedule: [
            { day: 'Tuesday', startTime: '09:00', endTime: '10:00' },
            { day: 'Thursday', startTime: '10:00', endTime: '11:00' }
          ],
          isActive: true
        },
        {
          id: 'class-11a-english',
          name: 'Class 11-A English',
          subject: 'English',
          grade: '11',
          section: 'A',
          teacherId: 'teacher-demo-3',
          students: [],
          schedule: [
            { day: 'Monday', startTime: '14:00', endTime: '15:00' },
            { day: 'Friday', startTime: '14:00', endTime: '15:00' }
          ],
          isActive: true
        }
      ];

      const batch = writeBatch(db);

      // Create teacher profiles
      for (const teacher of teachers) {
        const teacherRef = doc(db, 'faculty', teacher.id);
        batch.set(teacherRef, {
          name: teacher.name,
          email: teacher.email,
          employeeId: teacher.employeeId,
          department: teacher.department,
          subjects: teacher.subjects,
          classes: classes.filter(c => c.teacherId === teacher.id).map(c => c.id),
          qualifications: teacher.qualifications,
          experience: teacher.experience,
          joinedAt: serverTimestamp(),
          isActive: true,
          permissions: {
            canCreateAssignments: true,
            canGradeAssignments: true,
            canMarkAttendance: true,
            canViewReports: true,
            canManageClasses: true
          }
        });
      }

      // Create classes
      for (const classData of classes) {
        const classRef = doc(db, 'classes', classData.id);
        batch.set(classRef, {
          ...classData,
          createdAt: serverTimestamp()
        });
      }

      await batch.commit();
      console.log('✅ Teacher and class data seeded successfully');
      
      return teachers;
    } catch (error) {
      console.error('❌ Error seeding teacher data:', error);
      throw error;
    }
  }

  // Create demo teacher account for testing
  async createDemoTeacherAccount() {
    try {
      // This will create the faculty record for the demo teacher
      const demoTeacher = {
        name: 'Demo Teacher',
        email: 'teacher@demo.com',
        employeeId: 'DEMO001',
        department: 'General',
        subjects: ['Mathematics', 'Science']
      };

      // Use a fixed ID for the demo teacher
      const demoTeacherId = 'demo-teacher-001';
      
      await this.initializeTeacherProfile(demoTeacherId, demoTeacher);
      
      console.log('✅ Demo teacher account created with ID:', demoTeacherId);
      console.log('🔑 Use this email to test: teacher@demo.com');
      
      return demoTeacherId;
    } catch (error) {
      console.error('❌ Error creating demo teacher account:', error);
      throw error;
    }
  }
}

export const teacherService = new TeacherService();