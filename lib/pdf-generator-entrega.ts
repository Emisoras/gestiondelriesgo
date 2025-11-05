
// @ts-nocheck
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { drawHeader } from './pdf-header-config';

type Entrega = {
    id: string;
    receptorNombre: string;
    receptorCedula?: string;
    articulos: { nombre: string; cantidad: number; unidad: string }[];
    responsable: string;
    responsableCedula?: string;
    fecha_entrega: any;
    createdAt: any;
    fotos_entrega?: string[];
    firmaReceptor?: string;
    firmaResponsable?: string;
    huellaReceptor?: string;
    [key: string]: any;
};

export const exportEntregaToPDF = async (entrega: Entrega) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // --- Header ---
    await drawHeader(doc);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Constancia de Entrega de Ayuda", pageWidth / 2, 48, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, margin, 55);

    const deliveryInfo = [
        ['Receptor', entrega.receptorNombre || 'No registrado'],
        ['CC Receptor', entrega.receptorCedula || 'No registrado'],
        ['Fecha de Entrega', entrega.fecha_entrega && entrega.fecha_entrega.seconds ? format(new Date(entrega.fecha_entrega.seconds * 1000), 'dd/MM/yyyy') : 'No registrada'],
        ['Responsable de la Entrega', entrega.responsable || 'No registrado'],
    ];

    autoTable(doc, {
        startY: 60,
        body: deliveryInfo,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 1.5 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 50 },
        }
    });

    let finalY = (doc as any).lastAutoTable.finalY || 80;

    // --- Artículos Entregados Table ---
    if (entrega.articulos && entrega.articulos.length > 0) {
        const articulosBody = entrega.articulos.map(item => [item.nombre, item.cantidad, item.unidad]);
        
        autoTable(doc, {
            startY: finalY + 5,
            head: [['Artículo', 'Cantidad', 'Unidad']],
            body: articulosBody,
            theme: 'grid',
            headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
            styles: { fontSize: 10, cellPadding: 2 },
        });
        finalY = (doc as any).lastAutoTable.finalY;
    } else {
        doc.text("No se registraron artículos para esta entrega.", margin, finalY + 10);
        finalY += 10;
    }
    
    // --- Signature and Fingerprint ---
    const signatureHeight = 40;
    const signatureWidth = 80;
    const fingerprintHeight = 40;
    const fingerprintWidth = 40;

    let signaturesY = finalY + 15;

    if (signaturesY > 200) { // Move to new page if not enough space
        doc.addPage();
        await drawHeader(doc);
        signaturesY = 40;
    }
    
    doc.setFontSize(10);

    // --- Columna Izquierda: Receptor ---
    doc.text("Recibido por:", margin, signaturesY);
    if (entrega.firmaReceptor) {
        try {
            const imgProps = doc.getImageProperties(entrega.firmaReceptor);
            const ratio = imgProps.width / imgProps.height;
            const h = signatureWidth / ratio;
            doc.addImage(entrega.firmaReceptor, 'PNG', margin, signaturesY + 5, signatureWidth, Math.min(h, signatureHeight));
        } catch (e) {
            doc.text("Error al cargar firma", margin, signaturesY + 15);
        }
    }
    doc.line(margin, signaturesY + 5 + signatureHeight, margin + signatureWidth, signaturesY + 5 + signatureHeight);
    doc.text(entrega.receptorNombre || '', margin, signaturesY + 10 + signatureHeight);
    doc.text(`CC: ${entrega.receptorCedula || ''}`, margin, signaturesY + 15 + signatureHeight);


    // --- Columna Derecha: Responsable y Huella ---
    const rightColumnX = pageWidth / 2 + 10;

    // Responsable
    doc.text("Entregado por:", rightColumnX, signaturesY);
     if (entrega.firmaResponsable) {
        try {
            const imgProps = doc.getImageProperties(entrega.firmaResponsable);
            const ratio = imgProps.width / imgProps.height;
            const h = signatureWidth / ratio;
            doc.addImage(entrega.firmaResponsable, 'PNG', rightColumnX, signaturesY + 5, signatureWidth, Math.min(h, signatureHeight));
        } catch (e) {
            doc.text("Error al cargar firma", rightColumnX, signaturesY + 15);
        }
    }
    doc.line(rightColumnX, signaturesY + 5 + signatureHeight, rightColumnX + signatureWidth, signaturesY + 5 + signatureHeight);
    doc.text(entrega.responsable || '', rightColumnX, signaturesY + 10 + signatureHeight);
    doc.text(`CC: ${entrega.responsableCedula || ''}`, rightColumnX, signaturesY + 15 + signatureHeight);


    let huellaY = signaturesY + 5 + signatureHeight + 20;

     // Huella
    doc.text("Huella:", margin, huellaY);
    doc.rect(margin, huellaY + 5, fingerprintWidth, fingerprintHeight); // Fingerprint box
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
            const x_pos = margin + (fingerprintWidth - w) / 2;
            const y_pos = huellaY + 5 + (fingerprintHeight - h) / 2;
            doc.addImage(entrega.huellaReceptor, imgProps.fileType, x_pos, y_pos, w, h);
        } catch(e) {
             doc.text("Error huella", margin + 2, huellaY + 15);
        }
    }


    // --- Photos ---
    if (entrega.fotos_entrega && entrega.fotos_entrega.length > 0) {
        doc.addPage();
        await drawHeader(doc);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Constancia Fotográfica de la Entrega", margin, 48);
        
        let y = 55;
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
                        await drawHeader(doc);
                        doc.setFontSize(14);
                        doc.setFont("helvetica", "bold");
                        doc.text("Constancia Fotográfica (Continuación)", margin, 48);
                        y = 55;
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
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
        doc.text("Reporte confidencial - ResQ Hub", margin, doc.internal.pageSize.getHeight() - 10);
    }

    // --- Save the PDF ---
    doc.save(`entrega_${entrega.receptorNombre.replace(/\s/g, '_')}.pdf`);
};
