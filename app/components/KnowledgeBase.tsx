"use client";

import { useState, useEffect } from "react";
import { Upload, Trash2, FileText, CheckCircle, Loader2, AlertCircle, Save } from "lucide-react";

interface DocItem {
    id: string;
    name: string;
    text: string;
    date: number;
    size: number;
    type: 'standard' | 'guide' | 'regulation' | 'other';
    description: string;
    file: Blob; // [NEW] Store the actual file
}

export default function KnowledgeBase() {
    const [documents, setDocuments] = useState<DocItem[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Upload Form State
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadForm, setUploadForm] = useState({
        name: "",
        type: "standard",
        description: ""
    });

    // --- IndexedDB Logic ---
    const DB_NAME = "SafetyAppDB";
    const STORE_NAME = "knowledge_base";

    const getDB = async () => {
        return new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = (e) => {
                const db = (e.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: "id" });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    };

    const loadDocuments = async () => {
        try {
            const db = await getDB();
            const tx = db.transaction(STORE_NAME, "readonly");
            const store = tx.objectStore(STORE_NAME);
            const req = store.getAll();
            req.onsuccess = () => {
                setDocuments(req.result as DocItem[]);
            };
        } catch (e) {
            console.error("DB Load Error:", e);
        }
    };

    useEffect(() => {
        loadDocuments();
    }, []);

    // File Selection Handler
    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== "application/pdf") {
            setError("Sadece PDF dosyaları yüklenebilir.");
            return;
        }

        setSelectedFile(file);
        setUploadForm({
            name: file.name.replace(".pdf", ""), // Auto-fill name
            type: "standard",
            description: ""
        });
        setError(null);
    };

    // Final Upload Handler
    const handleUploadProcess = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        setError(null);

        try {
            // Store directly in IndexedDB without parsing text
            const newDoc: DocItem = {
                id: Math.random().toString(36).substr(2, 9),
                name: uploadForm.name,
                type: uploadForm.type as any,
                description: uploadForm.description,
                text: "", // RAG disabled, no text content needed
                date: Date.now(),
                size: selectedFile.size,
                file: selectedFile
            };

            const db = await getDB();
            const tx = db.transaction(STORE_NAME, "readwrite");
            tx.objectStore(STORE_NAME).add(newDoc);

            tx.oncomplete = () => {
                loadDocuments();
                setIsUploading(false);
                setSelectedFile(null); // Reset form
            };

        } catch (err: any) {
            setError(err.message);
            setIsUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).delete(id);
        tx.oncomplete = () => loadDocuments();
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="size-5 text-purple-600" />
                        Dijital Kütüphane
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                        Standartlara ve yönetmeliklere buradan erişebilirsiniz.
                    </p>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                    <AlertCircle className="size-4" />
                    {error}
                </div>
            )}

            {/* UPLOAD FORM or DROPZONE */}
            {!selectedFile ? (
                <div className="relative">
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={onFileSelect}
                        disabled={isUploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-gray-500 hover:border-purple-400 hover:bg-purple-50 transition border-opacity-75">
                        <Upload className="size-8 mb-2 text-gray-400" />
                        <span className="text-sm font-medium">PDF Yüklemek İçin Tıklayın</span>
                        <span className="text-xs text-gray-400 mt-1">Maksimum 10MB önerilir. Metin tabanlı PDF olmalıdır.</span>
                    </div>
                </div>
            ) : (
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-purple-900 flex items-center gap-2">
                            <CheckCircle className="size-4" />
                            Dosya Seçildi: {selectedFile.name}
                        </h3>
                        <button onClick={() => setSelectedFile(null)} className="text-gray-400 hover:text-red-500">
                            <Trash2 className="size-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-purple-700 mb-1">Doküman Adı</label>
                            <input
                                type="text"
                                value={uploadForm.name}
                                onChange={e => setUploadForm({ ...uploadForm, name: e.target.value })}
                                className="w-full p-2 border rounded-lg text-sm outline-none focus:border-purple-500"
                                placeholder="Örn: EN ISO 12100:2010"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-purple-700 mb-1">Doküman Tipi</label>
                            <select
                                value={uploadForm.type}
                                onChange={e => setUploadForm({ ...uploadForm, type: e.target.value })}
                                className="w-full p-2 border rounded-lg text-sm outline-none focus:border-purple-500"
                            >
                                <option value="standard">Standart (ISO/EN)</option>
                                <option value="guide">Rehber / Kılavuz</option>
                                <option value="regulation">Yönetmelik</option>
                                <option value="other">Diğer</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-purple-700 mb-1">Kısa Açıklama</label>
                            <textarea
                                rows={2}
                                value={uploadForm.description}
                                onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })}
                                className="w-full p-2 border rounded-lg text-sm outline-none focus:border-purple-500"
                                placeholder="Bu dokümanın içeriği hakkında kısa bilgi..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleUploadProcess}
                            disabled={isUploading}
                            className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold text-sm shadow hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    İşleniyor...
                                </>
                            ) : (
                                <>
                                    <Save className="size-4" />
                                    Kaydet ve İçeri Aktar
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Documents List */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Yüklü Dokümanlar ({documents.length})</h3>

                {documents.length === 0 && (
                    <p className="text-sm text-gray-400 italic text-center py-4">Henüz doküman yüklenmedi.</p>
                )}

                {documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="bg-white p-2 rounded shadow-sm">
                                <FileText className="size-5 text-red-500" />
                            </div>
                            <div className="truncate">
                                <p className="text-sm font-bold text-gray-700 truncate max-w-[200px]">{doc.name}</p>
                                <p className="text-[10px] text-gray-400">
                                    {(doc.size / 1024 / 1024).toFixed(2)} MB • {new Date(doc.date).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">Aktif</span>
                            </div>
                            <button
                                onClick={() => handleDelete(doc.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                                title="Sil"
                            >
                                <Trash2 className="size-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
