"use client";

import { useAudit } from "@/app/context/AuditContext";
import { Project } from "@/app/types";
import { Folder, Plus, Calendar, User, Edit2, X, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CustomerProjects({ customerId }: { customerId: string }) {
    const { projects, setActiveProject, addProject, updateProject, deleteProject } = useAudit();
    const router = useRouter();

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form states
    const [newProject, setNewProject] = useState({
        project_no: '',
        name: '',
        description: ''
    });

    const [editForm, setEditForm] = useState({
        project_no: '',
        name: '',
        description: ''
    });

    const customerProjects = projects.filter(p => p.customer_id === customerId);

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        const project: Project = {
            id: Math.random().toString(36).substr(2, 9),
            customer_id: customerId,
            status: 'Active',
            created_at: new Date().toISOString(),
            report_date: new Date().toISOString().split('T')[0],
            author_name: '', // Empty initially, as requested
            approver_name: '',
            ...newProject
        };
        addProject(project);
        setShowForm(false);
        setNewProject({ project_no: '', name: '', description: '' });
    };

    const startEdit = (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        setEditingId(project.id);
        setEditForm({
            project_no: project.project_no,
            name: project.name,
            description: project.description
        });
    };

    const cancelEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(null);
    };

    const saveEdit = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        updateProject(id, editForm);
        setEditingId(null);
    };

    const handleDeleteProjectClick = (e: React.MouseEvent, id: string, name: string) => {
        e.stopPropagation();
        if (window.confirm(`"${name}" projesini ve projeye ait tüm risk değerlendirmelerini, test kayıtlarını silmek istediğinizden emin misiniz?`)) {
            deleteProject(id);
        }
    };

    const handleSelectProject = (project: Project) => {
        // Don't navigate if clicking edit buttons
        if (editingId) return;
        setActiveProject(project);
        router.push(`/projects/${project.id}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Projeler</h3>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 text-sm bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus className="size-4" />
                    Yeni Proje
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleCreate} className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            required
                            placeholder="Proje No (Örn: PRJ-2024-001)"
                            className="p-2 rounded border focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newProject.project_no}
                            onChange={e => setNewProject({ ...newProject, project_no: e.target.value })}
                        />
                        <input
                            required
                            placeholder="Makine / Hat Adı"
                            className="p-2 rounded border focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newProject.name}
                            onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                        />
                    </div>
                    <input
                        placeholder="Açıklama (Opsiyonel)"
                        className="w-full p-2 rounded border focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newProject.description}
                        onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                    />
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1 text-gray-600 text-sm">İptal</button>
                        <button type="submit" className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">Oluştur</button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customerProjects.length === 0 ? (
                    <p className="col-span-2 text-center text-gray-400 py-8">Bu müşteriye ait proje bulunamadı.</p>
                ) : (
                    customerProjects.map(project => (
                        <div
                            key={project.id}
                            onClick={() => handleSelectProject(project)}
                            className="group cursor-pointer bg-white p-5 rounded-xl border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all relative"
                        >
                            {editingId === project.id ? (
                                /* EDIT MODE */
                                <div className="space-y-3" onClick={e => e.stopPropagation()}>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Proje No</label>
                                        <input
                                            className="w-full p-1 border rounded text-sm font-mono"
                                            value={editForm.project_no}
                                            onChange={e => setEditForm({ ...editForm, project_no: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Makine / Proje Adı</label>
                                        <input
                                            className="w-full p-1 border rounded font-bold"
                                            value={editForm.name}
                                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Açıklama</label>
                                        <textarea
                                            className="w-full p-1 border rounded text-xs resize-none"
                                            value={editForm.description}
                                            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 mt-2 pt-2 border-t">
                                        <button onClick={cancelEdit} className="px-3 py-1 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded">İptal</button>
                                        <button onClick={(e) => saveEdit(e, project.id)} className="px-3 py-1 text-xs bg-green-600 text-white hover:bg-green-700 rounded">Kaydet</button>
                                    </div>
                                </div>
                            ) : (
                                /* VIEW MODE */
                                <>
                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                        <button
                                            onClick={(e) => startEdit(e, project)}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                                        >
                                            <Edit2 className="size-4" />
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteProjectClick(e, project.id, project.name)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>

                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <Folder className="size-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800">{project.name}</h4>
                                                <p className="text-xs text-gray-500 font-mono">{project.project_no}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-gray-500 border-t pt-3 mt-3">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="size-3" />
                                            {new Date(project.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
