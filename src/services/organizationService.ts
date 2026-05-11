import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import type { OrganizationStructure } from "../types";

const COLLECTION_NAME = "organizationStructures";

// Fungsi mengambil SEMUA struktur organisasi (untuk halaman List)
export const getAllOrganizationStructures = async (): Promise<
  OrganizationStructure[]
> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);

    const structures: OrganizationStructure[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as OrganizationStructure[];

    return structures;
  } catch (error) {
    console.error("Error fetching organization structures:", error);
    throw error;
  }
};

// Fungsi mengambil struktur organisasi berdasarkan ID
export const getOrganizationStructureById = async (
  id: string
): Promise<OrganizationStructure | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as OrganizationStructure;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting organization structure:", error);
    throw error;
  }
};

// Fungsi mengambil struktur organisasi berdasarkan periode
export const getOrganizationStructureByPeriode = async (
  periode: string
): Promise<OrganizationStructure | null> => {
  try {
    const structures = await getAllOrganizationStructures();
    return structures.find((s) => s.periode === periode) || null;
  } catch (error) {
    console.error("Error getting organization structure by periode:", error);
    throw error;
  }
};

// Fungsi membuat struktur organisasi baru
export const createOrganizationStructure = async (
  structure: Omit<OrganizationStructure, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...structure,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating organization structure:", error);
    throw error;
  }
};

// Fungsi mengupdate struktur organisasi
export const updateOrganizationStructure = async (
  id: string,
  structure: Partial<OrganizationStructure>
): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...structure,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating organization structure:", error);
    throw error;
  }
};

// Fungsi menghapus struktur organisasi
export const deleteOrganizationStructure = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting organization structure:", error);
    throw error;
  }
};

// Default positions untuk inisialisasi
export const DEFAULT_POSITIONS = [
  "Ketua Umum",
];
