import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { API_URL } from '../apiConfig';
import { Plus, Trash2, Edit2, Package, PackagePlus, AlertTriangle, Download } from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface Article {
  id: number;
  nombre: string;
  descripcion: string;
  categoria_id: number;
  categoria_nombre: string;
  stock_actual: number;
  talla: string;
  valor: number;
  fecha_factura?: string;
  quien_genero?: string;
  numero_factura?: string;
  orden_compra?: string;
  sucursal?: string;
}

interface Category {
  id: number;
  nombre: string;
}

const Articles: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    nombre: '', descripcion: '', categoria_id: '', stock_actual: 0, talla: '', valor: 0,
    fecha_factura: '', quien_genero: '', numero_factura: '', orden_compra: '', sucursal: ''
  });

  const fetchArticles = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${API_URL}/articulos`, { headers });
      const data = await res.json();
      setArticles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setArticles([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await fetch(`${API_URL}/categorias`, { headers });
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchArticles();
    fetchCategories();
  }, [token]);

  // Cálculos para el resumen
  const totalStock = articles.reduce((acc, art) => acc + art.stock_actual, 0);
  const lowStockItems = articles.filter(art => art.stock_actual <= 5).length;
  const totalInvestment = articles.reduce((acc, art) => acc + ((art.valor || 0) * art.stock_actual), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const headers = { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}` 
    };
    const url = editingArticle 
      ? `${API_URL}/articulos/${editingArticle.id}` 
      : `${API_URL}/articulos`;
    const method = editingArticle ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers,
      body: JSON.stringify(formData),
    });
    
    setShowModal(false);
    setEditingArticle(null);
    setFormData({ 
      nombre: '', descripcion: '', categoria_id: '', stock_actual: 0, talla: '', valor: 0,
      fecha_factura: '', quien_genero: '', numero_factura: '', orden_compra: '', sucursal: ''
    });
    fetchArticles();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que desea eliminar este artículo?')) return;
    await fetch(`${API_URL}/articulos/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchArticles();
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setFormData({
      nombre: article.nombre,
      descripcion: article.descripcion || '',
      categoria_id: article.categoria_id?.toString() || '',
      stock_actual: article.stock_actual,
      talla: article.talla || '',
      valor: article.valor || 0,
      fecha_factura: article.fecha_factura || '',
      quien_genero: article.quien_genero || '',
      numero_factura: article.numero_factura || '',
      orden_compra: article.orden_compra || '',
      sucursal: article.sucursal || ''
    });
    setShowModal(true);
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventario');

    // Título Principal
    const titleRow = worksheet.addRow(['AUTOBOY - REPORTE DE INVENTARIO']);
    titleRow.font = { name: 'Arial Black', size: 16, color: { argb: 'FFFFFFFF' } };
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.mergeCells('A1:G1');
    titleRow.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' } // Slate 800
    };

    // Subtítulo con fecha
    const dateRow = worksheet.addRow(['Fecha de generación: ' + new Date().toLocaleString()]);
    worksheet.mergeCells('A2:G2');
    dateRow.alignment = { horizontal: 'center' };
    dateRow.font = { italic: true, size: 10, color: { argb: 'FF64748B' } };

    worksheet.addRow([]); // Espacio

    // Encabezados de Tabla
    const headerRow = worksheet.addRow(['ARTÍCULO', 'DESCRIPCIÓN', 'CATEGORÍA', 'TALLA', 'STOCK', 'V. UNITARIO', 'V. TOTAL']);
    
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2563EB' } // Blue 600
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Agregar Datos
    articles.forEach((art) => {
      const row = worksheet.addRow([
        art.nombre.toUpperCase(),
        art.descripcion || 'N/A',
        art.categoria_nombre,
        art.talla || 'S/T',
        art.stock_actual,
        art.valor || 0,
        (art.valor || 0) * art.stock_actual
      ]);

      row.getCell(6).numFmt = '"$"#,##0';
      row.getCell(7).numFmt = '"$"#,##0';
      
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { vertical: 'middle' };
      });
      row.getCell(5).alignment = { horizontal: 'center' };
    });

    // Fila de Totales
    worksheet.addRow([]);
    const footerRow = worksheet.addRow(['', '', '', 'TOTALES', totalStock, '', totalInvestment]);
    footerRow.font = { bold: true, size: 12 };
    footerRow.getCell(7).numFmt = '"$"#,##0';
    footerRow.getCell(4).alignment = { horizontal: 'right' };
    footerRow.getCell(5).alignment = { horizontal: 'center' };

    // Ajustar anchos de columnas
    worksheet.getColumn(1).width = 25;
    worksheet.getColumn(2).width = 35;
    worksheet.getColumn(3).width = 20;
    worksheet.getColumn(4).width = 10;
    worksheet.getColumn(5).width = 12;
    worksheet.getColumn(6).width = 15;
    worksheet.getColumn(7).width = 18;

    // Generar archivo
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `AUTOBOY_Inventario_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Inventario de Dotación</h1>
          <p className="text-slate-500 font-medium">Control total de existencias y suministros</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportToExcel}
            className="flex items-center justify-center space-x-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all active:scale-95 font-bold uppercase tracking-wide text-sm"
          >
            <Download size={20} />
            <span>Descargar Excel</span>
          </button>
          <button 
            onClick={() => { 
              setEditingArticle(null); 
              setFormData({ 
                nombre: '', descripcion: '', categoria_id: '', stock_actual: 0, talla: '', valor: 0,
                fecha_factura: '', quien_genero: '', numero_factura: '', orden_compra: '', sucursal: ''
              }); 
              setShowModal(true); 
            }}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-95 font-bold uppercase tracking-wide text-sm"
          >
            <Plus size={20} />
            <span>Nuevo Artículo</span>
          </button>
        </div>
      </header>

      {/* Tarjetas de Resumen de Stock */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="bg-blue-100 p-3 rounded-2xl text-blue-600">
            <Package size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Prendas</p>
            <p className="text-2xl font-black text-slate-800">{totalStock}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600">
            <PackagePlus size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inversión Total</p>
            <p className="text-2xl font-black text-slate-800">${totalInvestment.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="bg-amber-100 p-3 rounded-2xl text-amber-600">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Crítico</p>
            <p className="text-2xl font-black text-slate-800">{lowStockItems}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center space-x-4">
          <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600">
            <PackagePlus size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipos</p>
            <p className="text-2xl font-black text-slate-800">{articles.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 font-bold text-slate-400 uppercase text-[11px] tracking-widest">Artículo / Talla</th>
                <th className="px-8 py-5 font-bold text-slate-400 uppercase text-[11px] tracking-widest">Categoría</th>
                <th className="px-8 py-5 font-bold text-slate-400 uppercase text-[11px] tracking-widest text-center">Stock Actual</th>
                <th className="px-8 py-5 font-bold text-slate-400 uppercase text-[11px] tracking-widest text-center">V. Unitario</th>
                <th className="px-8 py-5 font-bold text-slate-400 uppercase text-[11px] tracking-widest text-center">V. Total</th>
                <th className="px-8 py-5 font-bold text-slate-400 uppercase text-[11px] tracking-widest text-center">Estado</th>
                <th className="px-8 py-5 font-bold text-slate-400 uppercase text-[11px] tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {articles.map((art) => (
                <tr key={art.id} className="group hover:bg-blue-50/30 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors font-bold">
                        {art.talla || 'S/T'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-lg group-hover:text-blue-700 transition-colors uppercase">{art.nombre}</div>
                        <div className="text-xs text-slate-400 italic line-clamp-1">{art.descripcion || 'Sin descripción adicional'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight">
                      {art.categoria_nombre}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="text-2xl font-black text-slate-700">{art.stock_actual}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase">Unidades</div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="text-lg font-bold text-slate-700">${(art.valor || 0).toLocaleString()}</div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="text-lg font-black text-blue-600">${((art.valor || 0) * art.stock_actual).toLocaleString()}</div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                      art.stock_actual <= 0 
                      ? 'bg-red-100 text-red-600' 
                      : art.stock_actual <= 5 
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      {art.stock_actual <= 0 ? 'Agotado' : art.stock_actual <= 5 ? 'Bajo' : 'Disponible'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => handleEdit(art)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm bg-white border border-slate-100">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(art.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm bg-white border border-slate-100">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-white">
            <header className="bg-gradient-to-r from-blue-600 to-indigo-600 px-10 py-8 text-white relative">
              <div className="absolute top-0 right-0 p-8 opacity-20 text-white">
                <Package size={80} />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tight relative z-10">
                {editingArticle ? 'Editar Artículo' : 'Nuevo Ingreso'}
              </h2>
              <p className="text-blue-100 relative z-10 font-medium mt-1">Gestión de existencias en tiempo real</p>
            </header>
            <form onSubmit={handleSubmit} className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nombre de la Prenda</label>
                  <input 
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 transition-all"
                    placeholder="Ej. Saco de Gala / Pantalón de Trabajo"
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Categoría</label>
                  <select 
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800"
                    value={formData.categoria_id}
                    onChange={(e) => setFormData({...formData, categoria_id: e.target.value})}
                    required
                  >
                    <option value="">Seleccione...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Talla</label>
                  <input 
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800"
                    placeholder="Ej. L, 42, XL"
                    value={formData.talla}
                    onChange={(e) => setFormData({...formData, talla: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Valor Unitario</label>
                  <input 
                    type="number"
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800"
                    placeholder="0"
                    value={formData.valor}
                    onChange={(e) => setFormData({...formData, valor: parseInt(e.target.value) || 0})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Sucursal</label>
                  <input 
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800"
                    placeholder="Ej. Sede Norte"
                    value={formData.sucursal}
                    onChange={(e) => setFormData({...formData, sucursal: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest border-b border-blue-50 pb-2 mb-4 mt-2">Información de Compra / Factura</h3>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Fecha Factura</label>
                  <input 
                    type="date"
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800"
                    value={formData.fecha_factura}
                    onChange={(e) => setFormData({...formData, fecha_factura: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Número Factura</label>
                  <input 
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800"
                    placeholder="FAC-000"
                    value={formData.numero_factura}
                    onChange={(e) => setFormData({...formData, numero_factura: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Orden de Compra</label>
                  <input 
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800"
                    placeholder="OC-000"
                    value={formData.orden_compra}
                    onChange={(e) => setFormData({...formData, orden_compra: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Generado Por</label>
                  <input 
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800"
                    placeholder="Nombre responsable"
                    value={formData.quien_genero}
                    onChange={(e) => setFormData({...formData, quien_genero: e.target.value})}
                  />
                </div>
                {!editingArticle && (
                  <div className="col-span-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Cantidad Inicial</label>
                    <input 
                      type="number"
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800"
                      value={formData.stock_actual}
                      onChange={(e) => setFormData({...formData, stock_actual: parseInt(e.target.value) || 0})}
                      required
                    />
                  </div>
                )}
              </div>
              <footer className="flex justify-end items-center space-x-6 pt-8 border-t border-slate-50">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold uppercase tracking-widest text-xs"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95"
                >
                  {editingArticle ? 'Actualizar' : 'Cargar Inventario'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Articles;
