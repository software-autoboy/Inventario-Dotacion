import React, { useEffect, useState } from 'react';
import { API_URL } from '../apiConfig';
import { useAuth } from '../AuthContext';
import { Plus, Users, Search, MapPin, Briefcase } from 'lucide-react';
import GeneratePdf from '../components/GeneratePdf';

interface Employee {
  id: number;
  documento: string;
  nombre_completo: string;
  cargo: string;
  area: string;
}

interface Movement {
  id: number;
  articulo_id: number;
  articulo_nombre: string;
  empleado_id: number;
  tipo: string;
  cantidad: number;
  fecha: string;
  talla: string;
}

import React, { useEffect, useState } from 'react';
import { API_URL } from '../apiConfig';
import { useAuth } from '../AuthContext';
import { Plus, Users, Search, MapPin, Briefcase, Trash2 } from 'lucide-react';
import GeneratePdf from '../components/GeneratePdf';

interface Employee {
  id: number;
  documento: string;
  nombre_completo: string;
  cargo: string;
  area: string;
}

interface Movement {
  id: number;
  articulo_id: number;
  articulo_nombre: string;
  empleado_id: number;
  tipo: string;
  cantidad: number;
  fecha: string;
  talla: string;
}

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { token } = useAuth();
  const [formData, setFormData] = useState({ documento: '', nombre_completo: '', cargo: '', area: '' });

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [empRes, movRes] = await Promise.all([
        fetch(`${API_URL}/empleados`, { headers }),
        fetch(`${API_URL}/movimientos`, { headers })
      ]);
      const empData = await empRes.json();
      const movData = await movRes.json();
      setEmployees(Array.isArray(empData) ? empData : []);
      setMovements(Array.isArray(movData) ? movData : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setEmployees([]);
      setMovements([]);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${API_URL}/empleados`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(formData),
    });
    setShowModal(false);
    setFormData({ documento: '', nombre_completo: '', cargo: '', area: '' });
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que desea eliminar este empleado?')) return;
    const res = await fetch(`${API_URL}/empleados/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (res.ok) {
      fetchData();
    } else {
      const err = await res.json();
      alert(err.error || 'Error al eliminar');
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.documento.includes(searchTerm)
  );

  const getEmployeeItems = (empId: number) => {
    return movements
      .filter(m => m.empleado_id === empId && (m.tipo === 'ENTREGA' || m.tipo === 'DEVOLUCION'))
      .map(m => ({
        nombre: m.articulo_nombre,
        talla: m.talla,
        cantidad: m.cantidad,
        fecha: m.fecha,
        tipo: m.tipo
      }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight text-blue-600">Personal</h1>
          <p className="text-slate-500 font-medium">Gestión de beneficiarios y actas de entrega</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative group w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="text"
              placeholder="Buscar por nombre o CC..."
              className="w-full pl-12 pr-4 py-3 bg-white border-none rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="w-full md:w-auto flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-95 font-bold uppercase tracking-wide text-sm"
          >
            <Plus size={20} />
            <span>Nuevo Empleado</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((emp) => (
          <div key={emp.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 hover:border-blue-200 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Users size={80} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
                  <Users size={24} />
                </div>
                <div className="flex space-x-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                    ID: {emp.documento}
                  </span>
                  <button 
                    onClick={() => handleDelete(emp.id)}
                    className="p-1 text-slate-300 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-800 uppercase mb-4 line-clamp-1">{emp.nombre_completo}</h3>
              
              <div className="space-y-2 mb-6 text-sm text-slate-500 font-medium">
                <div className="flex items-center space-x-2">
                  <Briefcase size={14} className="text-blue-400" />
                  <span>{emp.cargo || 'Sin Cargo'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin size={14} className="text-blue-400" />
                  <span>{emp.area || 'Sin Área'}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Artículos Recibidos</span>
                  <span className="text-lg font-black text-slate-700">{getEmployeeItems(emp.id).length}</span>
                </div>
                <GeneratePdf empleado={emp} items={getEmployeeItems(emp.id)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-white">
             <header className="bg-gradient-to-r from-blue-600 to-indigo-600 px-10 py-8 text-white">
              <h2 className="text-2xl font-black uppercase tracking-widest">Registrar Empleado</h2>
              <p className="text-blue-100 font-medium text-sm">Añade un nuevo beneficiario al sistema</p>
            </header>
            <form onSubmit={handleSubmit} className="p-10 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Documento de Identidad</label>
                <input 
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all"
                  placeholder="Ej: 10203040"
                  value={formData.documento}
                  onChange={(e) => setFormData({...formData, documento: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombre Completo</label>
                <input 
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all"
                  placeholder="Ej: JUAN PEREZ"
                  value={formData.nombre_completo}
                  onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Cargo</label>
                  <input 
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all"
                    placeholder="Ej: OPERARIO"
                    value={formData.cargo}
                    onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Área</label>
                  <input 
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all"
                    placeholder="Ej: PRODUCCION"
                    value={formData.area}
                    onChange={(e) => setFormData({...formData, area: e.target.value})}
                  />
                </div>
              </div>
              <footer className="flex justify-end items-center space-x-6 pt-8 border-t border-slate-50">
                <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold uppercase tracking-widest text-xs">Cancelar</button>
                <button type="submit" className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-100 transition-all active:scale-95">Guardar Empleado</button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
