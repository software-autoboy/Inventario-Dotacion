import React, { useEffect, useState } from 'react';
import { API_URL } from '../apiConfig';
import { useAuth } from '../AuthContext';
import { ClipboardList, PlusCircle, ArrowDownCircle, ArrowUpCircle, RotateCcw } from 'lucide-react';

interface Movement {
  id: number;
  articulo_nombre: string;
  empleado_nombre: string;
  tipo: 'ENTRADA' | 'ENTREGA' | 'DEVOLUCION';
  cantidad: number;
  fecha: string;
  observaciones: string;
}

const Movimientos: React.FC = () => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    articulo_id: '',
    empleado_id: '',
    tipo: 'ENTREGA',
    cantidad: 1,
    observaciones: ''
  });

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [movRes, artRes, empRes] = await Promise.all([
        fetch(`${API_URL}/movimientos`, { headers }),
        fetch(`${API_URL}/articulos`, { headers }),
        fetch(`${API_URL}/empleados`, { headers })
      ]);
      const movData = await movRes.json();
      const artData = await artRes.json();
      const empData = await empRes.json();
      
      setMovements(Array.isArray(movData) ? movData : []);
      setArticles(Array.isArray(artData) ? artData : []);
      setEmployees(Array.isArray(empData) ? empData : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setMovements([]);
      setArticles([]);
      setEmployees([]);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/movimientos`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setShowModal(false);
      setFormData({ articulo_id: '', empleado_id: '', tipo: 'ENTREGA', cantidad: 1, observaciones: '' });
      fetchData();
    } else {
      const error = await res.json();
      alert(`Error: ${error.error}`);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 uppercase tracking-tight">Movimientos de Inventario</h1>
          <p className="text-slate-500">Registro de entregas, entradas y devoluciones</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-slate-800 text-white px-4 py-2 rounded shadow-md hover:bg-slate-700 transition-colors font-bold uppercase"
        >
          <PlusCircle size={20} />
          <span>Registrar Movimiento</span>
        </button>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200">
              <th className="px-6 py-4 font-semibold text-slate-700 uppercase text-sm">Fecha</th>
              <th className="px-6 py-4 font-semibold text-slate-700 uppercase text-sm">Tipo</th>
              <th className="px-6 py-4 font-semibold text-slate-700 uppercase text-sm">Artículo</th>
              <th className="px-6 py-4 font-semibold text-slate-700 uppercase text-sm text-center">Cant.</th>
              <th className="px-6 py-4 font-semibold text-slate-700 uppercase text-sm">Empleado</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((mov) => (
              <tr key={mov.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-xs font-mono text-slate-500">
                  {new Date(mov.fecha).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`flex items-center space-x-1 text-xs font-bold uppercase ${
                    mov.tipo === 'ENTREGA' ? 'text-red-600' : mov.tipo === 'ENTRADA' ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {mov.tipo === 'ENTREGA' ? <ArrowDownCircle size={14}/> : mov.tipo === 'ENTRADA' ? <ArrowUpCircle size={14}/> : <RotateCcw size={14}/>}
                    <span>{mov.tipo}</span>
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-slate-800">{mov.articulo_nombre}</td>
                <td className="px-6 py-4 text-center font-bold text-slate-700">{mov.cantidad}</td>
                <td className="px-6 py-4 text-slate-600 text-sm">{mov.empleado_nombre || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-300 overflow-hidden">
            <header className="bg-slate-800 text-white px-6 py-4">
              <h2 className="text-xl font-bold uppercase tracking-widest">Nuevo Movimiento</h2>
            </header>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-tighter">Tipo de Movimiento</label>
                  <select 
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-slate-800"
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value as any, empleado_id: e.target.value === 'ENTRADA' ? '' : formData.empleado_id})}
                    required
                  >
                    <option value="ENTREGA">ENTREGA (SALIDA DE STOCK)</option>
                    <option value="ENTRADA">ENTRADA (CARGA DE STOCK)</option>
                    <option value="DEVOLUCION">DEVOLUCIÓN (RETORNO A STOCK)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-tighter">Artículo</label>
                  <select 
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-slate-800"
                    value={formData.articulo_id}
                    onChange={(e) => setFormData({...formData, articulo_id: e.target.value})}
                    required
                  >
                    <option value="">Seleccione artículo...</option>
                    {articles.map(a => <option key={a.id} value={a.id}>{a.nombre} (Stock: {a.stock_actual})</option>)}
                  </select>
                </div>
                {formData.tipo !== 'ENTRADA' && (
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-tighter">Empleado</label>
                    <select 
                      className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-slate-800"
                      value={formData.empleado_id}
                      onChange={(e) => setFormData({...formData, empleado_id: e.target.value})}
                      required
                    >
                      <option value="">Seleccione empleado...</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.nombre_completo}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-tighter">Cantidad</label>
                  <input 
                    type="number"
                    min="1"
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-slate-800"
                    value={formData.cantidad}
                    onChange={(e) => setFormData({...formData, cantidad: parseInt(e.target.value) || 1})}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1 uppercase tracking-tighter">Observaciones</label>
                  <textarea 
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-slate-800"
                    value={formData.observaciones}
                    onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                  />
                </div>
              </div>
              <footer className="flex justify-end space-x-3 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 font-bold uppercase">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-slate-800 text-white rounded font-bold hover:bg-slate-700 uppercase shadow-lg">Registrar</button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Movimientos;
