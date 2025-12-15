import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile // Import ini untuk update nama di Auth
} from "firebase/auth";
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { LogIn, UserPlus } from "lucide-react";
import { useAlert } from "../context/AlertContext"; // 1. Import Hook Alert
import favicon from '../assets/favicon.svg';

const Login = () => {
  const navigate = useNavigate();
  const { showAlert } = useAlert(); // 2. Gunakan Hook
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // --- LOGIC 1: LOGIN ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // showAlert tidak perlu di sini karena langsung redirect, 
      // tapi jika mau sapaan selamat datang bisa ditambahkan sebelum navigate
      window.location.href = "/"; 
    } catch (error: any) {
      console.error(error);
      // Ganti Alert Biasa
      showAlert("Gagal Login", "Email atau password salah. Silakan coba lagi.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // --- LOGIC 2: REGISTER (WHITELIST SYSTEM) ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const cleanEmail = email.trim();
    
    // Validasi Format Email Sederhana
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      showAlert("Format Salah", "Mohon masukkan alamat email yang valid.", "error");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      showAlert("Password Lemah", "Password minimal 6 karakter.", "error");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      showAlert("Validasi Gagal", "Konfirmasi password tidak cocok!", "error");
      setIsLoading(false);
      return;
    }

    let userCredential;

    try {
      // 1. CREATE AUTH USER FIRST (So we have a UID and token)
      userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      // 2. NOW CHECK FIRESTORE (Authenticated)
      // Find the document that matches this email (the whitelist entry created by admin)
      const q = query(collection(db, "users"), where("email", "==", cleanEmail));
      const querySnapshot = await getDocs(q);

      // If NOT in whitelist
      if (querySnapshot.empty) {
        // ROLLBACK: Delete the auth user we just created because they aren't allowed.
        await user.delete(); 
        showAlert("Akses Ditolak", "Email Anda belum didaftarkan oleh Admin.", "error");
        setIsLoading(false);
        return;
      }

      // 3. WHITELIST FOUND - PROCEED MIGRATION
      // Since query might return the NEW doc we are about to create (if retrying), 
      // we need to find the OLD doc (where ID != user.uid).
      // However, usually the old doc has a random ID from addDoc.
      
      const preDataDoc = querySnapshot.docs.find(d => d.id !== user.uid);
      
      // If we only found the current user doc (already migrated), just login
      if (!preDataDoc) {
          showAlert("Info", "Akun ini sudah aktif. Mengalihkan...", "success");
          navigate("/");
          return;
      }

      const preData = preDataDoc.data();

      // Update Auth Profile Name
      if (preData.displayName) {
        await updateProfile(user, {
            displayName: preData.displayName
        });
      }

      // 4. CREATE NEW PROFILE DOC (Using UID as Key)
      const newProfileData = {
        ...preData,
        uid: user.uid,
        email: cleanEmail,
        photoURL: "",
        createdAt: new Date().toISOString()
      };

      // Write to Firestore (Allowed by rules because keys match uid)
      await setDoc(doc(db, "users", user.uid), newProfileData);

      // 5. DELETE OLD WHITELIST DOC
      // Allowed by rules because resource.data.email == request.auth.token.email
      await deleteDoc(doc(db, "users", preDataDoc.id));

      showAlert("Registrasi Berhasil", "Akun Anda telah aktif.", "success");
      window.location.href = "/";

    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        showAlert("Email Terdaftar", "Email ini sudah aktif. Silakan Login.", "info");
      }  else if (error.code === 'auth/invalid-email') {
        // Tangkap error spesifik ini
        showAlert("Email Tidak Valid", "Format email tidak diterima oleh sistem.", "error");
      } else if (error.code === 'auth/weak-password') {
        showAlert("Password Lemah", "Password terlalu lemah (min 6 karakter).", "error");
      } else {
        showAlert("Error Sistem", error.message, "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl border border-gray-200">
        
        {/* Header Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16">
            <img src={favicon} alt="LSPI Logo" className="w-16 h-16"/>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel LSPI</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isRegistering ? "Aktivasi Akun Staff" : "Masuk ke Dashboard"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-5">

          <div>
            <Label>Email Terdaftar</Label>
            <Input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="nama@lspi.com"
              required
            />
          </div>

          <div>
            <Label>Password</Label>
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="******"
              required
              minLength={6}
            />
            {/* Pesan Bantuan / Error Real-time */}
            {password.length > 0 && password.length < 6 && isRegistering && (
               <p className="text-[10px] text-red-500 mt-1">
                 Kurang {6 - password.length} karakter lagi.
               </p>
            )}
            {/* Pesan default saat kosong */}
            {password.length === 0 && isRegistering && (
               <p className="text-[10px] text-gray-400 mt-1">
                 Minimal 6 karakter.
               </p>
            )}
          </div>

          {isRegistering && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <Label>Konfirmasi Password</Label>
              <Input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="Ulangi password"
                required
                className={password && confirmPassword && password !== confirmPassword ? "border-red-500 focus:ring-red-500" : ""}
              />
              {/* Pesan error kecil jika tidak cocok saat mengetik */}
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-[10px] text-red-500 mt-1">Password tidak cocok.</p>
              )}
            </div>
          )}

          <Button className="w-full" size="lg" isLoading={isLoading}>
            {isRegistering ? (
              <><UserPlus className="w-4 h-4 mr-2" /> Aktifkan Akun</>
            ) : (
              <><LogIn className="w-4 h-4 mr-2" /> Masuk</>
            )}
          </Button>

        </form>

        {/* Toggle Login/Register */}
        <div className="mt-6 text-center pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            {isRegistering ? "Sudah punya akun aktif?" : "Baru ditambahkan Admin?"}
          </p>
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-brand-main font-semibold text-sm hover:underline mt-1"
          >
            {isRegistering ? "Login di sini" : "Aktivasi / Daftar di sini"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Login;