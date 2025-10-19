
// @ts-nocheck
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

type Entrega = {
    id: string;
    receptorNombre: string;
    descripcion_entrega: string;
    responsable: string;
    fecha_entrega: any;
    createdAt: any;
    fotos_entrega?: string[];
    firmaReceptor?: string;
    huellaReceptor?: string;
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
        ['Fecha de Entrega', entrega.fecha_entrega && entrega.fecha_entrega.seconds ? format(new Date(entrega.fecha_entrega.seconds * 1000), 'dd/MM/yyyy') : 'No registrada'],
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
    
    // --- Signature and Fingerprint ---
    const signatureHeight = 40;
    const signatureWidth = 80;
    const fingerprintHeight = 40;
    const fingerprintWidth = 40;
    
    doc.setFontSize(10);
    doc.text("Recibido por:", 14, finalY + 15);
    
    if (entrega.firmaReceptor) {
        try {
            const imgProps = doc.getImageProperties(entrega.firmaReceptor);
            const ratio = imgProps.width / imgProps.height;
            const h = signatureWidth / ratio;
            doc.addImage(entrega.firmaReceptor, 'PNG', 14, finalY + 20, signatureWidth, Math.min(h, signatureHeight));
        } catch (e) {
            doc.text("Error al cargar firma", 14, finalY + 25);
        }
    }
    doc.line(14, finalY + 20 + signatureHeight, 14 + signatureWidth, finalY + 20 + signatureHeight);
    doc.text(entrega.receptorNombre || '', 14, finalY + 25 + signatureHeight);
    doc.text("C.I:", 14, finalY + 30 + signatureHeight);


    const rightColumnX = pageWidth / 2 + 10;
    doc.text("Huella:", rightColumnX, finalY + 15);
    doc.rect(rightColumnX, finalY + 20, fingerprintWidth, fingerprintHeight); // Fingerprint box
    if (entrega.huellaReceptor) {
        try {
            const imgProps = doc.getImageProperties(entrega.huellaReceptor);
            const ratio = imgProps.width / imgProps.height;
            let w = fingerprintWidth - 4;
            let h = w / ratio;
            if (h > fingerprintHeight - 4) {
                h = fingerprintHeight - 4;
                w = h * ratio;
            }
            const x_pos = rightColumnX + (fingerprintWidth - w) / 2;
            const y_pos = finalY + 20 + (fingerprintHeight - h) / 2;
            doc.addImage(entrega.huellaReceptor, imgProps.fileType, x_pos, y_pos, w, h);
        } catch(e) {
             doc.text("Error huella", rightColumnX + 2, finalY + 25);
        }
    }

    const signatureY = finalY + 20 + signatureHeight + 20;

    doc.text("Entregado por:", 14, signatureY);
    doc.line(14, signatureY + 20, 84, signatureY + 20); // Signature line
    doc.text(entrega.responsable || '', 14, signatureY + 25);
    doc.text("C.I:", 14, signatureY + 30);


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
