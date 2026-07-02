export interface Customer {
    id: string; // UUID
    name: string;
    address: string;
    contact_person: string;
    email: string;
    phone: string;
    logo_url?: string;
}

export interface Project {
    id: string; // UUID
    customer_id: string;
    project_no: string;
    name: string; // Machine Name / Project Title
    description: string;
    status: 'Active' | 'Completed';
    created_at: string;

    // Report Metadata
    report_date: string;
    author_name: string;
    approver_name: string;

    // Machine Details
    machine_limits?: string;
    machine_technical_specs?: string;
    machine_intended_use?: string;
    include_machine_info?: boolean;

    // Custom Annexes
    annexes_tr?: any[];
    annexes_en?: any[];
}

// Risk Assessment now belongs to a project
export interface RiskAssessment {
    id: string; // UUID
    project_id: string; // FK -> Project
    hazard_zone: string;
    hazard_type: string;
    hazard_description: string; // [NEW] Detailed description

    // Risk Index Parameters - Before
    before_s: 'S1' | 'S2' | 'S3' | 'S4';
    before_f: 'F0' | 'F1' | 'F2' | 'NA';
    before_a: 'A1' | 'A2' | 'NA';
    before_o: 'O1' | 'O2' | 'O3' | 'NA';
    risk_score: number; // Risk Index (0-10)

    // Measures
    measures_design: string;
    measures_engineering: string;
    measures_administrative: string;
    measures?: string;

    // Risk Index Parameters - After (Optional)
    after_s?: 'S1' | 'S2' | 'S3' | 'S4';
    after_f?: 'F0' | 'F1' | 'F2' | 'NA';
    after_a?: 'A1' | 'A2' | 'NA';
    after_o?: 'O1' | 'O2' | 'O3' | 'NA';
    after_risk_score?: number; // Risk Index (0-10)

    // PLr (EN ISO 13849-1) [NEW]
    safety_function_required?: boolean;
    plr_s?: 'S1' | 'S2';
    plr_f?: 'F1' | 'F2';
    plr_p?: 'P1' | 'P2';
    plr_result?: string; // a, b, c, d, e
    plr_p_factors?: {
        training: 'A' | 'B';
        speed: 'A' | 'B' | 'C';
        escape: 'A' | 'B' | 'C';
        recognition: 'A' | 'B' | 'C';
        complexity: 'A' | 'B';
    };

    // Images
    photo_url?: string;
    annotated_image?: string; // Hazard Image
    measure_images?: string[];   // [NEW] Array of Measure/Solution Images
    standards?: string[]; // [NEW] Related Standards codes
}

// Checklist Item now belongs to a project (state is stored per project)
export interface ChecklistItemState {
    id: string; // Composite: project_id + question_id
    project_id: string;
    question_id: string;
    status: 'Pass' | 'Fail' | 'NA';
    note: string;
}

export type MeasurementType = 'LVD' | 'Noise' | 'ESPE';

export interface LVDData {
    earth_continuity: number;
    insulation_resistance: number;
    leakage_current: number;
    visual_check: boolean;
}

export interface NoiseData {
    operator_pos_dba: number;
    operator_pos_dbc: number;
    background_dba: number;
    points: { location: string; dba: number; dbc: number }[];
}

export interface ESPEData {
    approach_speed_K: number;
    response_time_T_ms: number;
    added_distance_C_mm: number;
    calculated_safe_distance_S_mm: number;
    measured_distance_mm?: number;
    result: 'Pass' | 'Fail';
}

export interface Measurement {
    id: string;
    project_id: string; // FK -> Project
    type: MeasurementType;
    data: LVDData | NoiseData | ESPEData;
}

export interface FunctionalTest {
    id: string;
    project_id: string; // FK -> Project
    name: string; // Emniyet Fonksiyonu (e.g. Acil Stop Butonu, Işık Perdesi)
    description: string; // Test Metodu / Açıklama
    plr_required: 'a' | 'b' | 'c' | 'd' | 'e'; // Gerekli PLr
    pl_achieved: 'a' | 'b' | 'c' | 'd' | 'e'; // Ulaşılan PL
    result: 'Pass' | 'Fail'; // Sonuç (UYGUN / UYGUN DEĞİL)
    notes: string; // Açıklama / Notlar
}

export interface SentenceTemplate {
    id: string;
    lang: 'tr' | 'en';
    category: 'hazard' | 'measure';
    content: string;
    group?: string;
}
