export const calculateRiskScore = (severity: number, probability: number): number => {
    return severity * probability;
};

export const getRiskColor = (score: number): string => {
    if (score >= 16) return 'bg-red-600 text-white'; // Çok Yüksek
    if (score >= 10) return 'bg-orange-500 text-white'; // Yüksek
    if (score >= 5) return 'bg-yellow-400 text-black'; // Orta
    return 'bg-green-500 text-white'; // Düşük
};

export const getRiskLevel = (score: number): string => {
    if (score >= 16) return 'Çok Yüksek';
    if (score >= 10) return 'Yüksek';
    if (score >= 5) return 'Orta';
    return 'Düşük';
};

// ESPE (Işık Perdesi) Hesaplaması: S = (K * T) + C
// T in seconds for calculation. Input usually ms.
export const calculateESPESafeDistance = (
    K: number, // mm/s
    T_ms: number, // ms
    C: number // mm
): number => {
    const T_seconds = T_ms / 1000;
    return (K * T_seconds) + C;
};
