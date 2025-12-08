// src/types/index.ts
import { Timestamp } from "firebase/firestore";

export interface Article {
  id?: string;
  title: string;
  slug: string;
  thumbnail: string;
  content: string;
  excerpt: string;
  author: string;
  category: "Opini" | "Berita" | "Lainnya";
  tags: string[];
  status: "Draft" | "Published";
  createdAt: Timestamp;
}


// Tambahkan ke yang sudah ada
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: "admin" | "staff";
  position: string;
  photoURL?: string;
  createdAt: Timestamp; // Timestamp
}