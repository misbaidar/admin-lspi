import React, { useState, useEffect } from "react";
import { updatePassword, signOut } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { User, Lock, LogOut, Save, AlertCircle } from "lucide-react";

import { auth, db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { useAlert } from "../context/AlertContext";

const Settings = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useAlert();
  
  // State Form Profile
  const [displayName, setDisplayName] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");
  const [position, setPosition] = useState(""); // Jabatan sekarang bisa diedit
  
  // State Photo
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // State Password & Loading
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Load Data
  useEffect(() => {
    if (user && userProfile) {
      setDisplayName(user.displayName || userProfile.displayName || "");
      setCurrentEmail(user.email || "");
      setPosition(userProfile.position || "Anggota");
      setPhotoPreview(user.photoURL || userProfile.photoURL || null);
    }
  }, [user, userProfile]);

  // --- UTILITY: CONVERT IMAGE TO BASE64 & RESIZE ---
  const processImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 300; 
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          resolve(dataUrl);
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // --- HANDLE IMAGE DROP/CHANGE ---
  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showAlert("Format Salah", "Mohon upload file gambar (JPG/PNG).", "error");
      return;
    }
    try {
      const resizedBase64 = await processImage(file);
      setPhotoPreview(resizedBase64);
      setPhotoBase64(resizedBase64);
    } catch (error) {
      showAlert("Gagal", "Gagal memproses gambar.", "error");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // --- 1. UPDATE PROFILE LOGIC ---
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdatingProfile(true);
    try {
      const finalPhotoURL = photoBase64 || userProfile?.photoURL || "";

      // Firestore Update
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        // displayName: displayName, // ❌ Tidak perlu update nama karena input dikunci
        position: position,       // ✅ Update Jabatan Baru
        photoURL: finalPhotoURL   // ✅ Update Foto Baru
      });

      showAlert("Berhasil", "Profil diperbarui. Halaman akan dimuat ulang...", "success");
      
      setTimeout(() => {
        window.location.reload();
      }, 1500); 

    } catch (error) {
      console.error(error);
      showAlert("Gagal", "Terjadi kesalahan saat menyimpan data.", "error");
    } finally {
      setTimeout(() => setIsUpdatingProfile(false), 2000);
    }
  };

  // --- 2. UPDATE PASSWORD LOGIC ---
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword.length < 6) {
      showAlert("Password Lemah", "Password minimal 6 karakter.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert("Validasi Gagal", "Konfirmasi password tidak cocok.", "error");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await updatePassword(user, newPassword);
      showAlert("Berhasil", "Password telah diubah. Silakan login kembali.", "success");
      await signOut(auth);
      navigate("/login");
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        showAlert("Sesi Kadaluarsa", "Demi keamanan, mohon Logout dan Login ulang sebelum mengganti password.", "error");
      } else {
        showAlert("Gagal", "Gagal mengganti password.", "error");
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // --- 3. LOGOUT LOGIC ---
  const handleLogout = () => {
    showConfirm(
      "Konfirmasi Keluar", 
      "Apakah Anda yakin ingin mengakhiri sesi ini?", 
      async () => {
        try {
          await signOut(auth);
          navigate("/login");
        } catch (error) {
          showAlert("Error", "Gagal melakukan logout", "error");
        }
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan Akun</h1>
        <p className="text-gray-500 text-sm">Kelola profil pribadi dan keamanan akun Anda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* --- KARTU 1: PROFIL PRIBADI --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
          <div className="flex items-center gap-2 mb-6 text-gray-800 font-semibold border-b pb-2">
            <User className="w-5 h-5 text-brand-main" />
            <h3>Informasi Profil</h3>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            
            {/* AREA UPLOAD FOTO */}
            <div className="space-y-2">
               <Label>Foto Profil</Label>
               
               <div 
                 className={`
                    relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer
                    ${isDragOver ? 'border-brand-main bg-brand-main/5' : 'border-gray-300 hover:border-brand-main hover:bg-gray-50'}
                 `}
                 onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                 onDragLeave={() => setIsDragOver(false)}
                 onDrop={handleDrop}
               >
                 <input 
                    type="file" 
                    id="photo-upload" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    accept="image/*"
                    onChange={handleImageChange}
                 />

                 <div className="relative mb-3 group">
                   <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow-md">
                     {photoPreview ? (
                       <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-gray-400">
                         <User className="w-10 h-10" />
                       </div>
                     )}
                   </div>
                 </div>

                 <div className="space-y-1">
                   <p className="text-sm font-medium text-gray-700">
                     <span className="text-brand-main">Klik upload</span> atau drag & drop
                   </p>
                   <p className="text-xs text-gray-500">
                     Format JPG, PNG  (Max 300px)
                   </p>
                 </div>
               </div>
            </div>

            {/* INPUT FIELDS */}
            <div className="space-y-4">
                {/* 1. EMAIL (LOCKED) */}
                <div>
                  <Label>Email (Tidak dapat diubah)</Label>
                  <Input value={currentEmail} disabled className="bg-gray-100 text-gray-500 cursor-not-allowed" />
                </div>

                {/* 2. NAMA (LOCKED - ID) */}
                <div>
                  <Label>Nama Lengkap (Terkunci)</Label>
                  <Input 
                      value={displayName} 
                      disabled // 👈 KUNCI NAMA
                      className="bg-gray-100 text-gray-500 cursor-not-allowed font-medium"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    *Nama terhubung dengan riwayat artikel dan tidak dapat diubah sendiri.
                  </p>
                </div>

                {/* 3. JABATAN (EDITABLE) */}
                <div>
                  <Label>Jabatan / Posisi</Label>
                  <Input 
                      value={position} 
                      onChange={(e) => setPosition(e.target.value)} // 👈 BISA DIEDIT
                      placeholder="Contoh: Staff Penulis"
                  />
                </div>
            </div>

            <div className="pt-2">
              <Button type="submit" isLoading={isUpdatingProfile} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </div>

        {/* --- KARTU 2: KEAMANAN --- */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-6 text-gray-800 font-semibold border-b pb-2">
              <Lock className="w-5 h-5 text-brand-main" />
              <h3>Ganti Password</h3>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="bg-yellow-50 p-3 rounded-md flex gap-2 text-xs text-yellow-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>Jika gagal, coba logout dan login kembali.</p>
              </div>

              <div>
                <Label>Password Baru</Label>
                <Input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 karakter"
                />
              </div>

              <div>
                <Label>Konfirmasi Password</Label>
                <Input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" variant="outline" isLoading={isUpdatingPassword} className="w-full">
                  Update Password
                </Button>
              </div>
            </form>
          </div>

          <div className="bg-red-50 p-6 rounded-xl border border-red-100">
             <div className="flex items-center justify-between">
                <div>
                   <h3 className="font-bold text-red-700">Keluar Sesi</h3>
                   <p className="text-xs text-red-600 mt-1">Akhiri sesi di perangkat ini.</p>
                </div>
                <Button variant="danger" onClick={handleLogout}>
                   <LogOut className="w-4 h-4 mr-2" /> Logout
                </Button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;