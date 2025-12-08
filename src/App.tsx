// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import DashboardLayout from "./components/layout/DashboardLayout"; // Import Layout
import DashboardHome from "./pages/DashboardHome"; // Import Halaman Home
import ArticleList from "./pages/articles/ArticleList";
import UserList from "./pages/users/UserList";
import Settings from "./pages/Settings";
import AdminRoute from "./components/auth/AdminRoute";
import { AlertProvider } from "./context/AlertContext";
import ArticleForm from "./pages/articles/ArticleForm";
// Komponen Pembungkus Protected
const ProtectedRoute = ({ children }: { children: React.JSX.Element }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="p-10 text-center">Loading...</div>; // Handling loading state
  if (!user) return <Navigate to="/login" replace />;
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <AlertProvider>
        <Router>
          <Routes>
            {/* 1. Halaman Login (Public) */}
            <Route path="/login" element={<Login />} />

            {/* 2. Dashboard Area (Protected) */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  {/* Semua rute di dalam sini akan memakai Sidebar & Header */}
                  <DashboardLayout /> 
                </ProtectedRoute>
              }
            >
              {/* Index Route: Saat user buka '/', tampilkan DashboardHome */}
              <Route index element={<DashboardHome />} />
              
              {/* Nanti kita tambah route artikel di sini */}
              <Route path="articles" element={<ArticleList />} />
              <Route path="articles/new" element={<ArticleForm />} />      
              <Route path="articles/edit/:id" element={<ArticleForm />} />
              <Route element={<AdminRoute />}>
                <Route path="users" element={<UserList />} />
              </Route>
              <Route path="settings" element={<Settings />} />
            </Route>

          </Routes>
        </Router>
      </AlertProvider>
    </AuthProvider>
  );
}

export default App;