"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Customer, Project, RiskAssessment, Measurement, ChecklistItemState, FunctionalTest, SentenceTemplate } from '@/app/types';

const DEFAULT_TEMPLATES: SentenceTemplate[] = [
    // Hazards (Tehlikeler)
    { id: 'h1', lang: 'tr', category: 'hazard', content: 'Hareketli parçalara erişim engellenmemiştir, fiziksel muhafaza eksiktir.', group: 'Koruyucular' },
    { id: 'h2', lang: 'tr', category: 'hazard', content: 'Acil stop butonunun yerleşimi ve erişilebilirliği uygun değildir.', group: 'Acil Durum' },
    { id: 'h3', lang: 'tr', category: 'hazard', content: 'Elektrik panosu kapaklarında emniyet kilidi bulunmamaktadır.', group: 'Elektrik' },
    { id: 'h4', lang: 'tr', category: 'hazard', content: 'Işık perdesinin emniyet mesafesi yetersizdir.', group: 'Emniyet Cihazları' },
    { id: 'h5', lang: 'tr', category: 'hazard', content: 'Çift el kontrol ünitesi emniyet mesafesi standarda uygun değildir.', group: 'Emniyet Cihazları' },
    { id: 'h6', lang: 'en', category: 'hazard', content: 'Access to moving parts is not restricted, physical guard is missing.', group: 'Guards' },
    { id: 'h7', lang: 'en', category: 'hazard', content: 'Emergency stop button placement and accessibility is insufficient.', group: 'Emergency' },
    { id: 'h8', lang: 'en', category: 'hazard', content: 'Electrical panel doors lack safety switches/interlocks.', group: 'Electrical' },
    { id: 'h9', lang: 'en', category: 'hazard', content: 'Light curtain safety distance is insufficient.', group: 'Safety Devices' },
    { id: 'h10', lang: 'en', category: 'hazard', content: 'Two-hand control unit safety distance is not compliant with the standard.', group: 'Safety Devices' },
    // Measures (Önlemler)
    { id: 'm1', lang: 'tr', category: 'measure', content: 'EN ISO 14120 standardına uygun sabit veya hareketli kilitli muhafaza yapılmalıdır.', group: 'Koruyucular' },
    { id: 'm2', lang: 'tr', category: 'measure', content: 'Acil stop butonu operatörün kolayca erişebileceği bir konuma taşınmalıdır.', group: 'Acil Durum' },
    { id: 'm3', lang: 'tr', category: 'measure', content: 'Elektrik kapaklarına EN ISO 14119 uyumlu emniyet siviçleri entegre edilmelidir.', group: 'Elektrik' },
    { id: 'm4', lang: 'tr', category: 'measure', content: 'EN ISO 13855 standardına göre ışık perdesi emniyet mesafesi hesaplanıp konumlandırılmalıdır.', group: 'Emniyet Cihazları' },
    { id: 'm5', lang: 'tr', category: 'measure', content: 'Operatörlerin emniyet kuralları ve makine müdahale prosedürleri hakkında eğitilmesi sağlanmalıdır.', group: 'Eğitim & İdari' },
    { id: 'm6', lang: 'en', category: 'measure', content: 'A fixed or interlocked movable guard compliant with EN ISO 14120 must be installed.', group: 'Guards' },
    { id: 'm7', lang: 'en', category: 'measure', content: 'The emergency stop button must be relocated to a position easily accessible by the operator.', group: 'Emergency' },
    { id: 'm8', lang: 'en', category: 'measure', content: 'Safety switches compliant with EN ISO 14119 must be integrated into electrical doors.', group: 'Electrical' },
    { id: 'm9', lang: 'en', category: 'measure', content: 'The light curtain safety distance must be calculated and positioned according to EN ISO 13855.', group: 'Safety Devices' },
    { id: 'm10', lang: 'en', category: 'measure', content: 'Operators must be trained on safety rules and machinery intervention procedures.', group: 'Training & Admin' }
];

