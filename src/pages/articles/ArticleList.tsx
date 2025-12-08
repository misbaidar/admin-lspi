import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  format, 
  subDays, 
  subWeeks, 
  subMonths, 
  subYears, 
  isAfter, 
} from "date-fns"; 
import { useAuth } from "../../context/AuthContext";
import { id as indonesia } from "date-fns/locale";
import { Plus, Search, Edit, Trash2, FileText, Filter, X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { TagInput } from "../../components/ui/TagInput";
import { getArticles, deleteArticle } from "../../services/articleService";
import type { Article } from "../../types";
import { useAlert } from "../../context/AlertContext";

const ArticleList = () => {
  const { userProfile, isAdmin } = useAuth();
  const { showAlert, showConfirm } = useAlert();
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // --- STATE FILTER ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTopics, setFilterTopics] = useState<string[]>([]); 
  const [filterDateRange, setFilterDateRange] = useState("all"); 

  // State untuk memastikan default value hanya diset sekali
  const [hasSetDefault, setHasSetDefault] = useState(false);

  // LOGIC BARU: Default Search = Display Name (Jika bukan Admin)
  useEffect(() => {
    // Jalankan jika: User ada, Bukan Admin, dan belum pernah diset otomatis
    if (userProfile?.displayName && !isAdmin && !hasSetDefault) {
      setSearchTerm(userProfile.displayName);
      setHasSetDefault(true); // Tandai sudah diset agar user bisa menghapusnya nanti jika mau
    }
  }, [userProfile, isAdmin, hasSetDefault]);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getArticles();
        setArticles(data);
      } catch (error) {
        console.error("Gagal memuat artikel");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handle Delete
  const handleDelete = async (id: string, title: string) => {
    showConfirm(
      "Hapus Artikel",
      `Apakah Anda yakin ingin menghapus artikel "${title}"?`,
      async () => {
        setIsDeleting(id);
        try {
          await deleteArticle(id);
          setArticles((prev) => prev.filter((a) => a.id !== id));
          showAlert("Terhapus", "Artikel berhasil dihapus.", "success");
        } catch (error) {
          showAlert("Gagal", "Gagal menghapus artikel.", "error");
        } finally {
          setIsDeleting(null);
        }
      }
    );
  };

  // --- LOGIKA FILTERING ---
  const filteredArticles = articles.filter((article) => {
    // A. Filter Search (Judul ATAU Penulis)
    const term = searchTerm.toLowerCase();
    const matchSearch = 
      article.title.toLowerCase().includes(term) || 
      (article.author || "").toLowerCase().includes(term);
    
    // B. Filter Kategori
    const matchCategory = filterCategory ? article.category === filterCategory : true;

    // C. Filter Status
    const matchStatus = filterStatus ? article.status === filterStatus : true;

    // D. Filter Tanggal
    let matchDate = true;
    if (filterDateRange !== "all" && article.createdAt) {
      const articleDate = article.createdAt.toDate();
      const now = new Date();
      let cutoffDate = new Date();

      switch (filterDateRange) {
        case "1d": cutoffDate = subDays(now, 1); break;
        case "1w": cutoffDate = subWeeks(now, 1); break;
        case "1m": cutoffDate = subMonths(now, 1); break;
        case "6m": cutoffDate = subMonths(now, 6); break;
        case "1y": cutoffDate = subYears(now, 1); break;
        default: cutoffDate = new Date(0);
      }
      matchDate = isAfter(articleDate, cutoffDate);
    }

    // E. Filter Topik
    const matchTopic = filterTopics.length > 0
      ? article.tags?.some((articleTag) => 
          filterTopics.includes(articleTag.toLowerCase())
        )
      : true;

    return matchSearch && matchCategory && matchStatus && matchDate && matchTopic;
  });

  const resetFilters = () => {
    setSearchTerm("");
    setFilterCategory("");
    setFilterStatus("");
    setFilterDateRange("all");
    setFilterTopics([]); 
  };

  const hasActiveFilters = searchTerm || filterCategory || filterStatus || filterDateRange !== "all" || filterTopics.length > 0;

  return (
    <div className="space-y-6 pb-20">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Artikel</h1>
          <p className="text-gray-500 text-sm">Kelola konten publikasi LSPI.</p>
        </div>
        <Link to="/articles/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tulis Artikel
          </Button>
        </Link>
      </div>

      {/* 2. AREA FILTER */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-700 font-semibold mb-2">
          <Filter className="w-4 h-4" />
          Filter Data
          {hasActiveFilters && (
            <button 
              onClick={resetFilters} 
              className="ml-auto text-xs text-red-500 hover:underline flex items-center"
            >
              <X className="w-3 h-3 mr-1" /> Reset Filter
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
          {/* A. Search Judul & Penulis */}
          <div className="relative lg:col-span-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Cari Judul atau Penulis..." 
              className="pl-9" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* B. Filter Topik */}
          <div className="lg:col-span-1">
            <TagInput 
              value={filterTopics}
              onChange={setFilterTopics}
              placeholder="Filter Tags..." 
            />
          </div>

          {/* C. Filter Kategori */}
          <select 
            className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-brand-main/20 outline-none bg-white"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">Semua Kategori</option>
            <option value="Opini">Opini</option>
            <option value="Berita">Berita</option>
            <option value="Lainnya">Lainnya</option>
          </select>

          {/* D. Filter Status */}
          <select 
            className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-brand-main/20 outline-none bg-white"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="Published">Terbit</option>
            <option value="Draft">Draft</option>
          </select>

          {/* E. Filter Tanggal */}
          <select 
            className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-brand-main/20 outline-none bg-white"
            value={filterDateRange}
            onChange={(e) => setFilterDateRange(e.target.value)}
          >
            <option value="all">Semua Waktu</option>
            <option value="1d">24 Jam Terakhir</option>
            <option value="1w">1 Minggu Terakhir</option>
            <option value="1m">1 Bulan Terakhir</option>
            <option value="6m">6 Bulan Terakhir</option>
            <option value="1y">1 Tahun Terakhir</option>
          </select>
        </div>
      </div>

      {/* 3. TABLE CONTENT */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="relative bg-white p-12 rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
             <motion.div 
                 className="h-full bg-brand-main"
                 initial={{ x: "-100%" }}
                 animate={{ x: "100%" }}
                 transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
             />
             </div>
             <div className="flex flex-col items-center justify-center space-y-3">
             <p className="text-gray-400 font-medium">Memuat data artikel...</p>
             </div>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <FileText className="h-10 w-10 text-gray-300 mb-3" />
            <h3 className="text-gray-900 font-medium">Data tidak ditemukan</h3>
            <p className="text-gray-500 text-sm">Coba ubah kata kunci atau filter pencarian Anda.</p>
            {hasActiveFilters && (
               <Button variant="outline" size="sm" onClick={resetFilters} className="mt-4">
                 Hapus Semua Filter
               </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 w-[300px]">Judul</th>
                  <th className="px-6 py-3">Kategori</th>
                  <th className="px-6 py-3 w-[200px]">Topik</th> 
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Tanggal</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredArticles.map((article) => {
                  const canEdit = isAdmin || article.author === userProfile?.displayName;
                return (
                  <tr key={article.id} className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <div className="flex items-center gap-3">
                        {article.thumbnail ? (
                          <img src={article.thumbnail} alt="" className="w-8 h-8 rounded object-cover border" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                            <FileText className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                            <span className="line-clamp-2" title={article.title}>{article.title}</span>
                            <span className="text-xs text-gray-400 font-normal mt-0.5 block">Oleh: {article.author}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                        {article.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {article.tags && article.tags.length > 0 ? (
                          <>
                            {article.tags.slice(0, 2).map((tag, idx) => (
                              <span key={idx} className="bg-blue-50 text-brand-main px-2 py-0.5 rounded text-[10px] border border-blue-100">
                                {tag}
                              </span>
                            ))}
                            {article.tags.length > 2 && (
                              <span className="text-[10px] text-gray-400 px-1">+{article.tags.length - 2}</span>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs italic">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        article.status === 'Published' 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${article.status === 'Published' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                        {article.status === 'Published' ? 'Terbit' : 'Draf'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {article.createdAt?.seconds 
                        ? format(article.createdAt.toDate(), 'dd MMM yyyy', { locale: indonesia })
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canEdit && (
                          <Link to={`/articles/edit/${article.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                            <Edit className="w-4 h-4" />
                          </Link>
                        )}
                        {canEdit && (
                            <button 
                            onClick={() => handleDelete(article.id!, article.title)}
                            disabled={isDeleting === article.id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                          >
                            {isDeleting === article.id ? (
                              <span className="block w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                          )}
                        {!canEdit && <span className="text-gray-300 text-xs italic">Read Only</span>}
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticleList;