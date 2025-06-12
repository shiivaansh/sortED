import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth } from '../utils/firebase';
import { firebaseService } from '../services/firebaseService';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
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

  const register = async (email: string, password: string, name: string) => {
    try {
      console.log('Starting user registration process...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Firebase Auth account created successfully');
      
      try {
        await updateProfile(userCredential.user, { displayName: name });
        console.log('User profile updated with display name');
      } catch (profileError) {
        console.error('Error updating profile:', profileError);
        // Continue despite profile update error
      }
      
      // Initialize user profile in Firestore
      try {
        await firebaseService.initializeUserProfile(userCredential.user.uid, {
          name,
          email,
          studentId: `STU-${Date.now()}`
        });
        console.log('User profile initialized in Firestore');
      } catch (firestoreError) {
        console.error('Error initializing Firestore profile:', firestoreError);
        // We'll still return success since the auth account was created
      }
      
      return userCredential.user;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
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
          console.error('Error initializing user profile:', error);
        }
      }
      
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