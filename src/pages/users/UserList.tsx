import React, { useEffect, useState } from "react";
import { 
  Search, Plus, Edit, Trash2, X, Save, Shield, ShieldAlert, 
  User,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { getAllUsers, deleteUser, saveUserProfile } from "../../services/userService";
import type { UserProfile } from "../../types";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Label } from "../../components/ui/Label";
import { motion } from "framer-motion";
import { useAlert } from "../../context/AlertContext"; // 1. Import useAlert

const UserList = () => {
  // --- STATE ---
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [currentUser, setCurrentUser] = useState<Partial<UserProfile>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // 2. Panggil Hook Alert
  const { showAlert, showConfirm } = useAlert();

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    const data = await getAllUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- HANDLERS ---

  // 1. Buka Modal Tambah
  const handleAdd = () => {
    setModalMode("create");
    setCurrentUser({
      role: "staff",
      position: "Anggota",
      displayName: "",
      email: ""
    });
    setIsModalOpen(true);
  };

  // 2. Buka Modal Edit
  const handleEdit = (user: UserProfile) => {
    setModalMode("edit");
    setCurrentUser({ ...user }); // Copy data user ke form
    setIsModalOpen(true);
  };

  // 3. Simpan Data (Create/Update) - DENGAN VALIDASI KETAT
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. SANITASI: Bersihkan spasi depan/belakang
    const cleanEmail = (currentUser.email || "").trim();
    const cleanName = (currentUser.displayName || "").trim();
    const cleanPosition = (currentUser.position || "").trim();

    // 2. VALIDASI REQUIRED
    if (!cleanEmail || !cleanName) {
      showAlert("Validasi Gagal", "Nama dan Email wajib diisi!", "error");
      return;
    }

    // 3. VALIDASI FORMAT EMAIL (Regex)
    // Hanya lakukan cek format jika ini User Baru (karena saat Edit, email disabled)
    if (modalMode === 'create') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        showAlert("Email Salah", "Format email tidak valid (contoh: nama@domain.com)", "error");
        return;
      }
    }

    setIsSaving(true);
    try {
      // Siapkan data bersih
      const dataToSave = {
        ...currentUser,
        email: cleanEmail,
        displayName: cleanName,
        position: cleanPosition
      };

      // Tentukan ID Dokumen
      // Jika create baru: Gunakan Clean Email sebagai ID
      // Jika edit: Gunakan UID lama
      const targetUid = modalMode === "edit" ? currentUser.uid! : cleanEmail;

      await saveUserProfile(targetUid, dataToSave);
      
      await fetchData(); 
      setIsModalOpen(false); 
      
      showAlert("Berhasil", "Data pengguna berhasil disimpan.", "success");
    } catch (error) {
      console.error(error);
      showAlert("Gagal", "Terjadi kesalahan saat menyimpan data.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Hapus User (Dengan Konfirmasi Baru)
  const handleDelete = (uid: string, name: string) => {
    showConfirm(
      "Hapus Pengguna Permanen",
      `Apakah Anda yakin ingin menghapus akses "${name}"? \n\nTindakan ini akan menghapus profil database dan mencabut akses login pengguna tersebut.`,
      async () => {
        // A. Nyalakan Loader
        setIsDeleting(true);
        
        try {
          // B. Proses Hapus di Firebase
          await deleteUser(uid);
          
          // C. Update UI (Hapus baris tabel)
          setUsers((prevUsers) => prevUsers.filter((u) => u.uid !== uid)); 
          
          // D. Tampilkan Alert Sukses
          showAlert("Terhapus", "Pengguna dan akses login telah dihapus.", "success");
        } catch (error) {
          console.error(error);
          showAlert("Gagal", "Gagal menghapus pengguna.", "error");
        } finally {
          // E. Matikan Loader
          setIsDeleting(false);
        }
      }
    );
  };

  // Filter Search
  const filteredUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- PAGINATION LOGIC ---
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-6 relative pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Pengguna</h1>
          <p className="text-gray-500 text-sm">Kelola data anggota, jabatan, dan hak akses.</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Anggota
        </Button>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Cari nama, email, atau jabatan..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* TABEL DATA */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
                  // State Loading
                  <div className="relative bg-white p-12 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      {/* Progress Bar Animation di bagian paling atas kontainer */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
                      <motion.div 
                          className="h-full bg-brand-main"
                          initial={{ x: "-100%" }}
                          animate={{ x: "100%" }}
                          transition={{ 
                          repeat: Infinity, 
                          duration: 1.5, 
                          ease: "linear" 
                          }}
                      />
                      </div>
        
                      {/* Konten Loading */}
                      <div className="flex flex-col items-center justify-center space-y-3">
                      <p className="text-gray-400 font-medium">Memuat data pengguna...</p>
                      </div>
                  </div>
                ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">Tidak ada pengguna ditemukan.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3">Nama Pengguna</th>
                    <th className="px-6 py-3">Jabatan</th>
                    <th className="px-6 py-3">Akses</th>
                    <th className="px-6 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr key={user.uid} className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      {/* Nama & Email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand-main/10 flex items-center justify-center text-brand-main font-bold shrink-0">
                            {user.photoURL ? (
                              <img 
                                  src={user.photoURL}
                                  alt={user.displayName}
                                  className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            user.displayName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.displayName}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Jabatan */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 border border-gray-200 font-medium text-xs">
                        {user.position}
                      </span>
                    </td>

                    {/* Role / Akses */}
                    <td className="px-6 py-4">
                      {user.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-brand-main bg-brand-main/10 px-2 py-1 rounded">
                          <Shield className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-brand-main bg-brand-main/10 px-2 py-1 rounded">
                          <User className="w-3 h-3" /> Staff
                        </span>
                      )}
                    </td>

                    {/* Tombol Aksi */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(user.uid, user.displayName)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION CONTROLS */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Menampilkan {startIndex + 1}–{Math.min(endIndex, filteredUsers.length)} dari {filteredUsers.length} pengguna
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-600 hover:bg-white rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      currentPage === page
                        ? "bg-brand-main text-white"
                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-600 hover:bg-white rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Halaman Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>)}
      </div>

      {/* --- MODAL FORM (CREATE / EDIT) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">
                {modalMode === 'create' ? "Tambah Anggota Baru" : "Edit Data Anggota"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              
              {/* Nama */}
              <div>
                <Label>Nama Lengkap</Label>
                <Input 
                  value={currentUser.displayName || ""}
                  onChange={(e) => setCurrentUser({...currentUser, displayName: e.target.value})}
                  placeholder="Tuliskan nama lengkap"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <Label>Email</Label>
                <Input 
                  type="email"
                  value={currentUser.email || ""}
                  onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
                  placeholder="email@lspi.com"
                  // Jika Edit, email sebaiknya read-only agar ID tidak berantakan
                  disabled={modalMode === 'edit'} 
                  className={modalMode === 'edit' ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}
                  required
                />
                {modalMode === 'create' && (
                  <p className="text-[10px] text-gray-400 mt-1">
                    *User harus mendaftar (Register) dengan email ini agar bisa login.
                  </p>
                )}
              </div>

              {/* Jabatan */}
              <div>
                <Label>Jabatan (Job Title)</Label>
                <Input 
                  value={currentUser.position || ""}
                  onChange={(e) => setCurrentUser({...currentUser, position: e.target.value})}
                  placeholder="Contoh: Kepala Divisi Riset"
                />
              </div>

              {/* Role Select */}
              <div>
                <Label>Hak Akses (Role)</Label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-main/20"
                  value={currentUser.role || "staff"}
                  onChange={(e) => setCurrentUser({...currentUser, role: e.target.value as "admin" | "staff"})}
                >
                  <option value="staff">Staff (Hanya Tulis Artikel)</option>
                  <option value="admin">Admin (Akses Penuh)</option>
                </select>
                {currentUser.role === 'admin' && (
                  <div className="flex items-start gap-2 mt-2 p-2 bg-yellow-50 text-yellow-700 rounded text-xs">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Hati-hati: Admin memiliki akses penuh untuk menghapus data dan user lain.</span>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" isLoading={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Data
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}
    {isDeleting && (
        <div className="fixed inset-0 z-1000 flex items-center justify-center bg-white/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center gap-3 border border-gray-100">
            <Loader2 className="w-8 h-8 text-lspi-main animate-spin" />
            <p className="text-sm font-semibold text-gray-700">Menghapus data...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;