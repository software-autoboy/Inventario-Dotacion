import React, { useEffect, useState } from 'react';
import { API_URL } from '../apiConfig';
import { useAuth } from '../AuthContext';
import { Package, Users, ClipboardList, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({ articles: 0, employees: 0, movements: 0, lowStock: 0 });
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      const headers = { Authorization: `Bearer ${token}` };
      const [artRes, empRes, movRes] = await Promise.all([
        fetch(`${API_URL}/articulos`, { headers }),
        fetch(`${API_URL}/empleados`, { headers }),
        fetch(`${API_URL}/movimientos`, { headers })
      ]);
      
      const articles = await artRes.json();
      const employees = await empRes.json();
      const movements = await movRes.json();

      setStats({
        articles: Array.isArray(articles) ? articles.length : 0,
        employees: Array.isArray(employees) ? employees.length : 0,
        movements: Array.isArray(movements) ? movements.length : 0,
        lowStock: Array.isArray(articles) ? articles.filter((a: any) => a.stock_actual <= 5).length : 0
      });
    };
    fetchStats();
  }, [token]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="space-y-2">
        <div className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold tracking-wider uppercase">
          Resumen General
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight text-blue-600 uppercase">Panel de Control</h1>
        <p className="text-slate-500 max-w-2xl leading-relaxed font-medium">
          Bienvenido al centro de mando. Aquí tienes una vista rápida del estado actual de tu inventario y personal.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Package size={22}/>} title="Artículos" value={stats.articles} color="blue" />
        <StatCard icon={<Users size={22}/>} title="Personal" value={stats.employees} color="indigo" />
        <StatCard icon={<ClipboardList size={22}/>} title="Movimientos" value={stats.movements} color="sky" />
        <StatCard icon={<AlertTriangle size={22}/>} title="Stock Bajo" value={stats.lowStock} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-blue-50 group-hover:text-blue-100 transition-colors">
            <Package size={120} />
          </div>
          <div className="relative">
            <h2 className="text-2xl font-bold mb-4 text-slate-800 uppercase tracking-tighter">Eficiencia en Dotación</h2>
            <p className="text-slate-600 leading-relaxed max-w-md font-medium">
              Gestiona entregas y devoluciones en tiempo real. Cada movimiento actualiza automáticamente 
              las existencias de pantalones, calzado y uniformes para evitar quiebres de stock.
            </p>
            <button 
              onClick={() => navigate('/articulos')}
              className="mt-8 bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-100 transition-all active:scale-95"
            >
              Ver Inventario Completo
            </button>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl shadow-blue-100 relative overflow-hidden flex flex-col justify-center">
          <div className="absolute -bottom-4 -right-4 bg-white/10 w-32 h-32 rounded-full blur-2xl"></div>
          <h2 className="text-xl font-bold mb-4 uppercase tracking-widest">Aviso del Sistema</h2>
          <p className="text-blue-50 leading-relaxed mb-6 font-medium">
            Actualmente tienes <span className="font-black text-white underline underline-offset-4 decoration-sky-400">{stats.lowStock} artículos</span> con existencias mínimas. Se recomienda revisar el stock pronto.
          </p>
          <div className="flex items-center space-x-2 text-[10px] font-black uppercase bg-white/10 p-3 rounded-xl border border-white/20 tracking-widest">
            <AlertTriangle size={18} className="text-yellow-300" />
            <span>Actualizado en tiempo real</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode, title: string, value: number, color: string }> = ({ icon, title, value, color }) => {
  const colors: Record<string, string> = {
    blue: "from-blue-500 to-blue-600 shadow-blue-100",
    indigo: "from-indigo-500 to-indigo-600 shadow-indigo-100",
    sky: "from-sky-500 to-sky-600 shadow-sky-100",
    rose: "from-rose-500 to-rose-600 shadow-rose-100"
  };

  return (
    <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100 group hover:border-blue-200 transition-all duration-300">
      <div className={`bg-gradient-to-br ${colors[color]} w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-3xl font-black text-slate-800 tracking-tight">{value}</p>
      </div>
    </div>
  );
};

export default Dashboard;
