// src/pages/DashboardHome.tsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FileText, Plus, Users, PenTool, CheckCircle, Loader2, Trophy } from "lucide-react";
import { format } from "date-fns";
import { id as indonesia } from "date-fns/locale";

import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext"; // Import Auth
import { getArticles } from "../services/articleService";
import { getAllUsers } from "../services/userService"; // Import User Service
import type { Article } from "../types";
import { motion } from "framer-motion";

const DashboardHome = () => {
  const navigate = useNavigate();
  const { userProfile, isAdmin } = useAuth(); // Ambil data user
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Ambil Artikel
        const articlesData = await getArticles();
        setArticles(articlesData);

        // 2. Ambil Total User (Hanya jika Admin)
        if (isAdmin) {
          const usersData = await getAllUsers();
          setUserCount(usersData.length);
        }
      } catch (err) {
        console.error("Gagal memuat data dashboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  // --- HITUNG STATISTIK ---
  
  // Statistik Global (Untuk Admin & Umum)
  const totalArticles = articles.length;
  const publishedCount = articles.filter(a => a.status === 'Published').length;
  
  // Statistik Personal (Untuk Staff)
  const myArticles = articles.filter(a => a.author === userProfile?.displayName);
  const myDrafts = myArticles.filter(a => a.status === 'Draft').length;

  // Tentukan Artikel Terbaru mana yang ditampilkan
  // Jika Admin: Tampilkan Semua. Jika Staff: Tampilkan Punya Sendiri.
  const recentArticles = isAdmin 
    ? articles.slice(0, 5) 
    : myArticles.slice(0, 5);

  // --- AUTHOR LEADERBOARD (top authors by article count) ---
  const authorCountsMap = articles.reduce((acc: Record<string, number>, a) => {
    const name = (a.author || "").trim();
    if (!name) return acc;
    const lower = name.toLowerCase();
    // Ignore unknown / placeholder authors
    const blacklist = ["tanpa nama", "unknown", "-", "n/a", "anonymous", "null", "undefined"];
    if (blacklist.includes(lower)) return acc;
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
  
  const authorLeaderboard = Object.entries(authorCountsMap)
    .map(([author, count]) => ({ author, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // top 5
  

  return (
    <div className="space-y-8 pb-10">
      
      {/* 1. WELCOME BANNER */}
      <div className="bg-linear-to-r from-lspi-dark to-lspi-main rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        {/* Hiasan Background */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">
            Assalamualaikum, {userProfile?.displayName || "Anggota LSPI"}! 👋
          </h1>
          <p className="text-lspi-light-accent font-medium mb-6 opacity-90">
            {userProfile?.position || "Anggota"} {isAdmin && "• Administrator"}
          </p>
          
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => navigate("/articles/new")} className="text-lspi-dark bg-white hover:bg-gray-100 border-none">
              <Plus className="mr-2 h-4 w-4" />
              Tulis Artikel Baru
            </Button>
            {isAdmin && (
               <Button variant="outline" onClick={() => navigate("/users")} className="text-white border-white/30 hover:bg-white/10">
                 <Users className="mr-2 h-4 w-4" />
                 Kelola Anggota
               </Button>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-6">  
        {/* 2. STATS GRID */}
        <div className="grow grid grid-cols-2 gap-6">
          
          {/* Card 1: Statistik Utama (Beda Admin vs Staff) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">
                {isAdmin ? "Total Pengguna" : "Artikel Saya"}
              </h3>
              <div className={`p-2 rounded-lg ${isAdmin ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-brand-main'}`}>
                {isAdmin ? <Users className="h-5 w-5" /> : <PenTool className="h-5 w-5" />}
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {loading ? <Loader2 className="h-8 w-8 animate-spin text-brand-main" /> : (isAdmin ? userCount : myArticles.length)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {isAdmin ? "Anggota aktif" : "Total tulisan Anda"}
            </p>
          </div>

          {/* Card 2: Total Artikel (Global) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">Total Arsip</h3>
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{loading ? <Loader2 className="h-8 w-8 animate-spin text-brand-main" /> : totalArticles}</p>
            <p className="text-xs text-gray-400 mt-1">Semua artikel sistem</p>
          </div>

          {/* Card 3: Status Publikasi */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">Terbit</h3>
              <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{loading ? <Loader2 className="h-8 w-8 animate-spin text-brand-main" /> : publishedCount}</p>
            <p className="text-xs text-gray-400 mt-1">Siap dibaca publik</p>
          </div>

          {/* Card 4: Draft Pribadi (Untuk Reminder) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">Draft Saya</h3>
              <div className="p-2 bg-gray-100 text-gray-600 rounded-lg">
                <PenTool className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{loading ? <Loader2 className="h-8 w-8 animate-spin text-brand-main" /> : myDrafts}</p>
            <p className="text-xs text-gray-400 mt-1">Belum dipublikasi</p>
          </div>
        </div>
        {/* 2.5 AUTHOR LEADERBOARD */}
        <div className="grow bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">Top Penulis</h3>
            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
              <Trophy className="h-5 w-5" />
            </div>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-brand-main" />
            </div>
          ) : authorLeaderboard.length === 0 ? (
            <p className="text-sm text-gray-400">Belum ada penulis terdaftar.</p>
          ) : (
            <ul className="space-y-3">
              {authorLeaderboard.map((item, idx) => (
                <li key={item.author} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.author}</div>
                      <div className="text-xs text-gray-400">Artikel: {item.count}</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 font-semibold">{idx + 1}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
                 
      {/* 3. RECENT ACTIVITY TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
           <h3 className="font-semibold text-gray-800">
             {isAdmin ? "Artikel Terbaru" : "Tulisan Terbaru Anda"}
           </h3>
           <Link to="/articles" className="text-xs text-brand-main hover:underline font-medium">
              Lihat Semua &rarr;
           </Link>
        </div>

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
              <p className="text-gray-400 font-medium">Memuat data...</p>
              </div>
          </div>
        ) : recentArticles.length === 0 ? (
           <div className="p-10 text-center text-gray-400 flex flex-col items-center">
             <FileText className="w-10 h-10 mb-2 opacity-20" />
             <p>Belum ada artikel ditemukan.</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-white border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Judul</th>
                  {isAdmin && <th className="px-6 py-3">Penulis</th>}
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentArticles.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-900">
                      <div className="flex items-center gap-3">
                        {/* Thumbnail Kecil */}
                        <div className="w-8 h-8 rounded bg-gray-100 shrink-0 overflow-hidden">
                           {article.thumbnail && <img src={article.thumbnail} className="w-full h-full object-cover"/>}
                        </div>
                        <span className="truncate max-w-[200px] sm:max-w-xs">{article.title}</span>
                      </div>
                    </td>
                    
                    {isAdmin && (
                      <td className="px-6 py-3 text-gray-500">
                        {article.author}
                      </td>
                    )}

                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        article.status === 'Published' 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${article.status === 'Published' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                        {article.status === 'Published' ? 'Terbit' : 'Draf'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs">
                      {article.createdAt?.seconds 
                        ? format(article.createdAt.toDate(), 'dd MMM yyyy', { locale: indonesia }) 
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardHome;