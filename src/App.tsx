import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/Layout';
import Chat from './pages/Chat';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Report from './pages/Report';
import Resources from './pages/Resources';
import { getAuth } from './utils/storage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const auth = getAuth();
  if (!auth) {
    return <Navigate to="/login" replace />;
  }
  return <AppLayout>{children}</AppLayout>;
}

function PublicLoginRoute() {
  if (getAuth()) {
    return <Navigate to="/home" replace />;
  }
  return <Login />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicLoginRoute />} />
      <Route
        path="/"
        element={<Navigate to="/home" replace />}
      />
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/report"
        element={
          <ProtectedRoute>
            <Report />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resources"
        element={
          <ProtectedRoute>
            <Resources />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
