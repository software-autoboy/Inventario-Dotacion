import jsPDF from 'jspdf';
import 'jspdf-autotable'; // Esto registra el plugin automáticamente
import React from 'react';
import { FileDown } from 'lucide-react';

type Item = { nombre: string; talla?: string | null; cantidad: number; fecha: string; tipo: string };
type Props = {
  empleado: { id: number; nombre_completo: string; documento?: string; cargo?: string; area?: string };
  items: Item[];
};

const GeneratePdf: React.FC<Props> = ({ empleado, items }) => {
  const generate = () => {
    try {
      console.log("Generando acta para:", empleado.nombre_completo);

      if (!items || items.length === 0) {
        alert("Este empleado no tiene movimientos registrados.");
        return;
      }

      // 1. Crear documento
      const doc = new jsPDF();
      
      // 2. Encabezado Azul
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('ACTA DE ENTREGA DE DOTACIÓN Y EPP', 105, 10, { align: 'center' });

      // 3. Título y Fecha
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(18);
      doc.text('Comprobante Oficial', 20, 30);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 20, 38);

      // 4. Cuadro de Información del Empleado
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(20, 45, 170, 25, 3, 3, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMACIÓN DEL EMPLEADO', 25, 52);
      doc.setFont('helvetica', 'normal');
      doc.text(`Nombre: ${empleado.nombre_completo}`, 25, 59);
      doc.text(`C.C: ${empleado.documento || 'N/A'}`, 25, 65);
      doc.text(`Cargo: ${empleado.cargo || 'N/A'}`, 110, 59);
      doc.text(`Área: ${empleado.area || 'N/A'}`, 110, 65);

      // 5. Tabla de Artículos (Usando el método del plugin)
      const tableRows = items.map((it, idx) => [
        idx + 1,
        it.fecha ? new Date(it.fecha).toLocaleDateString() : '-',
        it.nombre,
        it.talla || '-',
        it.cantidad,
        it.tipo
      ]);

      // @ts-ignore - autoTable es inyectado por el import de jspdf-autotable
      doc.autoTable({
        startY: 80,
        head: [['No.', 'Fecha', 'Artículo', 'Talla', 'Cant.', 'Tipo']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], fontStyle: 'bold' },
        styles: { fontSize: 9 },
        margin: { left: 20, right: 20 }
      });

      // 6. Firmas
      // @ts-ignore
      const finalY = (doc as any).lastAutoTable.finalY + 40;
      
      if (finalY > 260) doc.addPage();

      doc.setDrawColor(203, 213, 225);
      doc.line(20, finalY, 90, finalY);
      doc.setFont('helvetica', 'bold');
      doc.text('ENTREGADO POR', 20, finalY + 5);
      doc.setFont('helvetica', 'normal');
      doc.text('Firma Responsable Inventario', 20, finalY + 10);

      doc.line(120, finalY, 190, finalY);
      doc.setFont('helvetica', 'bold');
      doc.text('RECIBIDO POR (EMPLEADO)', 120, finalY + 5);
      doc.setFont('helvetica', 'normal');
      doc.text(empleado.nombre_completo, 120, finalY + 10);
      doc.text(`C.C: ${empleado.documento || ''}`, 120, finalY + 15);

      // 7. Pie de página
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Este documento es una constancia legal de los elementos de dotación recibidos.', 105, 285, { align: 'center' });

      // 8. Guardar
      doc.save(`ACTA_DOTACION_${empleado.nombre_completo.replace(/\s+/g, '_')}.pdf`);

    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("Hubo un error técnico al generar el archivo. Por favor intenta de nuevo.");
    }
  };

  return (
    <button 
      onClick={(e) => {
        e.stopPropagation();
        generate();
      }}
      className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold text-xs uppercase transition-all shadow-sm ${
        items.length > 0 
        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100 hover:-translate-y-0.5' 
        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
      }`}
    >
      <FileDown size={16} />
      <span>{items.length === 0 ? 'Sin Movimientos' : 'Descargar Acta'}</span>
    </button>
  );
};

export default GeneratePdf;
