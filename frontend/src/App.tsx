import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import VentureBuilder from "./pages/VentureBuilder";
import AiTools from "./pages/AiTools";
import Search from "./pages/Search";
import Admin from "./pages/Admin";
import Sessions from "./pages/Sessions";
import TwoFactor from "./pages/TwoFactor";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import LoadingScreen from "./components/LoadingScreen";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppContent() {
  const { user, isLoading, loadSession } = useAuthStore();

  useEffect(() => { loadSession(); }, []);

  if (isLoading) return <LoadingScreen />;

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={user ? <Layout /> : <Landing />}>
          {user && (
            <>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="ventures" element={<VentureBuilder />} />
              <Route path="ai" element={<AiTools />} />
              <Route path="search" element={<Search />} />
              <Route path="sessions" element={<Sessions />} />
              <Route path="2fa" element={<ProtectedRoute roles={["admin"]}><TwoFactor /></ProtectedRoute>} />
              <Route path="admin" element={<ProtectedRoute roles={["admin"]}><Admin /></ProtectedRoute>} />
            </>
          )}
        </Route>
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