interface AppContextType {
    // Data Lists
    customers: Customer[];
    projects: Project[];
    risks: RiskAssessment[];
    measurements: Measurement[];
    checklistStates: ChecklistItemState[];
    functionalTests: FunctionalTest[];
    templates: SentenceTemplate[];
    groupOrders: { [key: string]: string[] };

    // Selection State
    activeCustomer: Customer | null;
    activeProject: Project | null;

    // Actions
    addCustomer: (customer: Customer) => void;
    setActiveCustomer: (customer: Customer | null) => void;
    updateCustomer: (id: string, updates: Partial<Customer>) => void;
    deleteCustomer: (id: string) => void;

    addProject: (project: Project) => void;
    setActiveProject: (project: Project | null) => void;
    updateProject: (id: string, updates: Partial<Project>) => void;
    deleteProject: (id: string) => void;

    addRisk: (risk: RiskAssessment) => void;
    updateRisk: (id: string, updates: Partial<RiskAssessment>) => void;
    deleteRisk: (id: string) => void;

    addFunctionalTest: (test: FunctionalTest) => void;
    updateFunctionalTest: (id: string, updates: Partial<FunctionalTest>) => void;
    deleteFunctionalTest: (id: string) => void;

    addMeasurement: (measurement: Measurement) => void;

    updateChecklistState: (state: ChecklistItemState) => void;

    // Sentence Templates
    addTemplate: (t: SentenceTemplate) => void;
    deleteTemplate: (id: string) => void;
    bulkImportTemplates: (newTemplates: SentenceTemplate[]) => void;
    renameGroup: (lang: 'tr' | 'en', category: 'hazard' | 'measure', oldName: string, newName: string) => void;
    deleteGroup: (lang: 'tr' | 'en', category: 'hazard' | 'measure', name: string) => void;
    updateGroupOrder: (lang: 'tr' | 'en', category: 'hazard' | 'measure', list: string[]) => void;
    updateTemplateGroup: (id: string, group: string) => void;
    importBackupTemplates: (templates: SentenceTemplate[], groupOrders: { [key: string]: string[] }, overwrite: boolean) => void;

