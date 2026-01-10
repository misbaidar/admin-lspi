// src/services/userService.ts
import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  collection, 
  getDocs,
  query,
  orderBy,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase/config";
import type { UserProfile } from "../types";
import { Timestamp } from "firebase/firestore";

// 1. Sinkronisasi User saat Login (Auto-create jika belum ada)
export const syncUserProfile = async (user: any) => {
  if (!user) return;
  
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // Default user baru = Staff & Anggota
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || "Tanpa Nama",
      role: "staff", 
      position: "Anggota", // Default Jabatan
      photoURL: user.photoURL || "",
      createdAt: Timestamp.now()
    };
    await setDoc(userRef, newProfile);
  }
};

// 2. Ambil Profil User Sendiri
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
};

// GET ALL (READ) - ordered by createdAt DESC
export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const q = query(collection(db, "users"), orderBy("updatedAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      // PENTING: Gabungkan data dengan ID dokumen agar UID tidak undefined
      return { 
        ...data, 
        uid: doc.id 
      } as UserProfile;
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

// CREATE / UPDATE
export const saveUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  try {
    if (!uid) throw new Error("UID is required for saving");
    
    const userRef = doc(db, "users", uid);
    
    // 1. Cek apakah dokumen sudah ada
    const userSnap = await getDoc(userRef);
    
    const finalData = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    // 2. Jika dokumen BELUM ada (data baru), tambahkan createdAt
    if (!userSnap.exists()) {
      (finalData as any).createdAt = serverTimestamp();
    }

    await setDoc(userRef, finalData, { merge: true });
    
  } catch (error) {
    console.error("Error saving user:", error);
    throw error;
  }
};

// DELETE - DIPERBAIKI (Tambah validasi safety)
export const deleteUser = async (uid: string) => {
  try {
    // Validasi: Jangan jalankan deleteDoc jika UID kosong/undefined
    if (!uid) {
      console.error("Delete failed: UID is undefined");
      return; 
    }
    
    await deleteDoc(doc(db, "users", uid));
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};