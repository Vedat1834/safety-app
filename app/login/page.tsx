"use client";

import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Lock, User } from "lucide-react";

export default function LoginPage() {
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const success = login(username, password);
        if (!success) {
            setError("Kullanıcı adı veya şifre hatalı!");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-black text-slate-800">Giriş Yap</h1>
                    <p className="text-slate-500 text-sm mt-2">Makine Emniyet Raporlama Sistemi</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">Kullanıcı Adı</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-slate-400 size-5" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                                placeholder="Kullanıcı adınızı girin"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">Şifre</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-slate-400 size-5" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                                placeholder="••••••"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg font-medium text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-blue-200"
                    >
                        GİRİŞ YAP
                    </button>

                    <div className="text-center">
                        <span className="text-xs text-slate-400">Default: admin / 123456</span>
                    </div>
                </form>
            </div>
        </div>
    );
}
