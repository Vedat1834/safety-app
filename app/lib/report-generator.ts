import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Customer, Project, RiskAssessment, FunctionalTest } from "../types";
import { getRiskIndexStatus, RISK_S, RISK_F, RISK_A, RISK_O } from "./hrn-constants";

// Define jsPDF type extension for autotable
interface jsPDFWithAutoTable extends jsPDF {
    lastAutoTable: {
        finalY: number;
    };
}

const getShortSLabel = (val: string, lang: 'tr' | 'en') => {
    if (lang === 'en') {
        if (val === 'S1') return 'Negligible (S1)';
        if (val === 'S2') return 'Minor (S2)';
        if (val === 'S3') return 'Serious (S3)';
        if (val === 'S4') return 'Very Serious (S4)';
        return val || '-';
    }
    if (val === 'S1') return 'İhmal Edilebilir (S1)';
    if (val === 'S2') return 'Hafif (S2)';
    if (val === 'S3') return 'Ciddi (S3)';
    if (val === 'S4') return 'Çok Ciddi (S4)';
    return val || '-';
};

const getShortFLabel = (val: string, lang: 'tr' | 'en') => {
    if (lang === 'en') {
        if (val === 'F0') return 'Prevented (F0)';
        if (val === 'F1') return 'Low (F1)';
        if (val === 'F2') return 'High (F2)';
        if (val === 'NA') return 'N/A';
        return val || '-';
    }
    if (val === 'F0') return 'Engellenmiş (F0)';
    if (val === 'F1') return 'Düşük (F1)';
    if (val === 'F2') return 'Yüksek (F2)';
    if (val === 'NA') return 'N/A';
    return val || '-';
};

const getShortALabel = (val: string, lang: 'tr' | 'en') => {
    if (lang === 'en') {
        if (val === 'A1') return 'Avoidable (A1)';
        if (val === 'A2') return 'Unavoidable (A2)';
        if (val === 'NA') return 'N/A';
        return val || '-';
    }
    if (val === 'A1') return 'Kaçınılabilir (A1)';
    if (val === 'A2') return 'Kaçınılamaz (A2)';
    if (val === 'NA') return 'N/A';
    return val || '-';
};

const getShortOLabel = (val: string, lang: 'tr' | 'en') => {
    if (lang === 'en') {
        if (val === 'O1') return 'Low (O1)';
        if (val === 'O2') return 'Medium (O2)';
        if (val === 'O3') return 'High (O3)';
        if (val === 'NA') return 'N/A';
        return val || '-';
    }
    if (val === 'O1') return 'Düşük (O1)';
    if (val === 'O2') return 'Orta (O2)';
    if (val === 'O3') return 'Yüksek (O3)';
    if (val === 'NA') return 'N/A';
    return val || '-';
};

const getPLFromScore = (score: number): string => {
    if (score === 0) return "a";
    if (score === 1) return "b";
    if (score <= 3) return "c";
    if (score <= 7) return "d";
    return "e";
};

const drawPageBorders = (doc: jsPDF) => {
    // Outer border (thin, black)
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.rect(8, 8, 194, 281, 'D');

    // Inner border (thick, yellow/gold)
    doc.setDrawColor(255, 214, 0);
    doc.setLineWidth(1.2);
    doc.rect(10, 10, 190, 277, 'D');
};

const drawRiskTable = (
    doc: jsPDF,
    startY: number,
    title: string,
    s: string,
    f: string,
    a: string,
    o: string,
    score: number,
    plr: string | null,
    activeFont: string,
    lang: 'tr' | 'en' = 'tr',
    riskHeader: string = "Risk IN",
    plHeader: string = "PLr"
) => {
    // Table Title
    doc.setFont(activeFont, "bold");
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    doc.text(title, 14, startY);
    
    const headers = [[
        lang === 'en' ? "Severity of Hazard" : "Tehlikenin Şiddeti",
        lang === 'en' ? "Exposure" : "Maruz Kalma",
        lang === 'en' ? "Avoidance of Hazard" : "Tehlikeden Kaçınma",
        lang === 'en' ? "Probability of Occurrence" : "Ortaya Çıkma İhtimali",
        riskHeader,
        plHeader
    ]];
    
    const body = [[
        getShortSLabel(s, lang),
        getShortFLabel(f, lang),
        getShortALabel(a, lang),
        getShortOLabel(o, lang),
        score.toString(),
        plr ? plr.toLowerCase() : '-'
    ]];
    
    autoTable(doc, {
        startY: startY + 2,
        head: headers,
        body: body,
        theme: 'grid',
        headStyles: {
            fillColor: [240, 240, 240] as any,
            textColor: [50, 50, 50] as any,
            fontStyle: 'bold' as any,
            fontSize: 7.5,
            halign: 'center' as any,
            valign: 'middle' as any
        },
        styles: {
            font: activeFont,
            fontSize: 7.5,
            cellPadding: 2.5,
            halign: 'center' as any,
            valign: 'middle' as any,
            textColor: [80, 80, 80] as any
        },
        columnStyles: {
            0: { cellWidth: 38 }, // Severity of Hazard
            1: { cellWidth: 30 }, // Exposure
            2: { cellWidth: 30 }, // Avoidance of Hazard
            3: { cellWidth: 34 }, // Probability of Occurrence
            4: { cellWidth: 25, fontStyle: 'bold' as any }, // Risk IN/OUT
            5: { cellWidth: 25, fontStyle: 'bold' as any }  // PLr/PLa
        },
        didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 4) {
                let color = [255, 255, 255]; // Default white
                let textColor = [0, 0, 0];

                if (score === 0) {
                    color = [243, 244, 246]; // Gray 100
                    textColor = [75, 85, 99]; // Gray 600
                } else if (score === 1) {
                    color = [220, 252, 231]; // Green 100
                    textColor = [21, 128, 61]; // Green 700
                } else if (score <= 3) {
                    color = [254, 249, 195]; // Yellow 100
                    textColor = [161, 98, 7]; // Yellow 700
                } else if (score <= 7) {
                    color = [255, 237, 213]; // Orange 100
                    textColor = [194, 65, 12]; // Orange 700
                } else { // 8, 9, 10
                    color = [220, 38, 38]; // Red 600 (Solid Red)
                    textColor = [255, 255, 255]; // White text
                }

                data.cell.styles.fillColor = color as any;
                data.cell.styles.textColor = textColor as any;
            }
        }
    });
};

