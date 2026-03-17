import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { LayoutDashboard, Package, Users, ClipboardList, LogOut } from 'lucide-react';

const Navbar: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = "flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 group";
  const activeLinkClass = "bg-blue-50 text-blue-600 shadow-sm";
  const inactiveLinkClass = "text-slate-500 hover:bg-blue-50/50 hover:text-blue-500";

  return (
    <nav className="bg-white border-r border-blue-100 h-screen w-72 fixed left-0 top-0 flex flex-col p-6 shadow-sm z-10">
      <div className="flex items-center space-x-3 mb-10 px-2">
        <div className="bg-blue-600 p-2 rounded-lg shadow-blue-200 shadow-lg">
          <Package className="text-white" size={24} />
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
          DotaciónPro
        </span>
      </div>
      
      <div className="flex-1 space-y-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-3">Menú Principal</p>
        
        <Link to="/" className={`${navLinkClass} ${location.pathname === '/' ? activeLinkClass : inactiveLinkClass}`}>
          <LayoutDashboard size={20} />
          <span className="font-medium">Dashboard</span>
        </Link>
        
        <Link to="/articulos" className={`${navLinkClass} ${location.pathname === '/articulos' ? activeLinkClass : inactiveLinkClass}`}>
          <Package size={20} />
          <span className="font-medium">Inventario</span>
        </Link>
        
        <Link to="/empleados" className={`${navLinkClass} ${location.pathname === '/empleados' ? activeLinkClass : inactiveLinkClass}`}>
          <Users size={20} />
          <span className="font-medium">Personal</span>
        </Link>
        
        <Link to="/movimientos" className={`${navLinkClass} ${location.pathname === '/movimientos' ? activeLinkClass : inactiveLinkClass}`}>
          <ClipboardList size={20} />
          <span className="font-medium">Movimientos</span>
        </Link>
      </div>

      <div className="mt-auto pt-6 border-t border-slate-100">
        <button 
          onClick={handleLogout}
          className="flex items-center space-x-3 p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all w-full group"
        >
          <LogOut size={20} className="group-hover:scale-110 transition-transform" />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
