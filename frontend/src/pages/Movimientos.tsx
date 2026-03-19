import React, { useEffect, useState } from 'react';
import { API_URL } from '../apiConfig';
import { useAuth } from '../AuthContext';
import { PlusCircle, ArrowDownCircle, ArrowUpCircle, Receipt } from 'lucide-react';

interface Movement {
  id: number;
  articulo_nombre: string;
  articulo_talla?: string;
  empleado_nombre: string;
  tipo: 'ENTREGA' | 'SALIDA';
  cantidad: number;
  fecha: string;
  observaciones: string;
  codigo?: string;
  sucursal?: string;
  numero_factura?: string;
  tercero?: string;
  estado?: string;
  valor_total?: number;
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
    observaciones: '',
    codigo: '',
    sucursal: '',
    numero_factura: '',
    tercero: '',
    estado: 'Generada',
    valor_total: 0
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

  // Calcular valor total automáticamente cuando cambia cantidad o artículo
  useEffect(() => {
    const art = articles.find(a => a.id === Number(formData.articulo_id));
    if (art) {
      setFormData(prev => ({ ...prev, valor_total: (art.valor || 0) * prev.cantidad }));
    }
  }, [formData.articulo_id, formData.cantidad, articles]);

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
      setFormData({ 
        articulo_id: '', empleado_id: '', tipo: 'ENTREGA', cantidad: 1, observaciones: '',
        codigo: '', sucursal: '', numero_factura: '', tercero: '', estado: 'Generada', valor_total: 0
      });
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
          <p className="text-slate-500">Gestión de Entregas y Salidas</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-slate-800 text-white px-4 py-2 rounded shadow-md hover:bg-slate-700 transition-colors font-bold uppercase"
        >
          <PlusCircle size={20} />
          <span>Nuevo Movimiento</span>
        </button>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                <th className="px-6 py-4 font-semibold text-slate-700 uppercase text-[10px] tracking-widest">Fecha / Ref</th>
                <th className="px-6 py-4 font-semibold text-slate-700 uppercase text-[10px] tracking-widest">Tipo</th>
                <th className="px-6 py-4 font-semibold text-slate-700 uppercase text-[10px] tracking-widest">Detalles</th>
                <th className="px-6 py-4 font-semibold text-slate-700 uppercase text-[10px] tracking-widest text-center">Cant.</th>
                <th className="px-6 py-4 font-semibold text-slate-700 uppercase text-[10px] tracking-widest text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((mov) => (
                <tr key={mov.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-xs font-mono text-slate-500">{new Date(mov.fecha).toLocaleDateString()}</div>
                    <div className="text-[10px] font-bold text-blue-600 uppercase">{mov.codigo || mov.numero_factura || 'S/N'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center space-x-1 text-[10px] font-black uppercase ${
                      mov.tipo === 'ENTREGA' ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {mov.tipo === 'ENTREGA' ? <ArrowDownCircle size={14}/> : <Receipt size={14}/>}
                      <span>{mov.tipo}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 text-sm uppercase">
                      {mov.articulo_nombre} {mov.articulo_talla && <span className="text-blue-600 text-xs ml-1">[{mov.articulo_talla}]</span>}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {mov.sucursal && <span>Suc: {mov.sucursal} | </span>}
                      {mov.empleado_nombre ? `Recibe: ${mov.empleado_nombre}` : mov.tercero ? `Tercero: ${mov.tercero}` : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-slate-700">{mov.cantidad}</td>
                  <td className="px-6 py-4 text-right font-black text-slate-800">
                    ${(mov.valor_total || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-300 overflow-hidden">
            <header className="bg-slate-800 text-white px-8 py-6">
              <h2 className="text-2xl font-black uppercase tracking-widest">Registrar Movimiento</h2>
              <p className="text-slate-400 text-xs mt-1">Seleccione el tipo de operación para continuar</p>
            </header>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">Tipo de Operación</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['ENTREGA', 'SALIDA'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormData({...formData, tipo: t as any, empleado_id: '', tercero: '', numero_factura: '', codigo: ''})}
                        className={`py-3 rounded-xl text-[10px] font-black transition-all ${
                          formData.tipo === t ? 'bg-slate-800 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {t === 'ENTREGA' ? 'ENTREGA DE DOTACIÓN' : 'SALIDA POR FACTURA'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">Artículo / Prenda</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-slate-800 font-bold text-slate-800"
                    value={formData.articulo_id}
                    onChange={(e) => setFormData({...formData, articulo_id: e.target.value})}
                    required
                  >
                    <option value="">Seleccione artículo...</option>
                    {articles.map(a => <option key={a.id} value={a.id}>{a.nombre} - Talla: {a.talla || 'S/T'} (Stock: {a.stock_actual})</option>)}
                  </select>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">Cantidad</label>
                  <input 
                    type="number"
                    min="1"
                    className="w-full p-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-slate-800 font-bold text-slate-800"
                    value={formData.cantidad}
                    onChange={(e) => setFormData({...formData, cantidad: parseInt(e.target.value) || 1})}
                    required
                  />
                </div>

                {/* CAMPOS ESPECÍFICOS PARA ENTREGA */}
                {formData.tipo === 'ENTREGA' && (
                  <>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">Código de Entrega</label>
                      <input 
                        className="w-full p-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-slate-800 font-bold text-slate-800"
                        placeholder="E-001"
                        value={formData.codigo}
                        onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">Sucursal</label>
                      <input 
                        className="w-full p-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-slate-800 font-bold text-slate-800"
                        placeholder="Norte, Sur, Central..."
                        value={formData.sucursal}
                        onChange={(e) => setFormData({...formData, sucursal: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">Recibe (Empleado)</label>
                      <select 
                        className="w-full p-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-slate-800 font-bold text-slate-800"
                        value={formData.empleado_id}
                        onChange={(e) => setFormData({...formData, empleado_id: e.target.value})}
                        required
                      >
                        <option value="">Seleccione...</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.nombre_completo}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">Estado</label>
                      <select 
                        className="w-full p-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-slate-800 font-bold text-slate-800"
                        value={formData.estado}
                        onChange={(e) => setFormData({...formData, estado: e.target.value})}
                      >
                        <option value="Generada">Generada</option>
                        <option value="No Generada">No Generada</option>
                      </select>
                    </div>
                  </>
                )}

                {/* CAMPOS ESPECÍFICOS PARA SALIDA */}
                {formData.tipo === 'SALIDA' && (
                  <>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">N° Factura</label>
                      <input 
                        className="w-full p-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-slate-800 font-bold text-slate-800"
                        placeholder="FAC-123"
                        value={formData.numero_factura}
                        onChange={(e) => setFormData({...formData, numero_factura: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">Sucursal</label>
                      <input 
                        className="w-full p-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-slate-800 font-bold text-slate-800"
                        placeholder="Sede Principal..."
                        value={formData.sucursal}
                        onChange={(e) => setFormData({...formData, sucursal: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">Tercero / Cliente</label>
                      <input 
                        className="w-full p-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-slate-800 font-bold text-slate-800"
                        placeholder="Nombre de la empresa o cliente"
                        value={formData.tercero}
                        onChange={(e) => setFormData({...formData, tercero: e.target.value})}
                        required
                      />
                    </div>
                  </>
                )}

                <div className="col-span-2">
                  <div className="bg-slate-900 p-6 rounded-2xl flex justify-between items-center text-white">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Total Movimiento</span>
                    <span className="text-2xl font-black">${formData.valor_total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <footer className="flex justify-end space-x-4 pt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">Cancelar</button>
                <button type="submit" className="px-10 py-4 bg-slate-800 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-700 shadow-xl transition-all active:scale-95">Registrar Operación</button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Movimientos;
