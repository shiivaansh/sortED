import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  AuthError
} from 'firebase/auth';
import { auth } from '../utils/firebase';
import { firebaseService } from '../services/firebaseService';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name: string) => Promise<User>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const register = async (email: string, password: string, name: string): Promise<User> => {
    try {
      console.log('🔐 Starting user registration process...');
      console.log('Email:', email);
      
      // Check if Firebase is properly initialized
      if (!auth) {
        throw new Error('Firebase authentication is not initialized. Please refresh the page and try again.');
      }
      
      // Check if user already exists in Firestore
      const existingUser = await firebaseService.getUserByEmail(email);
      if (existingUser) {
        throw new Error('This email is already registered. Please try logging in instead.');
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase Auth account created successfully');
      
      try {
        await updateProfile(userCredential.user, { displayName: name });
        console.log('✅ User profile updated with display name');
      } catch (profileError) {
        console.error('⚠️ Error updating profile:', profileError);
        // Continue despite profile update error
      }
      
      // Initialize user profile in Firestore
      try {
        await firebaseService.initializeUserProfile(userCredential.user.uid, {
          name,
          email,
          studentId: `STU-${Date.now()}`
        });
        console.log('✅ User profile initialized in Firestore');
      } catch (firestoreError) {
        console.error('⚠️ Error initializing Firestore profile:', firestoreError);
        // We'll still return success since the auth account was created
      }
      
      return userCredential.user;
    } catch (error) {
      console.error('❌ Registration failed:', error);
      const authError = error as AuthError;
      
      // Handle specific Firebase errors
      if (authError.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered. Please try logging in instead.');
      } else if (authError.code === 'auth/weak-password') {
        throw new Error('Password is too weak. Please use at least 6 characters.');
      } else if (authError.code === 'auth/invalid-email') {
        throw new Error('Invalid email address format.');
      } else if (authError.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (authError.code === 'auth/too-many-requests') {
        throw new Error('Too many requests. Please wait a moment and try again.');
      } else if (authError.message?.includes('visibility-check-was-unavailable')) {
        throw new Error('Connection issue with Firebase. Please check your internet connection and try again.');
      } else {
        throw new Error(authError.message || 'Registration failed. Please try again.');
      }
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    try {
      console.log('🔐 Starting login process...');
      console.log('Email:', email);
      
      // Check if Firebase is properly initialized
      if (!auth) {
        throw new Error('Firebase authentication is not initialized. Please refresh the page and try again.');
      }
      
      // First check if user exists in Firestore
      const existingUser = await firebaseService.getUserByEmail(email);
      if (!existingUser) {
        console.log('⚠️ No user found in Firestore with this email, but will try auth anyway');
      } else {
        console.log('✅ User found in Firestore:', existingUser.name);
      }
      
      // Try to sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Login successful with Firebase Auth');
      
      // If user exists in Auth but not in Firestore, initialize their profile
      if (userCredential.user && !existingUser) {
        console.log('⚠️ User exists in Auth but not in Firestore, initializing profile...');
        await firebaseService.initializeUserProfile(userCredential.user.uid, {
          name: userCredential.user.displayName || 'Student',
          email: userCredential.user.email || email,
          studentId: `STU-${Date.now()}`
        });
      }
      
      return userCredential.user;
    } catch (error) {
      console.error('❌ Login failed:', error);
      const authError = error as AuthError;
      
      // Handle specific Firebase errors
      if (authError.code === 'auth/user-not-found') {
        throw new Error('No account found with this email address.');
      } else if (authError.code === 'auth/wrong-password') {
        throw new Error('Incorrect password. Please try again.');
      } else if (authError.code === 'auth/invalid-email') {
        throw new Error('Invalid email address format.');
      } else if (authError.code === 'auth/invalid-credential') {
        throw new Error('Invalid email or password. Please check your credentials.');
      } else if (authError.code === 'auth/too-many-requests') {
        throw new Error('Too many failed login attempts. Please try again later.');
      } else if (authError.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (authError.message?.includes('visibility-check-was-unavailable')) {
        throw new Error('Connection issue with Firebase. Please check your internet connection and try again.');
      } else {
        throw new Error(authError.message || 'Login failed. Please try again.');
      }
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (!auth) {
        throw new Error('Firebase authentication is not initialized.');
      }
      
      await signOut(auth);
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      throw error;
    }
  };

  useEffect(() => {
    console.log('🔄 Setting up auth state listener...');
    
    if (!auth) {
      console.error('❌ Firebase auth not initialized');
      setLoading(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔄 Auth state changed:', user ? `User: ${user.email}` : 'No user');
      
      setCurrentUser(user);
      
      // If user exists but no profile in Firestore, initialize it
      if (user) {
        try {
          await firebaseService.initializeUserProfile(user.uid, {
            name: user.displayName || 'Student',
            email: user.email || '',
            studentId: `STU-${Date.now()}`
          });
        } catch (error) {
          console.error('⚠️ Error initializing user profile:', error);
        }
      }
      
      setLoading(false);
    }, (error) => {
      console.error('❌ Auth state change error:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};