import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth"; // Tambah signOut
import type { User } from "firebase/auth"; 
import { auth } from "../firebase/config";
import { getUserProfile } from "../services/userService";
import type { UserProfile } from "../types";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
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
      
      if (currentUser) {
        // 1. Coba ambil data profil dulu
        const profile = await getUserProfile(currentUser.uid);

        // --- LOGIC BARU: CEK BLOKIR ---
        // Jika user login di Auth, tapi dokumennya sudah dihapus Admin di Firestore
        if (!profile) {
          console.warn("Akun Auth ada, tapi Data Firestore tidak ditemukan. Melakukan Logout paksa.");
          await signOut(auth); // Tendang user keluar
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }
        // ------------------------------

        // 2. Jika profil ada, baru set state
        // PENTING: Hapus syncUserProfile dari sini jika fungsinya membuat user baru otomatis.
        // Jika syncUserProfile hanya update "lastLogin", tidak apa-apa.
        // await syncUserProfile(currentUser); 
        
        setUser(currentUser);
        setUserProfile(profile);
      } else {
        setUser(null);
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