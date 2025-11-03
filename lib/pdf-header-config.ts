// @ts-nocheck
import jsPDF from "jspdf";

const TEXTO_ENCABEZADO_1 = "ALCALDÍA DE OCAÑA";
const TEXTO_ENCABEZADO_2 = "Consejo Municipal para la Gestión del Riesgo de Desastres";
const TEXTO_ENCABEZADO_3 = "";

const loadImage = (src) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = src;
    });
};

export const drawHeader = async (doc) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    try {
        const logoPrincipal = await loadImage('/logo.png');
        const logoSecundario = await loadImage('/logo_consejo.png');

        const fixedHeight = 18; // Reducido de 20 a 15 para un tamaño más equilibrado

        // Logo de la aplicación (izquierda)
        const logoPrincipalRatio = logoPrincipal.width / logoPrincipal.height;
        const logoPrincipalWidth = fixedHeight * logoPrincipalRatio;
        doc.addImage(logoPrincipal, 'PNG', margin, 10, logoPrincipalWidth, fixedHeight);

        // Logo del Consejo (derecha)
        const logoSecundarioRatio = logoSecundario.width / logoSecundario.height;
        const logoSecundarioWidth = fixedHeight * logoSecundarioRatio;
        doc.addImage(logoSecundario, 'PNG', pageWidth - logoSecundarioWidth - margin, 10, logoSecundarioWidth, fixedHeight);

    } catch (error) {
        console.error("Error al procesar los logos:", error);
    }
    
    // --- Textos del encabezado ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(TEXTO_ENCABEZADO_1, pageWidth / 2, 15, { align: "center" });

    doc.setFontSize(8);
    doc.text(TEXTO_ENCABEZADO_2, pageWidth / 2, 21, { align: "center" });

    doc.setFontSize(11);
    doc.text(TEXTO_ENCABEZADO_3, pageWidth / 2, 27, { align: "center" });
    
    // Línea divisoria
    doc.setDrawColor(0);
    doc.line(margin, 35, pageWidth - margin, 35);
};