    // Helpers
    getProjectRisks: (projectId: string) => RiskAssessment[];
    getProjectMeasurements: (projectId: string) => Measurement[];
    getProjectFunctionalTests: (projectId: string) => FunctionalTest[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AuditProvider = ({ children }: { children: ReactNode }) => {
    // --- State ---
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [risks, setRisks] = useState<RiskAssessment[]>([]);
    const [measurements, setMeasurements] = useState<Measurement[]>([]);
    const [checklistStates, setChecklistStates] = useState<ChecklistItemState[]>([]);
    const [functionalTests, setFunctionalTests] = useState<FunctionalTest[]>([]);
    const [templates, setTemplates] = useState<SentenceTemplate[]>([]);
    const [groupOrders, setGroupOrders] = useState<{ [key: string]: string[] }>({});

    const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
    const [activeProject, setActiveProject] = useState<Project | null>(null);

    const [isInitialized, setIsInitialized] = useState(false);

    // --- Persistence: LOAD ---
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const load = (key: string) => {
                try {
                    const item = localStorage.getItem(key);
                    const parsed = item ? JSON.parse(item) : [];
                    return Array.isArray(parsed) ? parsed : [];
                } catch (e) {
                    console.error("Failed to load persistence for", key, e);
                    return [];
                }
            };

            setCustomers(load('safety_customers'));
            setProjects(load('safety_projects'));
            setRisks(load('safety_risks'));
            setMeasurements(load('safety_measurements'));
            setChecklistStates(load('safety_checklist'));
            setFunctionalTests(load('safety_functional_tests'));
            
            const loadedTemplates = load('safety_templates');
            if (loadedTemplates.length === 0) {
                setTemplates(DEFAULT_TEMPLATES);
                localStorage.setItem('safety_templates', JSON.stringify(DEFAULT_TEMPLATES));
            } else {
                // Migrate EN group names from Turkish to English if they are still Turkish
                const migrated = loadedTemplates.map((t: any) => {
                    let group = t.group || 'Genel';
                    if (t.lang === 'en') {
                        if (group === 'Koruyucular') group = 'Guards';
                        else if (group === 'Acil Durum') group = 'Emergency';
                        else if (group === 'Elektrik') group = 'Electrical';
                        else if (group === 'Emniyet Cihazları') group = 'Safety Devices';
                        else if (group === 'Eğitim & İdari') group = 'Training & Admin';
                    }
                    return { ...t, group };
                });
                setTemplates(migrated);
                localStorage.setItem('safety_templates', JSON.stringify(migrated));
            }

            const loadedOrders = localStorage.getItem('safety_group_orders');
            if (loadedOrders) {
                try {
                    let parsed = JSON.parse(loadedOrders);
                    // Migrate EN groups from Turkish to English
                    if (parsed.en_hazard && parsed.en_hazard.includes('Koruyucular')) {
                        parsed.en_hazard = parsed.en_hazard.map((g: string) => {
                            if (g === 'Koruyucular') return 'Guards';
                            if (g === 'Elektrik') return 'Electrical';
                            if (g === 'Acil Durum') return 'Emergency';
                            if (g === 'Emniyet Cihazları') return 'Safety Devices';
                            return g;
                        });
                    }
                    if (parsed.en_measure && parsed.en_measure.includes('Koruyucular')) {
                        parsed.en_measure = parsed.en_measure.map((g: string) => {
                            if (g === 'Koruyucular') return 'Guards';
                            if (g === 'Elektrik') return 'Electrical';
                            if (g === 'Acil Durum') return 'Emergency';
                            if (g === 'Emniyet Cihazları') return 'Safety Devices';
                            if (g === 'Eğitim & İdari') return 'Training & Admin';
                            return g;
                        });
                    }
                    // Make sure new EN defaults are also included if they are not in the list
                    const defaultEnHaz = ['Guards', 'Electrical', 'Emergency', 'Safety Devices', 'Genel'];
                    const defaultEnMeas = ['Guards', 'Electrical', 'Emergency', 'Safety Devices', 'Training & Admin', 'Genel'];
                    if (!parsed.en_hazard) parsed.en_hazard = defaultEnHaz;
                    if (!parsed.en_measure) parsed.en_measure = defaultEnMeas;

                    setGroupOrders(parsed);
                    localStorage.setItem('safety_group_orders', JSON.stringify(parsed));
                } catch (e) {
                    console.error("Failed to parse safety_group_orders", e);
                }
            } else {
                const initialOrders = {
                    tr_hazard: ['Koruyucular', 'Elektrik', 'Acil Durum', 'Emniyet Cihazları', 'Genel'],
                    tr_measure: ['Koruyucular', 'Elektrik', 'Acil Durum', 'Emniyet Cihazları', 'Eğitim & İdari', 'Genel'],
                    en_hazard: ['Guards', 'Electrical', 'Emergency', 'Safety Devices', 'Genel'],
                    en_measure: ['Guards', 'Electrical', 'Emergency', 'Safety Devices', 'Training & Admin', 'Genel']
                };
                setGroupOrders(initialOrders);
                localStorage.setItem('safety_group_orders', JSON.stringify(initialOrders));
            }
            
            setIsInitialized(true);
        }
    }, []);

    // --- Persistence: SAVE ---
    useEffect(() => {
        if (isInitialized) localStorage.setItem('safety_customers', JSON.stringify(customers));
    }, [customers, isInitialized]);

    useEffect(() => {
        if (isInitialized) localStorage.setItem('safety_projects', JSON.stringify(projects));
    }, [projects, isInitialized]);

    useEffect(() => {
        if (isInitialized) localStorage.setItem('safety_risks', JSON.stringify(risks));
    }, [risks, isInitialized]);

    useEffect(() => {
        if (isInitialized) localStorage.setItem('safety_measurements', JSON.stringify(measurements));
    }, [measurements, isInitialized]);

    useEffect(() => {
        if (isInitialized) localStorage.setItem('safety_checklist', JSON.stringify(checklistStates));
    }, [checklistStates, isInitialized]);

    useEffect(() => {
        if (isInitialized) localStorage.setItem('safety_functional_tests', JSON.stringify(functionalTests));
    }, [functionalTests, isInitialized]);

    useEffect(() => {
        if (isInitialized) localStorage.setItem('safety_templates', JSON.stringify(templates));
    }, [templates, isInitialized]);


    // --- Actions ---
    const addCustomer = (c: Customer) => setCustomers(prev => [...prev, c]);

    const updateCustomer = (id: string, updates: Partial<Customer>) => {
        setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
        if (activeCustomer?.id === id) {
            setActiveCustomer(prev => prev ? { ...prev, ...updates } as Customer : null);
        }
    };

    const deleteCustomer = (id: string) => {
        setCustomers(prev => prev.filter(c => c.id !== id));
        // Cascade delete all associated projects and items
        const customerProjectIds = projects.filter(p => p.customer_id === id).map(p => p.id);
        setProjects(prev => prev.filter(p => p.customer_id !== id));
        setRisks(prev => prev.filter(r => !customerProjectIds.includes(r.project_id)));
        setMeasurements(prev => prev.filter(m => !customerProjectIds.includes(m.project_id)));
        setChecklistStates(prev => prev.filter(cs => !customerProjectIds.includes(cs.project_id)));
        setFunctionalTests(prev => prev.filter(t => !customerProjectIds.includes(t.project_id)));

        if (activeCustomer?.id === id) {
            setActiveCustomer(null);
            setActiveProject(null);
        }
    };

    const addProject = (p: Project) => setProjects(prev => [...prev, p]);

    const updateProject = (id: string, updates: Partial<Project>) => {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
        if (activeProject?.id === id) {
            setActiveProject(prev => prev ? { ...prev, ...updates } as Project : null);
        }
    };

    const deleteProject = (id: string) => {
        setProjects(prev => prev.filter(p => p.id !== id));
        // Cascade delete all items associated with this project
        setRisks(prev => prev.filter(r => r.project_id !== id));
        setMeasurements(prev => prev.filter(m => m.project_id !== id));
        setChecklistStates(prev => prev.filter(cs => cs.project_id !== id));
        setFunctionalTests(prev => prev.filter(t => t.project_id !== id));

        if (activeProject?.id === id) {
            setActiveProject(null);
        }
    };

    const addTemplate = (t: SentenceTemplate) => setTemplates(prev => [...prev, t]);
    const deleteTemplate = (id: string) => setTemplates(prev => prev.filter(t => t.id !== id));
    const bulkImportTemplates = (newTemplates: SentenceTemplate[]) => setTemplates(prev => [...prev, ...newTemplates]);
    const updateTemplateGroup = (id: string, group: string) => {
        setTemplates(prev => prev.map(t => t.id === id ? { ...t, group } : t));
    };

    const importBackupTemplates = (importedTemplates: SentenceTemplate[], importedOrders: { [key: string]: string[] }, overwrite: boolean) => {
        if (overwrite) {
            setTemplates(importedTemplates);
            setGroupOrders(importedOrders);
            localStorage.setItem('safety_templates', JSON.stringify(importedTemplates));
            localStorage.setItem('safety_group_orders', JSON.stringify(importedOrders));
        } else {
            // Merge templates avoiding exact duplicates
            setTemplates(prev => {
                const combined = [...prev];
                importedTemplates.forEach(t => {
                    const exists = prev.some(x => 
                        x.lang === t.lang && 
                        x.category === t.category && 
                        x.content.trim() === t.content.trim() && 
                        (x.group || 'Genel') === (t.group || 'Genel')
                    );
                    if (!exists) {
                        combined.push(t);
                    }
                });
                localStorage.setItem('safety_templates', JSON.stringify(combined));
                return combined;
            });

            // Merge group orders
            setGroupOrders(prev => {
                const next = { ...prev };
                Object.keys(importedOrders).forEach(key => {
                    const prevList = prev[key] || [];
                    const importedList = importedOrders[key] || [];
                    const merged = Array.from(new Set([...prevList, ...importedList]));
                    next[key] = merged;
                });
                localStorage.setItem('safety_group_orders', JSON.stringify(next));
                return next;
            });
        }
    };

    const renameGroup = (lang: 'tr' | 'en', category: 'hazard' | 'measure', oldName: string, newName: string) => {
        setTemplates(prev => prev.map(t => (t.lang === lang && t.category === category && t.group === oldName) ? { ...t, group: newName } : t));
        setGroupOrders(prev => {
            const key = `${lang}_${category}`;
            const list = prev[key] || [];
            const updatedList = list.map(g => g === oldName ? newName : g);
            const next = { ...prev, [key]: updatedList };
            localStorage.setItem('safety_group_orders', JSON.stringify(next));
            return next;
        });
    };

    const deleteGroup = (lang: 'tr' | 'en', category: 'hazard' | 'measure', name: string) => {
        setTemplates(prev => prev.filter(t => !(t.lang === lang && t.category === category && t.group === name)));
        setGroupOrders(prev => {
            const key = `${lang}_${category}`;
            const list = prev[key] || [];
            const updatedList = list.filter(g => g !== name);
            const next = { ...prev, [key]: updatedList };
            localStorage.setItem('safety_group_orders', JSON.stringify(next));
            return next;
        });
    };

    const updateGroupOrder = (lang: 'tr' | 'en', category: 'hazard' | 'measure', list: string[]) => {
        setGroupOrders(prev => {
            const key = `${lang}_${category}`;
            const next = { ...prev, [key]: list };
            localStorage.setItem('safety_group_orders', JSON.stringify(next));
            return next;
        });
    };

    const addRisk = (r: RiskAssessment) => setRisks(prev => [...prev, r]);

    const updateRisk = (id: string, updates: Partial<RiskAssessment>) => {
        setRisks(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    };

    const deleteRisk = (id: string) => {
        setRisks(prev => prev.filter(r => r.id !== id));
    };

    const addFunctionalTest = (t: FunctionalTest) => setFunctionalTests(prev => [...prev, t]);

    const updateFunctionalTest = (id: string, updates: Partial<FunctionalTest>) => {
        setFunctionalTests(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const deleteFunctionalTest = (id: string) => {
        setFunctionalTests(prev => prev.filter(t => t.id !== id));
    };

    const addMeasurement = (m: Measurement) => setMeasurements(prev => [...prev, m]);

    const updateChecklistState = (newState: ChecklistItemState) => {
        setChecklistStates(prev => {
            const existingIndex = prev.findIndex(
                item => item.project_id === newState.project_id && item.question_id === newState.question_id
            );

            if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = newState;
                return updated;
            }
            return [...prev, newState];
        });
    };

    // --- Selectors ---
    const getProjectRisks = (projectId: string) => risks.filter(r => r.project_id === projectId);

    const getProjectMeasurements = (projectId: string) => measurements.filter(m => m.project_id === projectId);

    const getProjectFunctionalTests = (projectId: string) => functionalTests.filter(t => t.project_id === projectId);

    return (
        <AppContext.Provider
            value={{
                customers,
                projects,
                risks,
                measurements,
                checklistStates,
                functionalTests,
                activeCustomer,
                activeProject,
                addCustomer,
                setActiveCustomer,
                updateCustomer,
                deleteCustomer,
                addProject,
                setActiveProject,
                updateProject,
                deleteProject,
                addRisk,
                updateRisk,
                deleteRisk,
                addFunctionalTest,
                updateFunctionalTest,
                deleteFunctionalTest,
                addMeasurement,
                updateChecklistState,
                templates,
                groupOrders,
                addTemplate,
                deleteTemplate,
                bulkImportTemplates,
                renameGroup,
                deleteGroup,
                updateGroupOrder,
                updateTemplateGroup,
                importBackupTemplates,
                getProjectRisks,
                getProjectMeasurements,
                getProjectFunctionalTests
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useAudit = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAudit must be used within an AuditProvider');
    }
    return context;
};
