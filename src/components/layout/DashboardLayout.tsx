// src/components/layout/DashboardLayout.tsx
import { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext"; // Import Auth
import Sidebar from "./Sidebar"; // Pastikan Sidebar ada di folder yang sama

const DashboardLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { userProfile } = useAuth(); // Ambil Data User

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* 1. SIDEBAR (Mobile & Desktop) */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-lspi-dark text-white transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <Sidebar /> {/* Komponen Sidebar yang sudah Anda buat sebelumnya */}
        
        {/* Tombol Close di Mobile */}
        <button 
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 md:hidden text-gray-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* --- TOP NAVBAR --- */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 z-40">
          
          {/* Kiri: Toggle Sidebar & Breadcrumb Simpel */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-md md:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800 hidden sm:block">
              LSPI Admin Panel
            </h2>
          </div>

          {/* Kanan: User Profile & Notifikasi */}
          <div className="flex items-center gap-4">
            
            {/* User Dropdown / Info */}
            <Link to="/settings" className="group flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-gray-900 leading-none">
                  {userProfile?.displayName || "User"}
                </div>
                <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wide mt-1">
                  {userProfile?.position || "Anggota"}
                </div>
              </div>
              
              <div className="w-9 h-9 rounded-full bg-brand-main/10 text-brand-main flex items-center justify-center font-bold shadow-sm group-hover:ring-2 group-hover:ring-offset-2 group-hover:ring-brand-main transition-all">
                {userProfile?.photoURL ? (
                  <img 
                    src={userProfile.photoURL} 
                    alt={userProfile.displayName} 
                    className="w-9 h-9 rounded-full object-cover"/>
                  ) : (
                  userProfile?.displayName.charAt(0).toUpperCase()
                )}
              </div>
            </Link>
          </div>
        </header>

        {/* --- CONTENT OUTLET --- */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <Outlet />
        </main>

      </div>

      {/* Overlay Gelap untuk Mobile Sidebar */}
      {isSidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden glass"
        ></div>
      )}
    </div>
  );
};

export default DashboardLayout;