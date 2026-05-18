import { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Loader from './components/ui/Loader';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateTicket from './pages/CreateTicket';
import TicketDetails from './pages/TicketDetails';
import Analytics from './pages/Analytics';
import KnowledgeBase from './pages/KnowledgeBase';
import Users from './pages/Users';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" />;
  return children;
}

export default function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <Loader />;

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

      {/* Protected */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/tickets/new" element={<ProtectedRoute roles={['customer','admin']}><CreateTicket /></ProtectedRoute>} />
      <Route path="/tickets/:id" element={<ProtectedRoute><TicketDetails /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute roles={['admin']}><Analytics /></ProtectedRoute>} />
      <Route path="/knowledge-base" element={<ProtectedRoute><KnowledgeBase /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute roles={['admin']}><Users /></ProtectedRoute>} />

      {/* Default */}
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
    </Routes>
  );
}
