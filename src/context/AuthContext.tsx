import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth"; 
import { auth } from "../firebase/config";
import { getUserProfile } from "../services/userService"; // Import baru
import type { UserProfile } from "../types"; // Import tipe

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null; // Data tambahan (jabatan dll)
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  userProfile: null, 
  loading: true, 
  isAdmin: false 
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // 1. Pastikan data user tercatat di DB
        // await syncUserProfile(currentUser);
        
        // 2. Ambil data profil lengkap
        const profile = await getUserProfile(currentUser.uid);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isAdmin = userProfile?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, isAdmin }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};