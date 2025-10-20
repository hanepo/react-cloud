import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  type User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { generateSecret, generateQRCodeURL, verifyTOTP } from '../utils/totp';
import type { User, UserRole } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string, role?: UserRole) => Promise<void>;
  signIn: (email: string, password: string, totpToken?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserRole: (uid: string, role: UserRole) => Promise<void>;
  setup2FA: () => Promise<{ secret: string; qrCodeUrl: string }>;
  verify2FA: (token: string) => Promise<void>;
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName || userData.displayName,
            role: userData.role || 'viewer',
            twoFactorEnabled: userData.twoFactorEnabled || false,
            twoFactorSecret: userData.twoFactorSecret,
            createdAt: userData.createdAt?.toDate() || new Date(),
            lastLogin: new Date(),
          });
          
          // Update last login
          await updateDoc(doc(db, 'users', firebaseUser.uid), {
            lastLogin: new Date(),
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, displayName: string, role: UserRole = 'viewer') => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName });
      
      const userData: Omit<User, 'uid'> = {
        email,
        displayName,
        role,
        twoFactorEnabled: false,
        createdAt: new Date(),
        lastLogin: new Date(),
      };
      
      await setDoc(doc(db, 'users', user.uid), userData);
      toast.success('Account created successfully!');
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
      throw error;
    }
  };

  const signIn = async (email: string, password: string, totpToken?: string) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if user has 2FA enabled
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      
      if (userData?.twoFactorEnabled) {
        if (!totpToken) {
          // Sign out the user and throw error to request 2FA
          await firebaseSignOut(auth);
          throw new Error('2FA code required');
        }
        
        // Verify the TOTP token
        const secret = userData.twoFactorSecret;
        const isValid = await verifyTOTP(totpToken.replace(/\s/g, ''), secret);
        
        if (!isValid) {
          await firebaseSignOut(auth);
          throw new Error('Invalid 2FA code');
        }
      }
      
      toast.success('Signed in successfully!');
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Don't show toast error for 2FA requirement - let the UI handle it
        if (error.message !== '2FA code required') {
          toast.error(error.message);
        }
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      toast.success('Signed out successfully!');
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
      throw error;
    }
  };

  const updateUserRole = async (uid: string, role: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', uid), { role });
      toast.success('User role updated successfully!');
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
      throw error;
    }
  };

  const setup2FA = async (): Promise<{ secret: string; qrCodeUrl: string }> => {
    if (!currentUser) throw new Error('User not authenticated');
    
    // Generate a browser-compatible secret
    const secret = generateSecret();
    
    const qrCodeUrl = generateQRCodeURL(
      currentUser.email,
      'SecureCloud',
      secret
    );
    
    // Store the secret temporarily - will be permanently saved after verification
    await updateDoc(doc(db, 'users', currentUser.uid), {
      twoFactorSecret: secret
    });
    
    return { secret, qrCodeUrl };
  };

  const verify2FA = async (token: string): Promise<void> => {
    if (!currentUser) throw new Error('User not authenticated');
    
    // Get the user's secret from Firestore
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    const userData = userDoc.data();
    const secret = userData?.twoFactorSecret;
    
    if (!secret) {
      throw new Error('2FA not set up');
    }
    
    // Verify the TOTP token using our browser-compatible function
    const isValid = await verifyTOTP(token.replace(/\s/g, ''), secret);
    
    if (!isValid) {
      throw new Error('Invalid 2FA code');
    }
    
    // Enable 2FA for the user
    await updateDoc(doc(db, 'users', currentUser.uid), {
      twoFactorEnabled: true
    });
    
    // Update local state
    setCurrentUser(prev => prev ? { ...prev, twoFactorEnabled: true } : null);
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    signUp,
    signIn,
    signOut,
    updateUserRole,
    setup2FA,
    verify2FA,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
