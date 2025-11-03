// @ts-nocheck
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { UserProfile } from "@/firebase/auth/use-user";
import { drawHeader } from './pdf-header-config';

type VisitaTecnica = {
    id?: string;
    actaNumero: string;
    damnificadoId: string;
    nombreDamnificado: string;
    apellidoDamnificado: string;
    cedulaDamnificado?: string;
    telefonoDamnificado?: string;
    direccion: string;
    barrio?: string;
    ubicacionTipo?: 'urbano' | 'rural';
    tipoEscenario?: string;
    condicionVivienda?: string;
    fichaEdan?: 'si' | 'no' | 'na';
    tipoEvento: string[];
    otro_tipo_evento?: string;
    descripcionRequerimiento: string;
    profesionalAsignado: string;
    fechaVisita: any;
    registroFotografico?: string[];
    firmaProfesional?: string;
    [key: string]: any;
};

const capitalize = (s) => (s && typeof s === 'string' ? s.charAt(0).toUpperCase() + s.slice(1) : '');

export const exportVisitaToPDF = async (visita: VisitaTecnica, userProfile: UserProfile | null) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // --- Header ---
    await drawHeader(doc);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("ACTA DE VISITA TÉCNICA / EMERGENCIA", pageWidth / 2, 48, { align: "center" });
    
    doc.setFontSize(12);
    doc.text(`Acta Nro: ${visita.actaNumero}`, pageWidth / 2, 55, { align: "center" });

    // --- Body ---
    const personalInfo = [
        [{ content: 'Información del Solicitante', colSpan: 4, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }],
        ['Nombre:', `${visita.nombreDamnificado} ${visita.apellidoDamnificado}`, 'Cédula:', visita.cedulaDamnificado || 'N/A'],
        ['Teléfono:', visita.telefonoDamnificado || 'N/A', 'Fecha Visita:', format(new Date(visita.fechaVisita.seconds ? visita.fechaVisita.seconds * 1000 : visita.fechaVisita), 'dd/MM/yyyy')],
    ];

    autoTable(doc, {
        startY: 60,
        body: personalInfo,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 1.5 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 25 },
            2: { fontStyle: 'bold', cellWidth: 25 },
        }
    });
    
    const locationInfo = [
         [{ content: 'Información de Ubicación y Vivienda', colSpan: 4, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }],
        ['Dirección:', visita.direccion, 'Barrio/Vereda:', visita.barrio || 'N/A'],
        ['Ubicación:', capitalize(visita.ubicacionTipo) || 'N/A', 'Tipo Escenario:', visita.tipoEscenario || 'N/A'],
        ['Condición Vivienda:', visita.condicionVivienda || 'N/A', 'Ficha EDAN:', visita.fichaEdan?.toUpperCase() || 'N/A'],
    ];

     autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 2,
        body: locationInfo,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 1.5 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 35 },
            2: { fontStyle: 'bold', cellWidth: 35 },
        }
    });

    const evento = visita.tipoEvento.includes("otro") 
        ? visita.tipoEvento.map(e => e === "otro" ? `Otro: ${visita.otro_tipo_evento}` : capitalize(e.replace(/_/g, ' '))).join(', ')
        : visita.tipoEvento.map(e => capitalize(e.replace(/_/g, ' '))).join(', ');

    const eventInfo = [
        [{ content: 'Información del Evento', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }],
        ['Tipo de Evento:', evento],
        ['Descripción del Requerimiento / Observaciones:', visita.descripcionRequerimiento]
    ];

    autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 2,
        body: eventInfo,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2 },
         columnStyles: {
            0: { cellWidth: 60, fontStyle: 'bold' },
        }
    });
    
    let finalY = (doc as any).lastAutoTable.finalY;

    // --- Signature ---
    if (finalY > 180) { // Check if there's enough space for signature
        doc.addPage();
        finalY = 20;
    }

    const signatureY = finalY + 15;
    const signatureWidth = 80;
    const signatureHeight = 30;

    if (visita.firmaProfesional) {
        try {
            doc.addImage(visita.firmaProfesional, 'PNG', margin, signatureY, signatureWidth, signatureHeight);
        } catch (e) {
            doc.text("Error al cargar firma", margin, signatureY + 10);
        }
    }
    
    doc.line(margin, signatureY + signatureHeight, margin + signatureWidth, signatureY + signatureHeight);
    doc.setFontSize(9);
    doc.text(visita.profesionalAsignado, margin, signatureY + signatureHeight + 5);
    doc.text('Profesional Asignado', margin, signatureY + signatureHeight + 10);
    
    doc.setFontSize(8);
    doc.text(
        `Este documento se firma digitalmente por ${visita.profesionalAsignado} el ${format(new Date(), "dd/MM/yyyy 'a las' HH:mm")}.\nLa integridad de este documento está asegurada.`,
        margin,
        signatureY + signatureHeight + 20
    );


    // --- Photos ---
    if (visita.registroFotografico && visita.registroFotografico.length > 0) {
        doc.addPage();
        await drawHeader(doc);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Registro Fotográfico", margin, 48);
        
        let y = 55;
        const imgWidth = (pageWidth - 3 * margin) / 2;
        
        for (let i = 0; i < visita.registroFotografico.length; i++) {
            const base64Img = visita.registroFotografico[i];
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
                        doc.text("Registro Fotográfico (Continuación)", margin, 48);
                        y = 55;
                    }

                    doc.addImage(base64Img, imgProps.fileType, x, y, imgWidth, imgHeight);
                    
                    if (i % 2 !== 0 || i === visita.registroFotografico.length - 1) {
                        y += imgHeight + 10;
                    }
                } catch (e) {
                    console.error("Error adding image to PDF:", e);
                    doc.text("Error al cargar imagen", x, y);
                    if (i % 2 !== 0 || i === visita.registroFotografico.length - 1) y += 10;
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
    doc.save(`Acta_Visita_${visita.actaNumero}.pdf`);
};
