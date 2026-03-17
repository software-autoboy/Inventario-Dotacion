import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Articles from './pages/Articles';
import Employees from './pages/Employees';
import Movimientos from './pages/Movimientos';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? (
    <div className="flex bg-slate-50 min-h-screen">
      <Navbar />
      <main className="ml-72 flex-1 p-8">
        {children}
      </main>
    </div>
  ) : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/articulos" element={<ProtectedRoute><Articles /></ProtectedRoute>} />
          <Route path="/empleados" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
          <Route path="/movimientos" element={<ProtectedRoute><Movimientos /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
