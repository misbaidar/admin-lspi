// src/components/layout/Sidebar.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, FileText, Settings, ExternalLink, Users } from "lucide-react";
import { cn } from "../../lib/utils";
import LSPILogo from "../LSPILogo";
import { useAuth } from "../../context/AuthContext";

const Sidebar = () => {
  const { isAdmin } = useAuth();

  const navLinks = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Artikel", path: "/articles", icon: FileText },
    ...(isAdmin ? [{ name: "Pengguna", path: "/users", icon: Users }] : []),
    { name: "Pengaturan", path: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-brand-dark text-white flex flex-col h-screen fixed left-0 top-0 border-r border-brand-main shadow-xl z-20">
      
      {/* 1. Logo Area */}
      <div className="flex h-20 items-center px-8 border-b border-brand-main bg-brand-dark">
        <LSPILogo className="h-12 w-auto fill-white" />
      </div>

      {/* 2. Navigation Menu */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {navLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) => cn(
              "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group",
              isActive 
                ? "bg-brand-main text-brand-accent shadow-md" 
                : "text-gray-300 hover:bg-brand-main/50 hover:text-white"
            )}
          >
            <link.icon className="mr-3 h-5 w-5" />
            {link.name}
          </NavLink>
        ))}
      </nav>

      {/* 3. Footer Sidebar (Link ke Web Publik & Logout) */}
      <div className="p-4 border-t border-brand-main bg-brand-dark">
        {/* Link ke Web Publik */}
        <a 
          href="https://lspi-uin.web.app" // Ganti nanti dengan URL asli production
          target="_blank"
          rel="noreferrer"
          className="flex items-center px-4 py-2 text-xs text-gray-400 hover:text-white transition-colors"
        >
          <ExternalLink className="mr-2 h-3 w-3" />
          Buka Website Publik
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;