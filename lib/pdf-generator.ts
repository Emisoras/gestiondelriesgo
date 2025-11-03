// @ts-nocheck
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { drawHeader } from './pdf-header-config';

type Damnificado = {
    id: string;
    nombre: string;
    apellido: string;
    cedula?: string;
    nacionalidad?: string;
    edad?: number;
    genero?: string;
    fecha_nacimiento?: any;
    email?: string;
    telefono?: string;
    direccion: string;
    barrio?: string;
    coordenadas?: string;
    ciudad: string;
    estado: string;
    miembros_familia?: string;
    tipo_vivienda: string;
    condiciones_vivienda: string;
    danos_vivienda?: string;
    fotos_danos?: string[];
    necesidades?: string[];
    [key: string]: any;
};

export const exportDamnificadoToPDF = async (damnificado: Damnificado) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // --- Header ---
    await drawHeader(doc);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Ficha de Registro de Damnificado", pageWidth / 2, 48, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, margin, 55);
    

    const bodyData = [];
    const capitalize = (s) => (s && typeof s === 'string' ? s.charAt(0).toUpperCase() + s.slice(1) : '');

    // --- Personal Info ---
    bodyData.push(
        [{ content: 'Información Personal', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }],
        ['Nombre Completo', `${damnificado.nombre || ''} ${damnificado.apellido || ''}`.trim()],
        ['Cédula', damnificado.cedula || 'No registrado'],
        ['Nacionalidad', damnificado.nacionalidad || 'No registrada'],
        ['Edad', damnificado.edad?.toString() || 'No registrada'],
        ['Género', capitalize(damnificado.genero) || 'No registrado'],
        ['Fecha de Nacimiento', damnificado.fecha_nacimiento && damnificado.fecha_nacimiento.seconds ? format(new Date(damnificado.fecha_nacimiento.seconds * 1000), 'dd/MM/yyyy', { locale: es }) : 'No registrada'],
        ['Email', damnificado.email || 'No registrado'],
        ['Teléfono', damnificado.telefono || 'No registrado']
    );

    // --- Location & Housing ---
    bodyData.push(
        [{ content: 'Ubicación y Vivienda', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }],
        ['Dirección', damnificado.direccion || 'No registrada'],
        ['Barrio/Sector', damnificado.barrio || 'No registrado'],
        ['Coordenadas GPS', damnificado.coordenadas || 'No registradas'],
        ['Ciudad / Estado', `${damnificado.ciudad || ''}, ${damnificado.estado || ''}`.trim()],
        ['Tipo de Vivienda', capitalize(damnificado.tipo_vivienda)],
        ['Condición de Vivienda', capitalize(damnificado.condiciones_vivienda?.replace(/_/g, ' '))],
        ['Descripción de Daños', damnificado.danos_vivienda || 'Sin descripción']
    );

    // --- Family & Needs ---
    bodyData.push(
        [{ content: 'Grupo Familiar y Necesidades', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }],
        ['Miembros del Grupo Familiar', damnificado.miembros_familia || 'Sin descripción'],
        ['Necesidades Urgentes', damnificado.necesidades && damnificado.necesidades.length > 0 ? damnificado.necesidades.map(n => capitalize(n.replace(/_/g, ' '))).join(', ') : 'Ninguna especificada']
    );
    
    autoTable(doc, {
        startY: 60,
        body: bodyData,
        theme: 'grid',
        styles: {
            fontSize: 10,
            cellPadding: 2,
        },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 50 },
            1: { cellWidth: 'auto' },
        }
    });
    
    // --- Photos ---
    if (damnificado.fotos_danos && damnificado.fotos_danos.length > 0) {
        doc.addPage();
        await drawHeader(doc);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Fotos de los Daños", margin, 48);
        
        let y = 55;
        const imgWidth = (pageWidth - 3 * margin) / 2; // Two images per row
        
        for (let i = 0; i < damnificado.fotos_danos.length; i++) {
            const base64Img = damnificado.fotos_danos[i];
            
            const x = (i % 2 === 0) ? margin : pageWidth - imgWidth - margin;

            if (base64Img) {
                try {
                    const imgProps = doc.getImageProperties(base64Img);
                    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

                    if (y + imgHeight > doc.internal.pageSize.getHeight() - margin) {
                        doc.addPage();
                        await drawHeader(doc);
                        doc.setFontSize(14);
                        doc.setFont("helvetica", "bold");
                        doc.text("Fotos de los Daños (Continuación)", margin, 48);
                        y = 55;
                    }

                    doc.addImage(base64Img, imgProps.fileType, x, y, imgWidth, imgHeight);
                    
                    if (i % 2 !== 0 || i === damnificado.fotos_danos.length - 1) {
                        y += imgHeight + 10;
                    }
                } catch (e) {
                    console.error("Error adding image to PDF:", e);
                    doc.text("Error al cargar imagen", x, y);
                     if (i % 2 !== 0 || i === damnificado.fotos_danos.length - 1) {
                        y += 10;
                    }
                }
            }
        }
    }

    // --- Footer ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
        doc.text("Reporte confidencial - ResQ Hub", margin, doc.internal.pageSize.getHeight() - 10);
    }

    // --- Save the PDF ---
    doc.save(`damnificado_${damnificado.nombre}_${damnificado.apellido}.pdf`);
};
