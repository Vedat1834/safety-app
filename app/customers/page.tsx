"use client";

import { useAudit } from "../context/AuditContext";
import { useState } from "react";
import { Users, Building, Phone, Mail, Plus, MapPin, Edit2, Check, X, Search, ChevronRight, Upload, Trash2 } from "lucide-react";
import CustomerProjects from "../components/CustomerProjects";

const resizeLogo = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const maxDim = 300;
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
                resolve(canvas.toDataURL("image/png"));
            } else {
                resolve(base64Str);
            }
        };
        img.onerror = () => {
            resolve(base64Str);
        };
    });
};

export default function CustomersPage() {
    const { customers, addCustomer, activeCustomer, setActiveCustomer, updateCustomer, deleteCustomer } = useAudit();
    const [searchTerm, setSearchTerm] = useState("");

    // Create State
    const [showAddForm, setShowAddForm] = useState(false);
    const [newCustomer, setNewCustomer] = useState({
        name: '', address: '', contact_person: '', email: '', phone: '', logo_url: ''
    });

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({
        name: '', address: '', contact_person: '', email: '', phone: '', logo_url: ''
    });

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contact_person.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSaveCustomer = (e: React.FormEvent) => {
        e.preventDefault();
        addCustomer({
            id: Math.random().toString(36).substr(2, 9),
            ...newCustomer
        });
        setNewCustomer({ name: '', address: '', contact_person: '', email: '', phone: '', logo_url: '' });
        setShowAddForm(false);
    };

    const startEdit = (e: React.MouseEvent, c: any) => {
        e.stopPropagation();
        setEditingId(c.id);
        setEditForm({
            name: c.name,
            address: c.address,
            contact_person: c.contact_person,
            email: c.email,
            phone: c.phone,
            logo_url: c.logo_url || ''
        });
    };

    const handleUpdate = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        updateCustomer(id, editForm);
        setEditingId(null);
    };

    const handleDeleteCustomerClick = (e: React.MouseEvent, id: string, name: string) => {
        e.stopPropagation();
        if (window.confirm(`"${name}" müşterisini ve müşteriye ait tüm projeleri, risk kayıtlarını silmek istediğinizden emin misiniz?`)) {
            deleteCustomer(id);
        }
    };

    return (
        // Global Container Layer
        <div className="bg-[#F8F9FA] min-h-screen -mx-4 -my-4 p-8">
            <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] gap-8">

                {/* LEFT: Customer List */}
                <div className="w-full lg:w-1/3 flex flex-col bg-white rounded-[32px] shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 bg-white">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#FFD600] text-black">
                                    <Users className="size-5" />
                                </span>
                                Müşteriler
                            </h2>
                            <button
                                onClick={() => setShowAddForm(!showAddForm)}
                                className="w-10 h-10 flex items-center justify-center bg-gray-900 text-white rounded-xl hover:bg-black transition-colors shadow-lg shadow-gray-200"
                            >
                                <Plus className="size-5" />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                            <input
                                type="text"
                                placeholder="Müşteri veya yetkili ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-[#FFD600] rounded-xl py-3 pl-10 pr-4 text-sm font-medium outline-none transition-all placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    {showAddForm && (
                        <div className="p-6 bg-yellow-50/50 border-b border-yellow-100 animate-in slide-in-from-top-4 duration-300">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Yeni Müşteri Ekle</h3>
                            <form onSubmit={handleSaveCustomer} className="space-y-4">
                                <input required placeholder="Firma Adı" className="input-field"
                                    value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} />

                                <textarea required rows={2} placeholder="Adres" className="input-field resize-none"
                                    value={newCustomer.address} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} />

                                <input required placeholder="Yetkili Kişi" className="input-field"
                                    value={newCustomer.contact_person} onChange={e => setNewCustomer({ ...newCustomer, contact_person: e.target.value })} />

                                <div className="grid grid-cols-2 gap-3">
                                    <input placeholder="Telefon" className="input-field"
                                        value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
                                    <input placeholder="E-posta" className="input-field"
                                        value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} />
                                </div>

                                <div className="mt-2">
                                    <label className="text-xs font-bold text-gray-700 block mb-1">Müşteri Logosu</label>
                                    {newCustomer.logo_url ? (
                                        <div className="relative w-24 h-24 border border-gray-200 rounded-xl overflow-hidden bg-white group">
                                            <img src={newCustomer.logo_url} alt="Logo önizleme" className="w-full h-full object-contain p-1" />
                                            <button
                                                type="button"
                                                onClick={() => setNewCustomer({ ...newCustomer, logo_url: '' })}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-3 cursor-pointer hover:bg-gray-50 transition-colors bg-white">
                                            <Upload className="size-5 text-gray-400 mb-1" />
                                            <span className="text-xs text-gray-500 font-medium">Logo Yükle</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = async () => {
                                                            const resized = await resizeLogo(reader.result as string);
                                                            setNewCustomer({ ...newCustomer, logo_url: resized });
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                        </label>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-2.5 text-sm font-bold bg-white text-gray-500 rounded-xl border border-gray-200 hover:bg-gray-50">İptal</button>
                                    <button type="submit" className="flex-1 py-2.5 text-sm font-bold bg-[#FFD600] text-black rounded-xl hover:bg-[#face15] shadow-sm">Kaydet</button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
                        {customers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                                <Users className="size-8 mb-3 opacity-20" />
                                <p className="text-sm font-medium">Henüz kayıtlı müşteri yok.</p>
                            </div>
                        ) : (
                            filteredCustomers.map(c => (
                                <div
                                    key={c.id}
                                    onClick={() => !editingId && setActiveCustomer(c)}
                                    className={`p-4 rounded-2xl cursor-pointer transition-all border-2 group relative
                                        ${activeCustomer?.id === c.id
                                            ? 'bg-white border-[#FFD600] shadow-md z-10'
                                            : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-100'
                                        }`}
                                >
                                    {editingId === c.id ? (
                                        <div className="space-y-3 p-1">
                                            {/* Edit Mode Inputs */}
                                            <div>
                                                <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Firma Adı</label>
                                                <input className="input-field-sm" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Yetkili</label>
                                                <input className="input-field-sm" value={editForm.contact_person} onChange={e => setEditForm({ ...editForm, contact_person: e.target.value })} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input className="input-field-sm" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                                                <input className="input-field-sm" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Müşteri Logosu</label>
                                                {editForm.logo_url ? (
                                                    <div className="relative w-16 h-16 border border-gray-200 rounded-lg overflow-hidden bg-white">
                                                        <img src={editForm.logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditForm({ ...editForm, logo_url: '' })}
                                                            className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600 transition-colors"
                                                        >
                                                            <X className="size-2.5" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label className="flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-lg p-2 cursor-pointer hover:bg-gray-50 transition-colors bg-white">
                                                        <Upload className="size-4 text-gray-400" />
                                                        <span className="text-[10px] text-gray-500 font-medium">Yükle</span>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    const reader = new FileReader();
                                                                    reader.onloadend = async () => {
                                                                        const resized = await resizeLogo(reader.result as string);
                                                                        setEditForm({ ...editForm, logo_url: resized });
                                                                    };
                                                                    reader.readAsDataURL(file);
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <button onClick={() => setEditingId(null)} className="flex-1 py-1.5 text-xs font-bold bg-gray-100 rounded-lg hover:bg-gray-200">İptal</button>
                                                <button onClick={(e) => handleUpdate(e, c.id)} className="flex-1 py-1.5 text-xs font-bold bg-green-500 text-white rounded-lg hover:bg-green-600">Kaydet</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                <button onClick={(e) => startEdit(e, c)} className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors"><Edit2 className="size-4" /></button>
                                                <button onClick={(e) => handleDeleteCustomerClick(e, c.id, c.name)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"><Trash2 className="size-4" /></button>
                                            </div>

                                            <div className="flex gap-3 items-start mb-2 pr-8">
                                                {c.logo_url ? (
                                                    <div className="w-10 h-10 border border-gray-100 rounded-xl flex items-center justify-center overflow-hidden shrink-0 bg-white shadow-sm">
                                                        <img src={c.logo_url} alt="" className="w-full h-full object-contain p-0.5" />
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 shrink-0">
                                                        <Building className="size-5 text-gray-400" />
                                                    </div>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-bold text-gray-900 text-base leading-snug truncate">{c.name}</h3>
                                                    <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mt-0.5">
                                                        <Users className="size-3 text-gray-400" /> {c.contact_person}
                                                    </p>
                                                    {c.address && (
                                                        <p className="text-[11px] text-gray-400 truncate flex items-center gap-1.5 mt-0.5">
                                                            <MapPin className="size-3 text-gray-400" /> {c.address}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {activeCustomer?.id === c.id && (
                                                <div className="absolute right-4 bottom-4">
                                                    <div className="w-8 h-8 bg-[#FFD600] rounded-full flex items-center justify-center text-black shadow-sm">
                                                        <ChevronRight className="size-5" />
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT: Detail & Projects */}
                <div className="flex-1 bg-white rounded-[32px] border border-gray-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] p-8 overflow-y-auto">
                    {activeCustomer ? (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-gray-100 pb-8 mb-8">
                                <div className="space-y-4">
                                    <div>
                                        <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-black tracking-wider uppercase mb-3">Seçili Müşteri</span>
                                        <h1 className="text-4xl font-black text-gray-900 tracking-tight lg:text-5xl">{activeCustomer.name}</h1>
                                    </div>

                                    <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-medium text-gray-500">
                                        <span className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg"><MapPin className="size-4 text-gray-400" /> {activeCustomer.address}</span>
                                        <span className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg"><Users className="size-4 text-gray-400" /> {activeCustomer.contact_person}</span>
                                        <span className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg"><Mail className="size-4 text-gray-400" /> {activeCustomer.email || '-'}</span>
                                        <span className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg"><Phone className="size-4 text-gray-400" /> {activeCustomer.phone || '-'}</span>
                                    </div>
                                </div>

                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 shadow-lg shadow-gray-100 border border-gray-100 bg-white">
                                    {activeCustomer.logo_url ? (
                                        <img src={activeCustomer.logo_url} alt="Müşteri Logosu" className="w-full h-full object-contain p-1.5" />
                                    ) : (
                                        <div className="w-full h-full bg-[#FFD600] flex items-center justify-center text-black">
                                            <Building className="size-8" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <CustomerProjects customerId={activeCustomer.id} />
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                <Building className="size-10 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Müşteri Seçilmedi</h3>
                            <p className="text-gray-500 max-w-sm">Projeleri ve detayları görüntülemek için sol menüden bir müşteri seçiniz veya yeni ekleyiniz.</p>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .input-field {
                    width: 100%;
                    background-color: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    padding: 0.75rem 1rem;
                    font-size: 0.875rem;
                    outline: none;
                    transition: all 0.2s;
                }
                .input-field:focus {
                    border-color: #FFD600;
                    box-shadow: 0 0 0 2px rgba(255, 214, 0, 0.2);
                }
                .input-field-sm {
                    width: 100%;
                    background-color: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 0.5rem 0.75rem;
                    font-size: 0.8rem;
                    outline: none;
                }
                .input-field-sm:focus {
                     border-color: #FFD600;
                }
            `}</style>
        </div>
    );
}
