import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { firebaseService } from '../services/firebaseService';

// Custom hook to automatically initialize user profile in Firestore
export const useFirebaseAuth = () => {
  const { currentUser } = useAuth();

  useEffect(() => {
    const initializeUser = async () => {
      if (currentUser) {
        try {
          await firebaseService.initializeUserProfile(currentUser.uid, {
            name: currentUser.displayName || 'Student',
            email: currentUser.email || '',
            studentId: `STU-${Date.now()}`
          });
        } catch (error) {
          console.error('Error initializing user profile:', error);
        }
      }
    };

    initializeUser();
  }, [currentUser]);

  return { currentUser };
};