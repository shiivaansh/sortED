import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Users, AlertCircle, Database } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../utils/firebase';
import { teacherService } from '../services/teacherService';

const TeacherLogin: React.FC = () => {
  const [email, setEmail] = useState('teacher@demo.com');
  const [password, setPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkFacultyData();
  }, []);

  const checkFacultyData = async () => {
    try {
      const needsSeeding = await teacherService.checkAndSeedFacultyData();
      if (needsSeeding) {
        setShowSetup(true);
      }
    } catch (error) {
      console.error('Error checking faculty data:', error);
    }
  };

  const setupDemoAccount = async () => {
    setIsSeeding(true);
    try {
      // First create the Firebase Auth account
      try {
        await createUserWithEmailAndPassword(auth, 'teacher@demo.com', 'demo123');
        console.log('✅ Demo teacher Firebase Auth account created');
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
          console.log('ℹ️ Demo teacher account already exists in Firebase Auth');
        } else {
          throw authError;
        }
      }

      // Create the faculty profile
      await teacherService.createDemoTeacherAccount();
      
      setShowSetup(false);
      setError('');
      alert('✅ Demo teacher account setup complete! You can now login with:\nEmail: teacher@demo.com\nPassword: demo123');
    } catch (error: any) {
      console.error('Error setting up demo account:', error);
      setError('Failed to setup demo account: ' + error.message);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if user is a teacher in Firestore
      const teacherProfile = await teacherService.getTeacherProfile(userCredential.user.uid);
      
      if (!teacherProfile) {
        // If no teacher profile exists, try to create one for demo purposes
        if (email === 'teacher@demo.com') {
          await teacherService.initializeTeacherProfile(userCredential.user.uid, {
            name: 'Demo Teacher',
            email: 'teacher@demo.com',
            employeeId: 'DEMO001',
            department: 'General',
            subjects: ['Mathematics', 'Science']
          });
          
          // Update last login and proceed
          await teacherService.updateLastLogin(userCredential.user.uid);
          navigate('/teacher-dashboard');
          return;
        } else {
          throw new Error('Access denied. Teacher account not found.');
        }
      }
      
      // Update last login
      await teacherService.updateLastLogin(userCredential.user.uid);
      
      navigate('/teacher-dashboard');
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else if (error.code === 'auth/invalid-credential') {
        setError('Invalid credentials. Please check your email and password.');
      } else {
        setError(error.message || 'Failed to log in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-3 rounded-full">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Teacher Portal</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Sign in to your teacher account</p>
        </div>

        {/* Setup Demo Account */}
        {showSetup && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-6">
            <div className="flex items-start space-x-3">
              <Database className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Setup Required
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                  No teacher accounts found. Click below to create a demo teacher account for testing.
                </p>
                <button
                  onClick={setupDemoAccount}
                  disabled={isSeeding}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Database className="w-4 h-4 mr-2" />
                  {isSeeding ? 'Setting up...' : 'Setup Demo Account'}
                </button>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm flex items-start">
                <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Demo Credentials Info */}
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
                🔑 Demo Credentials
              </h4>
              <div className="text-xs text-emerald-700 dark:text-emerald-300 space-y-1">
                <p><strong>Email:</strong> teacher@demo.com</p>
                <p><strong>Password:</strong> demo123</p>
                <p className="text-emerald-600 dark:text-emerald-400">
                  These credentials are pre-filled for easy testing.
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-emerald-600 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-emerald-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? 'Signing In...' : 'Sign In as Teacher'}
            </button>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Student?{' '}
                <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300">
                  Student Login
                </Link>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherLogin;