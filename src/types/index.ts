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

// Struktur Organisasi Types
export interface OrganisasiMember {
  id: string;
  nama: string;
  email?: string;
  phone?: string;
  foto?: string;
  bio?: string;
  mulai_tanggal?: Timestamp;
  selesai_tanggal?: Timestamp;
}

export interface Posisi {
  id: string;
  nama_posisi: string;
  order: number;
  anggota: OrganisasiMember[];
}

export interface Sektor {
  id: string;
  nama_sektor: "Rijal" | "Nisa";
  posisi: Posisi[];
}

export interface OrganizationStructure {
  id?: string;
  periode: string;
  sektors: Sektor[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}