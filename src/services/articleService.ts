// src/services/articleService.ts
import { 
  collection, 
  getDocs, 
  addDoc,
  query, 
  orderBy,
  serverTimestamp,
  doc,           
  getDoc,        
  updateDoc,
  deleteDoc    
} from "firebase/firestore";
import { db } from "../firebase/config";
import type { Article } from "../types";
import { syncTagsToDatabase } from "./tagService";

const COLLECTION_NAME = "articles";

// Fungsi mengambil SEMUA artikel (untuk halaman List)
export const getArticles = async (): Promise<Article[]> => {
  try {
    // Query: Ambil koleksi 'articles', urutkan berdasarkan tanggal dibuat (terbaru di atas)
    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    
    // Mapping data dari format Firestore ke format aplikasi kita
    const articles: Article[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Article[];

    return articles;
  } catch (error) {
    console.error("Error fetching articles:", error);
    throw error;
  }
};

// Kita gunakan Omit karena 'id' dan 'createdAt' akan diurus otomatis oleh Firebase
export const createArticle = async (article: Omit<Article, "id" | "createdAt">) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...article,
      createdAt: serverTimestamp(), // Waktu server saat ini
    });
    if (article.tags && article.tags.length > 0) {
      await syncTagsToDatabase(article.tags);
    }
    return docRef.id;
  } catch (error) {
    console.error("Error creating article:", error);
    throw error;
  }
};

// 👇 HELPER: Generate Slug (Judul Artikel -> judul-artikel)
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Hapus karakter aneh
    .trim()
    .replace(/\s+/g, "-") // Spasi jadi strip
    .replace(/-+/g, "-"); // Hapus strip ganda
};

export const getArticleById = async (id: string): Promise<Article | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Article;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting article:", error);
    throw error;
  }
};

export const updateArticle = async (id: string, article: Partial<Article>) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    // Kita update data, tapi biarkan createdAt apa adanya
    await updateDoc(docRef, {
      ...article,
      // Opsional: Anda bisa menambah field 'updatedAt: serverTimestamp()' jika mau
    });
    if (article.tags && article.tags.length > 0) {
      await syncTagsToDatabase(article.tags);
    }
  } catch (error) {
    console.error("Error updating article:", error);
    throw error;
  }
};

export const deleteArticle = async (id: string) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting article:", error);
    throw error;
  }
};

export const triggerPublicRebuild = async () => {
  const hookUrl = import.meta.env.VITE_VERCEL_DEPLOY_HOOK;
  
  if (!hookUrl) {
    console.warn("Deploy Hook URL not found.");
    return;
  }

  try {
    await fetch(hookUrl, { method: "POST" });
    console.log("Rebuild signal sent to Vercel.");
  } catch (error) {
    console.error("Failed to trigger rebuild:", error);
  }
};