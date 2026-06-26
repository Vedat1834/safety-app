export const RISK_S = [
    { value: 'S1', label: 'İhmal Edilebilir (S1)', description: 'S1 - İhmal Edilebilir (İlkyardım seviyesi sıyrık/morluk)' },
    { value: 'S2', label: 'Hafif Yaralanma (S2)', description: 'S2 - Hafif Yaralanma (Tıbbi müdahale gerektiren basit kesik/ezik)' },
    { value: 'S3', label: 'Ciddi Yaralanma (S3)', description: 'S3 - Ciddi Yaralanma (Geri dönüşü olmayan hafif uzuv kaybı, ciddi kırık)' },
    { value: 'S4', label: 'Çok Ciddi Yaralanma (S4)', description: 'S4 - Çok Ciddi (Uzuv kaybı, ölümcül yaralanma)' }
];

export const RISK_F = [
    { value: 'F0', label: 'Engellenmiş (F0)', description: 'F0 - Engellenmiş (Tasarımla erişim tamamen kapatılmış)' },
    { value: 'F1', label: 'Düşük Sıklık (F1)', description: 'F1 - Düşük (Vardiyada <= 2 kez maruziyet VE süre < 15 dk)' },
    { value: 'F2', label: 'Yüksek Sıklık (F2)', description: 'F2 - Yüksek (Vardiyada > 2 kez maruziyet VEYA süre > 15 dk)' }
];

export const RISK_A = [
    { value: 'A1', label: 'Kaçınılabilir (A1)', description: 'A1 - Kaçınılabilir (Eğitimli operatör, yavaş hareketler, geniş alan)' },
    { value: 'A2', label: 'Kaçınılamaz (A2)', description: 'A2 - Kaçınılamaz (Hızlı hareketler, dar alan, kaçış yolu yok)' }
];

export const RISK_O = [
    { value: 'O1', label: 'Düşük Olasılık (O1)', description: 'O1 - Düşük (Güvensiz durum/arıza nadiren gerçekleşir)' },
    { value: 'O2', label: 'Orta Olasılık (O2)', description: 'O2 - Orta (Güvensiz durum/arıza gerçekleşmesi öngörülebilir)' },
    { value: 'O3', label: 'Yüksek Olasılık (O3)', description: 'O3 - Yüksek (Güvensiz durum/arıza neredeyse kaçınılmazdır)' }
];


export const calculateRiskIndex = (
    s: 'S1' | 'S2' | 'S3' | 'S4',
    f: 'F0' | 'F1' | 'F2' | 'NA',
    a: 'A1' | 'A2' | 'NA',
    o: 'O1' | 'O2' | 'O3' | 'NA'
): number => {
    // S1---O1, S1---O2, S1---O3
    if (s === 'S1') {
        return 0;
    }

    // S2
    if (s === 'S2') {
        // S2-F0--O1, S2-F0--O2, S2-F0--O3
        if (f === 'F0') {
            if (o === 'O1') return 0;
            if (o === 'O2') return 0;
            if (o === 'O3') return 1;
        }
        // S2-F1-A1-O1, S2-F1-A1-O2, S2-F1-A1-O3
        // S2-F1-A2-O1, S2-F1-A2-O2, S2-F1-A2-O3
        if (f === 'F1') {
            if (a === 'A1') {
                if (o === 'O1') return 0;
                if (o === 'O2') return 0;
                if (o === 'O3') return 1;
            }
            if (a === 'A2') {
                if (o === 'O1') return 0;
                if (o === 'O2') return 1;
                if (o === 'O3') return 2;
            }
        }
        // S2-F2-A1-O1, S2-F2-A1-O2, S2-F2-A1-O3
        // S2-F2-A2-O1, S2-F2-A2-O2, S2-F2-A2-O3
        if (f === 'F2') {
            if (a === 'A1') {
                if (o === 'O1') return 0;
                if (o === 'O2') return 0;
                if (o === 'O3') return 1;
            }
            if (a === 'A2') {
                if (o === 'O1') return 0;
                if (o === 'O2') return 1;
                if (o === 'O3') return 2;
            }
        }
    }

    // S3
    if (s === 'S3') {
        // S3-F0--O1, S3-F0--O2, S3-F0--O3
        if (f === 'F0') {
            if (o === 'O1') return 1;
            if (o === 'O2') return 1;
            if (o === 'O3') return 1;
        }
        // S3-F1-A1-O1, S3-F1-A1-O2, S3-F1-A1-O3
        // S3-F1-A2-O1, S3-F1-A2-O2, S3-F1-A2-O3
        if (f === 'F1') {
            if (a === 'A1') {
                if (o === 'O1') return 1;
                if (o === 'O2') return 2;
                if (o === 'O3') return 3;
            }
            if (a === 'A2') {
                if (o === 'O1') return 2;
                if (o === 'O2') return 3;
                if (o === 'O3') return 4;
            }
        }
        // S3-F2-A1-O1, S3-F2-A1-O2, S3-F2-A1-O3
        // S3-F2-A2-O1, S3-F2-A2-O2, S3-F2-A2-O3
        if (f === 'F2') {
            if (a === 'A1') {
                if (o === 'O1') return 3;
                if (o === 'O2') return 4;
                if (o === 'O3') return 5;
            }
            if (a === 'A2') {
                if (o === 'O1') return 4;
                if (o === 'O2') return 5;
                if (o === 'O3') return 6;
            }
        }
    }

    // S4
    if (s === 'S4') {
        // S4-F0--O1, S4-F0--O2, S4-F0--O3
        if (f === 'F0') {
            if (o === 'O1') return 1;
            if (o === 'O2') return 1;
            if (o === 'O3') return 1;
        }
        // S4-F1-A1-O1, S4-F1-A1-O2, S4-F1-A1-O3
        // S4-F1-A2-O1, S4-F1-A2-O2, S4-F1-A2-O3
        if (f === 'F1') {
            if (a === 'A1') {
                if (o === 'O1') return 5;
                if (o === 'O2') return 6;
                if (o === 'O3') return 7;
            }
            if (a === 'A2') {
                if (o === 'O1') return 6;
                if (o === 'O2') return 7;
                if (o === 'O3') return 8;
            }
        }
        // S4-F2-A1-O1, S4-F2-A1-O2, S4-F2-A1-O3
        // S4-F2-A2-O1, S4-F2-A2-O2, S4-F2-A2-O3
        if (f === 'F2') {
            if (a === 'A1') {
                if (o === 'O1') return 7;
                if (o === 'O2') return 8;
                if (o === 'O3') return 9;
            }
            if (a === 'A2') {
                if (o === 'O1') return 8;
                if (o === 'O2') return 9;
                if (o === 'O3') return 10;
            }
        }
    }

    return 0;
};

// Map score (0-10) to colored badges and labels (5 Risk Levels: 0, 1, 2-3, 4-7, 8-10)
export const getRiskIndexStatus = (score: number) => {
    if (score === 0) return { label: 'İhmal Edilebilir', color: 'bg-gray-100 text-gray-800 border-gray-200' };
    if (score === 1) return { label: 'Çok Düşük Risk', color: 'bg-green-100 text-green-800 border-green-200' };
    if (score <= 3) return { label: 'Düşük Risk', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    if (score <= 7) return { label: 'Yüksek Risk', color: 'bg-orange-100 text-orange-800 border-orange-200' };
    return { label: 'Çok Yüksek Risk', color: 'bg-red-600 text-white border-red-700' };
};
