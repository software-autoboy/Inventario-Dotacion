import React, { useState } from 'react';
import { API_URL } from '../apiConfig';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Package, AlertTriangle } from 'lucide-react';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token);
        navigate('/');
      } else {
        setError(data.message || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-white to-sky-100 flex items-center justify-center p-6 overflow-hidden relative">
      <div className="absolute top-20 -left-20 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="bg-white/70 backdrop-blur-2xl p-10 md:p-14 rounded-[3rem] shadow-2xl w-full max-w-lg border border-white/50 relative z-10 transition-all">
        <div className="flex flex-col items-center mb-10">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-5 rounded-3xl text-white shadow-xl shadow-blue-200 mb-6 rotate-3 hover:rotate-0 transition-transform duration-500">
            <Package size={42} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter text-center uppercase">
            Inventario <span className="text-blue-600">Dotación</span>
          </h1>
          <p className="text-slate-500 font-medium mt-2">Acceso administrativo seguro</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Usuario</label>
            <input 
              type="text" 
              className="w-full px-6 py-4 bg-white border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 shadow-sm transition-all placeholder:text-slate-300"
              placeholder="Ingrese su usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Contraseña</label>
            <input 
              type="password" 
              className="w-full px-6 py-4 bg-white border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 shadow-sm transition-all placeholder:text-slate-300"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="bg-rose-50 text-rose-500 p-4 rounded-2xl text-sm font-bold flex items-center space-x-2 animate-bounce">
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}
          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-1 transition-all active:scale-95"
          >
            Iniciar Sesión
          </button>
        </form>

        <div className="mt-8 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2 text-center">Credenciales de Acceso</p>
          <div className="flex justify-around text-sm font-bold text-slate-600">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 uppercase">Usuario</span>
              <span>admin</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 uppercase">Contraseña</span>
              <span>admin123</span>
            </div>
          </div>
        </div>
        
        <div className="mt-10 text-center">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
            v1.2.0 • Sistema de Gestión de Dotaciones
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