// Helper: Fetch with timeout to prevent hanging when offline on local Wi-Fi networks
const fetchWithTimeout = async (url: string, timeoutMs = 1200) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        if (!response.ok) throw new Error("Fetch failed");
        return response;
    } catch (err) {
        clearTimeout(id);
        throw err;
    }
};
const getBase64ImageFromUrl = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const compressBase64Image = (base64Str: string, maxDim = 600, quality = 0.6): Promise<string> => {
    return new Promise((resolve) => {
        if (!base64Str || !base64Str.startsWith("data:image")) {
            resolve(base64Str);
            return;
        }
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;

            if (width > maxDim || height > maxDim) {
                if (width > height) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                } else {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                const compressed = canvas.toDataURL("image/jpeg", quality);
                resolve(compressed);
            } else {
                resolve(base64Str);
            }
        };
        img.onerror = () => {
            resolve(base64Str);
        };
    });
};

const getLogoDimensions = (base64Str: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
        if (!base64Str || !base64Str.startsWith("data:image")) {
            resolve({ width: 0, height: 0 });
            return;
        }
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            resolve({ width: img.width, height: img.height });
        };
        img.onerror = () => {
            resolve({ width: 0, height: 0 });
        };
    });
};

export const generatePDF = async (
    project: Project,
    customer: Customer,
    riskAssessments: RiskAssessment[],
    functionalTests: FunctionalTest[],
    lang: 'tr' | 'en' = 'tr'
) => {
    // Pre-compress all images in risk assessments to optimize PDF size
    const optimizedRiskAssessments = await Promise.all(
        riskAssessments.map(async (risk) => {
            const optAnnotated = risk.annotated_image 
                ? await compressBase64Image(risk.annotated_image, 600, 0.6) 
                : undefined;
            
            const optMeasures = risk.measure_images 
                ? await Promise.all(risk.measure_images.map(img => compressBase64Image(img, 600, 0.6)))
                : undefined;
            
            return {
                ...risk,
                annotated_image: optAnnotated,
                measure_images: optMeasures
            };
        })
    );

    const doc = new jsPDF() as jsPDFWithAutoTable;
    let activeFont = "Helvetica"; // Default fallback font

    // Local helper to translate standard hazard types in report structure
    const getHazardTypeLabel = (val: string, l: 'tr' | 'en') => {
        if (l === 'en') {
            if (val === 'Mekanik') return 'Mechanical';
            if (val === 'Elektriksel') return 'Electrical';
            if (val === 'Termal') return 'Thermal';
            if (val === 'Gürültü') return 'Noise';
            if (val === 'Titreşim') return 'Vibration';
            if (val === 'Kimyasal') return 'Chemical';
            if (val === 'Ergonomik') return 'Ergonomic';
        }
        return val;
    };

    // Load Turkish-compatible fonts (Regular & Bold) if online
    if (typeof window !== "undefined" && navigator.onLine) {
        try {
            const fontBase = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/';

            const [regBuffer, boldBuffer] = await Promise.all([
                fetchWithTimeout(fontBase + 'Roboto-Regular.ttf', 1200).then(res => res.arrayBuffer()),
                fetchWithTimeout(fontBase + 'Roboto-Medium.ttf', 1200).then(res => res.arrayBuffer())
            ]);

            const addFontToDoc = (buffer: ArrayBuffer, fileName: string, fontStyle: string) => {
                const binaryString = Array.from(new Uint8Array(buffer), (byte) => String.fromCharCode(byte)).join("");
                doc.addFileToVFS(fileName, binaryString);
                doc.addFont(fileName, "Roboto", fontStyle);
            };

            addFontToDoc(regBuffer, "Roboto-Regular.ttf", "normal");
            addFontToDoc(boldBuffer, "Roboto-Medium.ttf", "bold");

            activeFont = "Roboto";
        } catch (e) {
            console.error("Font loading failed, falling back to default. Turkish characters may be broken.", e);
            activeFont = "Helvetica";
        }
    }

    doc.setFont(activeFont);

    // --- Title Page ---
    // Load Company Logo
    let companyLogoBase64: string | null = null;
    try {
        companyLogoBase64 = await getBase64ImageFromUrl("/logo_koru.jpg");
    } catch (e) {
        console.error("Failed to load company logo:", e);
    }

    // Load Cover Image
    let coverImageBase64: string | null = null;
    try {
        coverImageBase64 = await getBase64ImageFromUrl("/cover_safety.png");
    } catch (e) {
        console.error("Failed to load cover image:", e);
    }

    // Draw borders
    drawPageBorders(doc);

    // Draw logos (Company logo remains at top center)
    if (companyLogoBase64) {
        try {
            doc.addImage(companyLogoBase64, "JPEG", 85, 15, 40, 18);
        } catch (err) {
            console.error("Error drawing company logo on PDF:", err);
        }
    }

    doc.setFont(activeFont, "bold");
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0);
    doc.text(
        lang === 'en' ? "MACHINERY SAFETY RISK ASSESSMENT REPORT" : "MAKİNE EMNİYETİ RİSK DEĞERLENDİRME RAPORU", 
        105, 45, { align: "center" }
    );

    doc.setFont(activeFont, "normal");
    doc.setFontSize(13);
    doc.setTextColor(80, 80, 80);
    doc.text("According to 2006/42/EC", 105, 52, { align: "center" });

    // Draw cover image
    if (coverImageBase64) {
        try {
            doc.addImage(coverImageBase64, "PNG", 30, 58, 150, 90);
        } catch (err) {
            console.error("Error drawing cover image on PDF:", err);
        }
    }

    // Draw customer logo below cover image
    if (customer.logo_url) {
        try {
            let format = "PNG";
            if (customer.logo_url.includes("image/jpeg") || customer.logo_url.includes("image/jpg")) {
                format = "JPEG";
            } else if (customer.logo_url.includes("image/webp")) {
                format = "WEBP";
            }
            
            // Calculate proportional dimensions inside a 50x20 bounding box
            const dims = await getLogoDimensions(customer.logo_url);
            let logoW = 50;
            let logoH = 20;
            if (dims.width > 0 && dims.height > 0) {
                const ratio = dims.width / dims.height;
                const boxRatio = 50 / 20;
                if (ratio > boxRatio) {
                    logoW = 50;
                    logoH = 50 / ratio;
                } else {
                    logoH = 20;
                    logoW = 20 * ratio;
                }
            }
            
            // Center the logo horizontally and vertically in the bounding box
            const logoX = 105 - (logoW / 2);
            const logoY = 150 + ((20 - logoH) / 2);
            
            doc.addImage(customer.logo_url, format, logoX, logoY, logoW, logoH);
        } catch (err) {
            console.error("Error drawing customer logo below photo:", err);
        }
    }

    // Reset colors
    doc.setTextColor(0, 0, 0);

    // Table 1: Rapor Bilgileri
    autoTable(doc, {
        startY: 178,
        margin: { left: 20, right: 20, bottom: 12 },
        theme: 'grid',
        head: [[
            { 
                content: lang === 'en' ? 'Report Information' : 'Rapor Bilgileri', 
                colSpan: 4, 
                styles: { halign: 'center', fillColor: [240, 240, 240], fontStyle: 'bold', textColor: [0, 0, 0], fontSize: 10 } 
            }
        ]],
        body: [
            [
                { content: lang === 'en' ? 'Company Name' : 'Firma Adı', styles: { fontStyle: 'bold', fillColor: [250, 250, 250], cellWidth: 35 } },
                { content: customer.name },
                { content: lang === 'en' ? 'Project No' : 'Proje No', styles: { fontStyle: 'bold', fillColor: [250, 250, 250], cellWidth: 30 } },
                { content: project.project_no }
            ],
            [
                { content: lang === 'en' ? 'Machine Name / Model' : 'Makine Adı / Modeli', styles: { fontStyle: 'bold', fillColor: [250, 250, 250], cellWidth: 35 } },
                { content: project.name },
                { content: lang === 'en' ? 'Report Date' : 'Rapor Tarihi', styles: { fontStyle: 'bold', fillColor: [250, 250, 250], cellWidth: 30 } },
                { content: new Date(project.report_date).toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR') }
            ]
        ],
        styles: {
            font: activeFont,
            fontSize: 9.5,
            cellPadding: 3.0,
            valign: 'middle'
        }
    });

    // Table 2: Rapor Kontrol
    autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 6,
        margin: { left: 20, right: 20, bottom: 12 },
        theme: 'grid',
        head: [[
            { 
                content: lang === 'en' ? 'Report Control' : 'Rapor Kontrol', 
                colSpan: 4, 
                styles: { halign: 'center', fillColor: [240, 240, 240], fontStyle: 'bold', textColor: [0, 0, 0], fontSize: 10 } 
            }
        ]],
        body: [
            [
                { content: lang === 'en' ? 'Prepared By' : 'Hazırlayan', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', fillColor: [250, 250, 250] } },
                { content: lang === 'en' ? 'Controlled / Approved By' : 'Kontrol Eden / Onaylayan', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', fillColor: [250, 250, 250] } }
            ],
            [
                { content: lang === 'en' ? 'Name Surname / Title' : 'Adı Soyadı / Unvanı', styles: { fontStyle: 'bold', fillColor: [250, 250, 250], cellWidth: 35 } },
                { content: project.author_name || '-' },
                { content: lang === 'en' ? 'Name Surname / Title' : 'Adı Soyadı / Unvanı', styles: { fontStyle: 'bold', fillColor: [250, 250, 250], cellWidth: 35 } },
                { content: project.approver_name || '-' }
            ],
            [
                { content: lang === 'en' ? 'Date' : 'Tarih', styles: { fontStyle: 'bold', fillColor: [250, 250, 250] } },
                { content: new Date(project.report_date).toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR') },
                { content: lang === 'en' ? 'Date' : 'Tarih', styles: { fontStyle: 'bold', fillColor: [250, 250, 250] } },
                { content: new Date(project.report_date).toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR') }
            ],
            [
                { content: lang === 'en' ? 'Signature' : 'İmza', styles: { fontStyle: 'bold', fillColor: [250, 250, 250] } },
                { content: '' },
                { content: lang === 'en' ? 'Signature' : 'İmza', styles: { fontStyle: 'bold', fillColor: [250, 250, 250] } },
                { content: '' }
            ]
        ],
        styles: {
            font: activeFont,
            fontSize: 9.5,
            cellPadding: 3.0,
            valign: 'middle'
        }
    });

    // Rapor Numarası
    doc.setFont(activeFont, "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`${lang === 'en' ? 'Report Number' : 'Rapor Numarası'}: ${project.project_no}`, 190, 283, { align: "right" });

    // --- Table of Contents (İçindekiler) Page ---
    doc.addPage();

    // Title
    doc.setFont(activeFont, "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(lang === 'en' ? "TABLE OF CONTENTS" : "İÇİNDEKİLER", 105, 20, { align: "center" });

    // A thin separator line under title
    doc.setDrawColor(255, 214, 0); // Gold
    doc.setLineWidth(0.8);
    doc.line(20, 24, 190, 24);

    // Brief Introduction / About Report
    doc.setFont(activeFont, "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(80, 80, 80);
    const introText = lang === 'en'
        ? "This report includes the machinery safety risk assessment and verification of safety functions performed according to 2006/42/EC. The sections and page numbers included in the report are listed below."
        : "Bu rapor, 2006/42/EC'ye göre gerçekleştirilen makine emniyeti risk değerlendirmesini ve emniyet fonksiyonlarının doğrulanmasını içermektedir. Aşağıda raporda yer alan bölümler ve sayfa numaraları listelenmiştir.";
    const splitIntro = doc.splitTextToSize(introText, 170);
    doc.text(splitIntro, 20, 32);

    // List of contents
    let currentTocY = 48;
    const tocItems: { label: string; pageNum: number; isSubItem?: boolean }[] = [];

    tocItems.push({ label: lang === 'en' ? "1. Introduction & About Report" : "1. Giriş ve Rapor Hakkında", pageNum: 2 });
    tocItems.push({ label: lang === 'en' ? "2. Risk Assessment Methodology" : "2. Risk Değerlendirme Metodolojisi", pageNum: 3 });
    tocItems.push({ label: lang === 'en' ? "3. Risk Assessments" : "3. Risk Değerlendirmeleri", pageNum: 4 });

    optimizedRiskAssessments.forEach((risk, idx) => {
        const riskId = `RISK ${String(idx + 1).padStart(3, '0')}`;
        tocItems.push({
            label: `${riskId} - ${risk.hazard_zone} (${getHazardTypeLabel(risk.hazard_type || '', lang)})`,
            pageNum: 4 + idx,
            isSubItem: true
        });
    });

    const nextSectionPage = 4 + optimizedRiskAssessments.length;
    let finalPageNum = nextSectionPage;

    if (functionalTests.length > 0) {
        tocItems.push({ 
            label: lang === 'en' ? "4. Safety Functions Verification and Test Report" : "4. Emniyet Fonksiyonları Doğrulama ve Test Raporu", 
            pageNum: nextSectionPage 
        });
        finalPageNum = nextSectionPage + 1;
    }

    tocItems.push({ 
        label: `${functionalTests.length > 0 ? "5" : "4"}. ${lang === 'en' ? "Conclusion & Recommendations" : "Sonuç ve Öneriler"}`, 
        pageNum: finalPageNum 
    });

    // Draw TOC list
    tocItems.forEach((item) => {
        doc.setFont(activeFont, item.isSubItem ? "normal" : "bold");
        doc.setFontSize(item.isSubItem ? 8.5 : 10);
        doc.setTextColor(item.isSubItem ? 100 : 0);

        const labelX = item.isSubItem ? 28 : 20;
        doc.text(item.label, labelX, currentTocY);

        // Dot leaders
        doc.setFont(activeFont, "normal");
        doc.setTextColor(180, 180, 180);
        const dotsStartX = labelX + doc.getTextWidth(item.label) + 2;
        const dotsEndX = 178;
        if (dotsStartX < dotsEndX) {
            let dots = "";
            const dotWidth = doc.getTextWidth(".");
            const distance = dotsEndX - dotsStartX;
            const dotCount = Math.floor(distance / dotWidth);
            for (let d = 0; d < dotCount; d++) dots += ".";
            doc.text(dots, dotsStartX, currentTocY);
        }

        // Page Number
        doc.setFont(activeFont, "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(item.pageNum.toString(), 185, currentTocY, { align: "right" });

        currentTocY += item.isSubItem ? 6 : 8;
    });

    // --- Risk Assessment Methodology Page ---
    doc.addPage();

    // Title
    doc.setFont(activeFont, "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(lang === 'en' ? "RISK ASSESSMENT METHODOLOGY" : "RİSK DEĞERLENDİRME METODOLOJİSİ", 105, 20, { align: "center" });

    // Separator Line
    doc.setDrawColor(255, 214, 0); // Gold
    doc.setLineWidth(0.8);
    doc.line(20, 24, 190, 24);

    // Intro text
    doc.setFont(activeFont, "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(80, 80, 80);
    const methodIntro = lang === 'en'
        ? "The risk assessments in this report have been carried out using the Hybrid Risk Number (HRN) methodology designed according to 2006/42/EC. The parameters and index classifications used in the assessment are specified below:"
        : "Bu rapordaki risk değerlendirmeleri, 2006/42/EC'ye göre tasarlanmış Hibrit Risk Endeksi (HRN) metodolojisi kullanılarak gerçekleştirilmiştir. Değerlendirmede kullanılan parametreler ve indeks sınıflandırmaları aşağıda belirtilmiştir:";
    const splitMethodIntro = doc.splitTextToSize(methodIntro, 170);
    doc.text(splitMethodIntro, 20, 32);

    // Parameters Table
    autoTable(doc, {
        startY: 45,
        margin: { left: 20, right: 20 },
        theme: 'grid',
        head: [[
            { 
                content: lang === 'en' ? 'Risk Assessment Parameters' : 'Risk Değerlendirme Parametreleri', 
                colSpan: 2, 
                styles: { halign: 'center', fillColor: [240, 240, 240], fontStyle: 'bold', textColor: [0, 0, 0], fontSize: 9.5 } 
            }
        ]],
        body: [
            [
                { content: lang === 'en' ? 'Severity of Hazard (S)' : 'Tehlikenin Şiddeti (S)', styles: { fontStyle: 'bold', cellWidth: 50, fillColor: [250, 250, 250] } },
                lang === 'en'
                    ? 'S1: Negligible (First aid level scratch/bruise)\nS2: Minor Injury (Simple cut/bruise requiring medical attention)\nS3: Serious Injury (Irreversible minor limb loss, severe fracture)\nS4: Very Serious Injury (Limb loss, fatal injury)'
                    : 'S1: İhmal Edilebilir (İlkyardım seviyesi sıyrık/morluk)\nS2: Hafif Yaralanma (Tıbbi müdahale gerektiren basit kesik/ezik)\nS3: Ciddi Yaralanma (Geri dönüşü olmayan hafif uzuv kaybı, ciddi kırık)\nS4: Çok Ciddi Yaralanma (Uzuv kaybı, ölümcül yaralanma)'
            ],
            [
                { content: lang === 'en' ? 'Frequency of Exposure (F)' : 'Maruz Kalma Sıklığı (F)', styles: { fontStyle: 'bold', cellWidth: 50, fillColor: [250, 250, 250] } },
                lang === 'en'
                    ? 'F0: Prevented (Access completely closed by design)\nF1: Low Frequency (Exposure <= 2 times per shift and duration < 15 mins)\nF2: High Frequency (Exposure > 2 times per shift or duration > 15 mins)'
                    : 'F0: Engellenmiş (Tasarımla erişim tamamen kapatılmış)\nF1: Düşük Sıklık (Vardiyada <= 2 kez maruziyet ve süre < 15 dk)\nF2: Yüksek Sıklık (Vardiyada > 2 kez maruziyet veya süre > 15 dk)'
            ],
            [
                { content: lang === 'en' ? 'Avoidance of Hazard (A)' : 'Tehlikeden Kaçınma (A)', styles: { fontStyle: 'bold', cellWidth: 50, fillColor: [250, 250, 250] } },
                lang === 'en'
                    ? 'A1: Avoidable (Trained operator, slow movements, wide area)\nA2: Unavoidable (Fast movements, narrow space, no escape path)'
                    : 'A1: Kaçınılabilir (Eğitimli operatör, yavaş hareketler, geniş alan)\nA2: Kaçınılamaz (Hızlı hareketler, dar alan, kaçış yolu yok)'
            ],
            [
                { content: lang === 'en' ? 'Probability of Occurrence (O)' : 'Ortaya Çıkma İhtimali (O)', styles: { fontStyle: 'bold', cellWidth: 50, fillColor: [250, 250, 250] } },
                lang === 'en'
                    ? 'O1: Low Probability (Unsafe condition/failure rarely occurs)\nO2: Medium Probability (Unsafe condition/failure is predictable)\nO3: High Probability (Unsafe condition/failure is almost inevitable)'
                    : 'O1: Düşük Olasılık (Güvensiz durum/arıza nadiren gerçekleşir)\nO2: Orta Olasılık (Güvensiz durum/arıza gerçekleşmesi öngörülebilir)\nO3: Yüksek Olasılık (Güvensiz durum/arıza neredeyse kaçınılmazdır)'
            ]
        ],
        styles: {
            font: activeFont,
            fontSize: 8,
            cellPadding: 3,
            valign: 'middle'
        }
    });

    // Risk Index Classification Table
    autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 6,
        margin: { left: 20, right: 20 },
        theme: 'grid',
        head: [[
            { 
                content: lang === 'en' ? 'Risk Index Classification' : 'Risk İndeksi Sınıflandırması', 
                colSpan: 3, 
                styles: { halign: 'center', fillColor: [240, 240, 240], fontStyle: 'bold', textColor: [0, 0, 0], fontSize: 9.5 } 
            }
        ]],
        body: [
            [
                { content: lang === 'en' ? 'Index Value' : 'İndeks Değeri', styles: { fontStyle: 'bold', fillColor: [250, 250, 250], halign: 'center', cellWidth: 35 } },
                { content: lang === 'en' ? 'Risk Level Class' : 'Risk Düzeyi Sınıfı', styles: { fontStyle: 'bold', fillColor: [250, 250, 250], halign: 'center', cellWidth: 50 } },
                { content: lang === 'en' ? 'Description / Action Requirement' : 'Açıklama / Eylem Gereksinimi', styles: { fontStyle: 'bold', fillColor: [250, 250, 250], halign: 'center' } }
            ],
            [
                { content: '0', styles: { halign: 'center', fontStyle: 'bold' } },
                lang === 'en' ? 'Negligible' : 'İhmal Edilebilir',
                lang === 'en' ? 'No additional action is required. Acceptable risk. (PL a)' : 'Herhangi bir ek önleme gerek yoktur. Kabul edilebilir risk. (PL a)'
            ],
            [
                { content: '1', styles: { halign: 'center', fontStyle: 'bold' } },
                lang === 'en' ? 'Very Low Risk' : 'Çok Düşük Risk',
                lang === 'en' ? 'No safety function is required, design or administrative measures are sufficient. (PL b)' : 'Emniyet fonksiyonu gerekmez, tasarım veya idari önlemler yeterlidir. (PL b)'
            ],
            [
                { content: '2 - 3', styles: { halign: 'center', fontStyle: 'bold' } },
                lang === 'en' ? 'Low Risk' : 'Düşük Risk',
                lang === 'en' ? 'Safety function (PL c) or administrative/warning sign measures are recommended.' : 'Emniyet fonksiyonu (PL c) veya idari/uyarı levhası önlemleri önerilir.'
            ],
            [
                { content: '4 - 7', styles: { halign: 'center', fontStyle: 'bold' } },
                lang === 'en' ? 'High Risk' : 'Yüksek Risk',
                lang === 'en' ? 'Engineering measures and safety function (PL d) are mandatory.' : 'Mühendislik önlemleri ve emniyet fonksiyonu (PL d) zorunludur.'
            ],
            [
                { content: '8 - 10', styles: { halign: 'center', fontStyle: 'bold' } },
                lang === 'en' ? 'Very High Risk' : 'Çok Yüksek Risk',
                lang === 'en' ? 'Unacceptable risk. Immediate safety measures and high reliability safety function (PL e) are mandatory.' : 'Kabul edilemez risk. Acil emniyet tedbirleri ve yüksek güvenilirlikli emniyet fonksiyonu (PL e) zorunludur.'
            ]
        ],
        styles: {
            font: activeFont,
            fontSize: 8,
            cellPadding: 3,
            valign: 'middle'
        },
        didParseCell: (data) => {
            if (data.section === 'body' && data.row.index >= 1) {
                const rowIndex = data.row.index;
                let color = [255, 255, 255];
                let textColor = [0, 0, 0];
                
                if (rowIndex === 1) { // 0
                    color = [243, 244, 246]; // Gray 100
                    textColor = [75, 85, 99]; // Gray 600
                } else if (rowIndex === 2) { // 1
                    color = [220, 252, 231]; // Green 100
                    textColor = [21, 128, 61]; // Green 700
                } else if (rowIndex === 3) { // 2-3
                    color = [254, 249, 195]; // Yellow 100
                    textColor = [161, 98, 7]; // Yellow 700
                } else if (rowIndex === 4) { // 4-7
                    color = [255, 237, 213]; // Orange 100
                    textColor = [194, 65, 12]; // Orange 700
                } else if (rowIndex === 5) { // 8-10
                    color = [220, 38, 38]; // Red 600 (Solid Red)
                    textColor = [255, 255, 255]; // White text
                }
                
                if (data.column.index === 0 || data.column.index === 1) {
                    data.cell.styles.fillColor = color as any;
                    data.cell.styles.textColor = textColor as any;
                    if (data.column.index === 1) {
                        data.cell.styles.fontStyle = 'bold' as any;
                    }
                }
            }
        }
    });

    // --- Risk Assessments Loop (One Risk Per Page) ---
    for (let i = 0; i < optimizedRiskAssessments.length; i++) {
        const risk = optimizedRiskAssessments[i];
        const riskId = `RISK ${String(i + 1).padStart(3, '0')}`;

        doc.addPage();

        // --- Header Bar for Risk Page ---
        doc.setFillColor(41, 128, 185); // Blue header
        doc.rect(14, 15, 182, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont(activeFont, "bold");
        doc.text(riskId, 18, 21.5);
        doc.setFont(activeFont, "normal"); // Reset

        // Use multiple autoTables for a much cleaner layout aligning with standard tabular risk models
        // Table 1: TEHLİKE TANIMI VE GÖRSELİ
        autoTable(doc, {
            startY: 28,
            theme: 'grid',
            head: [[
                {
                    content: lang === 'en' ? 'HAZARD DEFINITION AND IMAGE' : 'TEHLİKE TANIMI VE GÖRSELİ',
                    colSpan: 2,
                    styles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: [50, 50, 50] }
                }
            ]],
            body: [
                [
                    {
                        content: '', // Image placeholder
                        styles: { minCellHeight: 45, cellWidth: 70 }
                    },
                    {
                        content: '', // Description placeholder
                        styles: { cellWidth: 'auto' }
                    }
                ]
            ],
            styles: {
                font: activeFont,
                fontSize: 8.5,
                lineColor: [200, 200, 200],
                lineWidth: 0.1,
                cellPadding: 2
            },
            didDrawCell: (data) => {
                // Hazard Details Text (Row 0, Col 1)
                if (data.section === 'body' && data.row.index === 0 && data.column.index === 1) {
                    const startX = data.cell.x + 3;
                    let currentY = data.cell.y + 6;
                    const endX = data.cell.x + data.cell.width - 3;

                    // Tehlike Bölgesi
                    doc.setFont(activeFont, "bold");
                    doc.setFontSize(9);
                    doc.text(lang === 'en' ? "Hazard Zone:" : "Tehlike Bölgesi:", startX, currentY);
                    const labelWidth1 = doc.getTextWidth(lang === 'en' ? "Hazard Zone: " : "Tehlike Bölgesi: ");

                    doc.setFont(activeFont, "normal");
                    doc.text(risk.hazard_zone || '-', startX + labelWidth1 + 1, currentY);

                    // Line Separator
                    currentY += 3;
                    doc.setDrawColor(220, 220, 220);
                    doc.setLineWidth(0.1);
                    doc.line(startX, currentY, endX, currentY);
                    currentY += 5; // spacing after line

                    // Tehlike Tanımı
                    doc.setFont(activeFont, "bold");
                    doc.text(lang === 'en' ? "Hazard Definition:" : "Tehlike Tanımı:", startX, currentY);
                    const labelWidth2 = doc.getTextWidth(lang === 'en' ? "Hazard Definition: " : "Tehlike Tanımı: ");

                    doc.setFont(activeFont, "normal");
                    doc.text(getHazardTypeLabel(risk.hazard_type || '-', lang), startX + labelWidth2 + 1, currentY);

                    // Line Separator
                    currentY += 3;
                    doc.line(startX, currentY, endX, currentY);
                    currentY += 5;

                    // Açıklama
                    doc.setFont(activeFont, "bold");
                    doc.text(lang === 'en' ? "Description:" : "Açıklama:", startX, currentY);

                    currentY += 5;
                    doc.setFont(activeFont, "normal");

                    // Split description text
                    const descWidth = data.cell.width - 6;
                    const splitDesc = doc.splitTextToSize(risk.hazard_description || '-', descWidth);
                    doc.text(splitDesc, startX, currentY);
                }

                // Hazard Image (Row 0, Col 0)
                if (data.section === 'body' && data.row.index === 0 && data.column.index === 0) {
                    if (risk.annotated_image) {
                        try {
                            const pad = 2;
                            doc.addImage(
                                risk.annotated_image,
                                'JPEG',
                                data.cell.x + pad,
                                data.cell.y + pad,
                                data.cell.width - (pad * 2),
                                data.cell.height - (pad * 2)
                            );
                        } catch (err) { }
                    } else {
                        doc.setFontSize(8);
                        doc.text(lang === 'en' ? "No Image" : "Görsel Yok", data.cell.x + 5, data.cell.y + 10);
                    }
                }
            }
        });

        let nextY = doc.lastAutoTable.finalY + 6;

        // Table 2: MEVCUT RİSK DEĞERLENDİRMESİ
        drawRiskTable(
            doc,
            nextY,
            lang === 'en' ? "CURRENT RISK ASSESSMENT" : "MEVCUT RİSK DEĞERLENDİRMESİ",
            risk.before_s,
            risk.before_f,
            risk.before_a,
            risk.before_o,
            risk.risk_score,
            risk.safety_function_required ? (risk.plr_result || null) : null,
            activeFont,
            lang
        );

        nextY = doc.lastAutoTable.finalY + 6;

        // Table 3: ALINMASI GEREKEN ÖNLEMLER
        let measuresText = risk.measures || [
            risk.measures_design && `[Tasarım Önlemi]: ${risk.measures_design}`,
            risk.measures_engineering && `[Mühendislik Önlemi]: ${risk.measures_engineering}`,
            risk.measures_administrative && `[İdari Önlem]: ${risk.measures_administrative}`
        ].filter(Boolean).join('\n\n') || '-';

        if (lang === 'en') {
            measuresText = measuresText
                .replaceAll('[Tasarım Önlemi]:', '[Design Measure]:')
                .replaceAll('[Mühendislik Önlemi]:', '[Engineering Measure]:')
                .replaceAll('[İdari Önlem]:', '[Administrative Measure]:');
        }

        autoTable(doc, {
            startY: nextY,
            theme: 'grid',
            head: [[
                {
                    content: lang === 'en' ? 'RECOMMENDED MEASURES' : 'ALINMASI GEREKEN ÖNLEMLER',
                    styles: { fillColor: [240, 240, 240] as any, fontStyle: 'bold' as any, textColor: [50, 50, 50] as any }
                }
            ]],
            body: [
                [measuresText]
            ],
            styles: {
                font: activeFont,
                fontSize: 8,
                lineColor: [200, 200, 200],
                lineWidth: 0.1,
                cellPadding: 3
            }
        });

        nextY = doc.lastAutoTable.finalY + 5;

        // Table 3.5: İLGİLİ STANDARTLAR
        autoTable(doc, {
            startY: nextY,
            theme: 'grid',
            head: [[
                {
                    content: lang === 'en' ? 'RELATED STANDARDS' : 'İLGİLİ STANDARTLAR',
                    styles: { fillColor: [240, 240, 240] as any, fontStyle: 'bold' as any, textColor: [50, 50, 50] as any }
                }
            ]],
            body: [
                [risk.standards && risk.standards.length > 0 ? risk.standards.join(', ') : '-']
            ],
            styles: {
                font: activeFont,
                fontSize: 8,
                lineColor: [200, 200, 200],
                lineWidth: 0.1,
                cellPadding: 3,
                textColor: [80, 80, 80] as any
            }
        });

        nextY = doc.lastAutoTable.finalY + 5;

        // Table 4: HEDEFLENEN RİSK DEĞERLENDİRMESİ
        drawRiskTable(
            doc,
            nextY,
            lang === 'en' ? "TARGET RISK ASSESSMENT" : "HEDEFLENEN RİSK DEĞERLENDİRMESİ",
            risk.after_s || 'S1',
            risk.after_f || 'NA',
            risk.after_a || 'NA',
            risk.after_o || 'NA',
            risk.after_risk_score !== undefined ? risk.after_risk_score : 0,
            risk.safety_function_required ? getPLFromScore(risk.after_risk_score !== undefined ? risk.after_risk_score : 0) : null,
            activeFont,
            lang,
            "Risk OUT",
            "PLa"
        );

        nextY = doc.lastAutoTable.finalY + 5;

        // Table 5: UYGULAMA GÖRSELLERİ
        autoTable(doc, {
            startY: nextY,
            theme: 'grid',
            head: [[
                {
                    content: lang === 'en' ? 'APPLICATION IMAGES' : 'UYGULAMA GÖRSELLERİ',
                    styles: { fillColor: [240, 240, 240] as any, fontStyle: 'bold' as any, textColor: [50, 50, 50] as any }
                }
            ]],
            body: [
                [''] // Placeholder for images
            ],
            styles: {
                font: activeFont,
                fontSize: 8.5,
                lineColor: [200, 200, 200],
                lineWidth: 0.1,
                cellPadding: 3
            },
            bodyStyles: {
                minCellHeight: 38
            },
            didDrawCell: (data) => {
                if (data.section === 'body' && data.row.index === 0 && data.column.index === 0) {
                    if (risk.measure_images && risk.measure_images.length > 0) {
                        try {
                            const pad = 3;
                            const spacing = 5;
                            const imgW = 55;
                            const imgH = 32; // slightly reduced height to prevent layout overflows

                            let currentX = data.cell.x + pad;
                            const currentY = data.cell.y + pad;

                            risk.measure_images.forEach((img) => {
                                if (currentX + imgW <= data.cell.x + data.cell.width) {
                                    doc.addImage(img, 'JPEG', currentX, currentY, imgW, imgH);
                                    currentX += imgW + spacing;
                                }
                            });
                        } catch (err) { }
                    } else {
                        doc.setFontSize(8);
                        doc.text(lang === 'en' ? "No Image" : "Görsel Yok", data.cell.x + 5, data.cell.y + 10);
                    }
                }
            }
        });
    }

    if (functionalTests.length > 0) {
        doc.addPage();
        
        // Header for Functional Tests Section
        doc.setFont(activeFont, "bold");
        doc.setFontSize(16);
        doc.text(
            lang === 'en' ? "SAFETY FUNCTIONS VERIFICATION AND TEST REPORT" : "EMNİYET FONKSİYONLARI DOĞRULAMA VE TEST RAPORU", 
            105, 20, { align: "center" }
        );
        doc.setFontSize(10);
        doc.setFont(activeFont, "normal");
        doc.text(
            lang === 'en' 
                ? "Functional tests performed according to 2006/42/EC are summarized below." 
                : "2006/42/EC'ye göre gerçekleştirilen fonksiyonel testler aşağıda özetlenmiştir.", 
            105, 26, { align: "center" }
        );

        // Build Table Columns and Rows
        const headers = [[
            lang === 'en' ? "Safety Function" : "Emniyet Fonksiyonu", 
            lang === 'en' ? "Test Method / Description" : "Test Metodu / Açıklama", 
            "PLr", 
            "PL", 
            lang === 'en' ? "Result" : "Sonuç", 
            lang === 'en' ? "Notes" : "Notlar"
        ]];
        const body = functionalTests.map(t => [
            t.name,
            t.description || "-",
            `PLr ${t.plr_required.toLowerCase()}`,
            `PL ${t.pl_achieved.toLowerCase()}`,
            t.result === 'Pass' 
                ? (lang === 'en' ? 'PASS' : 'UYGUN (Pass)') 
                : (lang === 'en' ? 'FAIL' : 'UYGUN DEĞİL (Fail)'),
            t.notes || "-"
        ]);

        autoTable(doc, {
            startY: 32,
            head: headers,
            body: body,
            theme: 'grid',
            headStyles: {
                fillColor: [255, 214, 0] as any, // Safety App Yellow (#FFD600)
                textColor: [0, 0, 0] as any,
                fontStyle: 'bold' as any,
                fontSize: 9
            },
            styles: {
                font: activeFont,
                fontSize: 8,
                cellPadding: 3,
                valign: 'middle' as any
            },
            columnStyles: {
                0: { fontStyle: 'bold' as any, cellWidth: 40 }, // Function name
                1: { cellWidth: 60 }, // Methodology
                2: { halign: 'center' as any, fontStyle: 'bold' as any, cellWidth: 15 }, // PLr
                3: { halign: 'center' as any, fontStyle: 'bold' as any, cellWidth: 15 }, // PL
                4: { halign: 'center' as any, fontStyle: 'bold' as any, cellWidth: 25 }, // Result
                5: { cellWidth: 35 } // Notes
            },
            didParseCell: (data) => {
                // Colorize Result Column (column index 4)
                if (data.section === 'body' && data.column.index === 4) {
                    const text = data.cell.text[0];
                    if (text && (text.includes('UYGUN (Pass)') || text === 'PASS')) {
                        data.cell.styles.textColor = [21, 128, 61] as any; // text-green-700
                        data.cell.styles.fillColor = [240, 253, 244] as any; // bg-green-50
                    } else if (text && (text.includes('UYGUN DEĞİL') || text === 'FAIL')) {
                        data.cell.styles.textColor = [185, 28, 28] as any; // text-red-700
                        data.cell.styles.fillColor = [254, 242, 242] as any; // bg-red-50
                    }
                }
                // Highlight Achieved PL comparison if insufficient
                if (data.section === 'body' && data.column.index === 3) {
                    const rowIndex = data.row.index;
                    const test = functionalTests[rowIndex];
                    if (test) {
                        const isSufficient = test.pl_achieved.charCodeAt(0) >= test.plr_required.charCodeAt(0);
                        if (!isSufficient) {
                            data.cell.styles.textColor = [217, 119, 6] as any; // text-amber-600
                        }
                    }
                }
            }
        });
    }

    // --- Sonuç ve Öneriler Page ---
    doc.addPage();

    // Title
    doc.setFont(activeFont, "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(lang === 'en' ? "CONCLUSION AND RECOMMENDATIONS" : "SONUÇ VE ÖNERİLER", 105, 20, { align: "center" });

    // A thin separator line under title
    doc.setDrawColor(255, 214, 0); // Gold
    doc.setLineWidth(0.8);
    doc.line(20, 24, 190, 24);

    // Section 1: Genel Değerlendirme
    doc.setFont(activeFont, "bold");
    doc.setFontSize(11);
    doc.setTextColor(41, 128, 185); // Blue
    doc.text(lang === 'en' ? "1. General Evaluation" : "1. Genel Değerlendirme", 20, 33);

    doc.setFont(activeFont, "normal");
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    const conclusionIntro = lang === 'en'
        ? `In this report, the results of the risk assessment and verification of safety functions performed on the ${project.name} machine are presented. As a result of the inspections, a total of ${optimizedRiskAssessments.length} hazards were identified, and necessary technical and administrative measures for these hazards were determined.`
        : `Bu raporda, ${project.name} makinesi üzerinde gerçekleştirilen risk değerlendirmesi ve emniyet fonksiyonlarının doğrulanması sonuçları sunulmuştur. Yapılan incelemeler sonucunda toplam ${optimizedRiskAssessments.length} adet tehlike tanımlanmış ve bu tehlikelere yönelik gerekli teknik ve idari önlemler belirlenmiştir.`;
    const splitConclusionIntro = doc.splitTextToSize(conclusionIntro, 170);
    doc.text(splitConclusionIntro, 20, 38);

    // Count statistics
    let veryHighBefore = 0, highBefore = 0, lowBefore = 0, veryLowBefore = 0, negligibleBefore = 0;
    let veryHighAfter = 0, highAfter = 0, lowAfter = 0, veryLowAfter = 0, negligibleAfter = 0;

    optimizedRiskAssessments.forEach(r => {
        const bs = r.risk_score;
        if (bs >= 8) veryHighBefore++;
        else if (bs >= 4) highBefore++;
        else if (bs >= 2) lowBefore++;
        else if (bs === 1) veryLowBefore++;
        else negligibleBefore++;

        const as = r.after_risk_score !== undefined ? r.after_risk_score : 0;
        if (as >= 8) veryHighAfter++;
        else if (as >= 4) highAfter++;
        else if (as >= 2) lowAfter++;
        else if (as === 1) veryLowAfter++;
        else negligibleAfter++;
    });

    // Draw statistical table using autoTable on Sonuç Page
    autoTable(doc, {
        startY: 52,
        margin: { left: 20, right: 20 },
        theme: 'grid',
        head: [[
            { 
                content: lang === 'en' ? 'Risk Level Distribution' : 'Risk Düzeyi Dağılımı', 
                colSpan: 3, 
                styles: { halign: 'center', fillColor: [240, 240, 240], fontStyle: 'bold', textColor: [0, 0, 0], fontSize: 8.5 } 
            }
        ]],
        body: [
            [
                { content: lang === 'en' ? 'Risk Level' : 'Risk Seviyesi', styles: { fontStyle: 'bold', fillColor: [250, 250, 250] } },
                { content: lang === 'en' ? 'Before Measures' : 'Önlemler Öncesi (Before)', styles: { fontStyle: 'bold', fillColor: [250, 250, 250], halign: 'center' } },
                { content: lang === 'en' ? 'After Measures' : 'Önlemler Sonrası (After)', styles: { fontStyle: 'bold', fillColor: [250, 250, 250], halign: 'center' } }
            ],
            [
                lang === 'en' ? 'Very High Risk (Index 8 - 10)' : 'Çok Yüksek Risk (Endeks 8 - 10)',
                { content: veryHighBefore.toString(), styles: { halign: 'center', textColor: veryHighBefore > 0 ? [185, 28, 28] : [0, 0, 0], fontStyle: veryHighBefore > 0 ? 'bold' : 'normal' } },
                { content: veryHighAfter.toString(), styles: { halign: 'center', textColor: veryHighAfter > 0 ? [185, 28, 28] : [0, 0, 0], fontStyle: veryHighAfter > 0 ? 'bold' : 'normal' } }
            ],
            [
                lang === 'en' ? 'High Risk (Index 4 - 7)' : 'Yüksek Risk (Endeks 4 - 7)',
                { content: highBefore.toString(), styles: { halign: 'center', textColor: highBefore > 0 ? [194, 65, 12] : [0, 0, 0] } },
                { content: highAfter.toString(), styles: { halign: 'center', textColor: highAfter > 0 ? [194, 65, 12] : [0, 0, 0] } }
            ],
            [
                lang === 'en' ? 'Low Risk (Index 2 - 3)' : 'Düşük Risk (Endeks 2 - 3)',
                { content: lowBefore.toString(), styles: { halign: 'center', textColor: [161, 98, 7] } },
                { content: lowAfter.toString(), styles: { halign: 'center', textColor: [161, 98, 7] } }
            ],
            [
                lang === 'en' ? 'Very Low Risk (Index 1)' : 'Çok Düşük Risk (Endeks 1)',
                { content: veryLowBefore.toString(), styles: { halign: 'center', textColor: [21, 128, 61] } },
                { content: veryLowAfter.toString(), styles: { halign: 'center', textColor: [21, 128, 61], fontStyle: 'bold' } }
            ],
            [
                lang === 'en' ? 'Negligible (Index 0)' : 'İhmal Edilebilir (Endeks 0)',
                { content: negligibleBefore.toString(), styles: { halign: 'center', textColor: [120, 120, 120] } },
                { content: negligibleAfter.toString(), styles: { halign: 'center', textColor: [120, 120, 120], fontStyle: 'bold' } }
            ]
        ],
        styles: {
            font: activeFont,
            fontSize: 7.5,
            cellPadding: 2.5,
            valign: 'middle'
        }
    });

    let nextSonucY = doc.lastAutoTable.finalY + 6;

    // Section 2: Önemli Emniyet Önerileri
    doc.setFont(activeFont, "bold");
    doc.setFontSize(11);
    doc.setTextColor(41, 128, 185);
    doc.text(lang === 'en' ? "2. Key Safety Recommendations" : "2. Temel Emniyet Önerileri", 20, nextSonucY);
    nextSonucY += 4;

    doc.setFont(activeFont, "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 60);

    const recs = lang === 'en' ? [
        "- Periodic maintenance and inspections of the determined technical measures (protective guards, emergency stop buttons, etc.) must be carried out regularly.",
        "- Training of operators on machinery intervention procedures and safety rules should be ensured.",
        "- Functional tests of safety functions installed for risk reduction should be repeated at least once a year."
    ] : [
        "- Belirlenen teknik önlemlerin (koruyucu muhafazalar, acil stop butonları vb.) düzenli bakımları ve kontrolleri periyodik olarak yapılmalıdır.",
        "- Operatörlerin makineye müdahale prosedürleri ve emniyet kuralları konusunda eğitilmesi sağlanmalıdır.",
        "- Risk azaltma amaçlı kurulan emniyet fonksiyonlarının yılda en az bir kez fonksiyonel testleri tekrarlanmalıdır."
    ];

    recs.forEach(rec => {
        const splitRec = doc.splitTextToSize(rec, 170);
        doc.text(splitRec, 20, nextSonucY);
        nextSonucY += (splitRec.length * 4) + 1;
    });

    nextSonucY += 4;

    // Signatures
    // Draw structured boxes for author/approver signature
    autoTable(doc, {
        startY: nextSonucY,
        margin: { left: 20, right: 20 },
        theme: 'grid',
        body: [
            [
                { 
                    content: lang === 'en' 
                        ? 'Prepared By\n\n\n\n_______________________\nSignature / Date' 
                        : 'Hazırlayan\n\n\n\n_______________________\nİmza / Tarih', 
                    styles: { halign: 'center', cellWidth: 85, fontSize: 8.5 } 
                },
                { 
                    content: lang === 'en' 
                        ? 'Controlled / Approved By\n\n\n\n_______________________\nSignature / Date' 
                        : 'Kontrol Eden / Onaylayan\n\n\n\n_______________________\nİmza / Tarih', 
                    styles: { halign: 'center', cellWidth: 85, fontSize: 8.5 } 
                }
            ]
        ],
        styles: {
            font: activeFont,
            textColor: [50, 50, 50]
        }
    });

    // --- Add Page Borders and Page Numbers to all pages except Cover Page ---
    const totalPages = doc.getNumberOfPages();
    for (let p = 2; p <= totalPages; p++) {
        doc.setPage(p);
        drawPageBorders(doc);

        // Draw page number
        doc.setFont(activeFont, "normal");
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(
            lang === 'en' ? `Page ${p} / ${totalPages}` : `Sayfa ${p} / ${totalPages}`, 
            105, 283, { align: "center" }
        );
    }

    // For mobile/tablet devices, open the PDF in a new tab instead of doc.save() to ensure compatibility
    if (typeof window !== "undefined" && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        const blob = doc.output("blob");
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, "_blank");
    } else {
        doc.save(`${lang === 'en' ? 'risk-assessment-report' : 'risk-raporu'}-${project.project_no}.pdf`);
    }
};
