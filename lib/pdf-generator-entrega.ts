
// @ts-nocheck
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

type Entrega = {
    id: string;
    receptorNombre: string;
    descripcion_entrega: string;
    responsable: string;
    createdAt: any;
    fotos_entrega?: string[];
    [key: string]: any;
};

export const exportEntregaToPDF = async (entrega: Entrega) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // --- Header ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Constancia de Entrega de Ayuda", 14, 22);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 28);
    doc.setFont("helvetica", "bold");
    doc.text("ResQ Hub", pageWidth - 14, 22, { align: "right" });
    doc.setDrawColor(200);
    doc.line(14, 32, pageWidth - 14, 32);

    const bodyData = [];

    // --- Delivery Info ---
    bodyData.push(
        [{ content: 'Información de la Entrega', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }],
        ['Receptor', entrega.receptorNombre || 'No registrado'],
        ['Fecha de Entrega', entrega.createdAt && entrega.createdAt.seconds ? format(new Date(entrega.createdAt.seconds * 1000), 'dd/MM/yyyy HH:mm') : 'No registrada'],
        ['Responsable de la Entrega', entrega.responsable || 'No registrado'],
        ['Artículos Entregados', entrega.descripcion_entrega || 'Sin descripción']
    );

    autoTable(doc, {
        startY: 35,
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

    let finalY = (doc as any).lastAutoTable.finalY || 100;

    // Signature section
    doc.setFontSize(10);
    doc.text("Firma del Receptor:", 14, finalY + 20);
    doc.line(14, finalY + 40, 84, finalY + 40); // Signature line
    doc.text("C.I:", 14, finalY + 45);

    doc.text("Firma del Responsable:", pageWidth / 2 + 10, finalY + 20);
    doc.line(pageWidth / 2 + 10, finalY + 40, pageWidth - 14, finalY + 40); // Signature line
    doc.text("C.I:", pageWidth / 2 + 10, finalY + 45);

    // --- Photos ---
    if (entrega.fotos_entrega && entrega.fotos_entrega.length > 0) {
        doc.addPage();
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Constancia Fotográfica de la Entrega", 14, 22);
        
        let y = 30;
        const margin = 14;
        const imgWidth = (pageWidth - 3 * margin) / 2; // Two images per row
        
        for (let i = 0; i < entrega.fotos_entrega.length; i++) {
            const base64Img = entrega.fotos_entrega[i];
            const x = (i % 2 === 0) ? margin : pageWidth - imgWidth - margin;

            if (base64Img) {
                try {
                    const imgProps = doc.getImageProperties(base64Img);
                    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

                    if (y + imgHeight > doc.internal.pageSize.getHeight() - margin) {
                        doc.addPage();
                        doc.setFontSize(14);
                        doc.setFont("helvetica", "bold");
                        doc.text("Constancia Fotográfica (Continuación)", 14, 22);
                        y = 30;
                    }

                    doc.addImage(base64Img, imgProps.fileType, x, y, imgWidth, imgHeight);
                    
                    if (i % 2 !== 0 || i === entrega.fotos_entrega.length - 1) {
                        y += imgHeight + 10;
                    }
                } catch (e) {
                    console.error("Error adding image to PDF:", e);
                    doc.text("Error al cargar imagen", x, y);
                     if (i % 2 !== 0 || i === entrega.fotos_entrega.length - 1) {
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
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
        doc.text("Reporte confidencial - ResQ Hub", 14, doc.internal.pageSize.getHeight() - 10);
    }

    // --- Save the PDF ---
    doc.save(`entrega_${entrega.receptorNombre.replace(/\s/g, '_')}.pdf`);
};
