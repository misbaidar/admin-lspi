// src/services/tagService.ts
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";

const TAGS_COLLECTION = "tags";

// Ambil semua tag yang tersedia untuk Autocomplete
export const getAllTags = async (): Promise<string[]> => {
  try {
    const snapshot = await getDocs(collection(db, TAGS_COLLECTION));
    // Kita asumsikan ID dokumen adalah nama tag-nya (agar unik)
    return snapshot.docs.map((doc) => doc.id);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return [];
  }
};

// Simpan tag baru ke database (dijalankan saat Save Artikel)
export const syncTagsToDatabase = async (tags: string[]) => {
  try {
    const promises = tags.map((tag) => {
      // Simpan tag sebagai ID dokumen (otomatis mencegah duplikat)
      const tagRef = doc(db, TAGS_COLLECTION, tag.toLowerCase()); 
      return setDoc(tagRef, { name: tag, usageCount: 1 }, { merge: true });
    });
    await Promise.all(promises);
  } catch (error) {
    console.error("Error syncing tags:", error);
  }
};