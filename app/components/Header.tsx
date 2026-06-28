"use client";

import { useAuth } from "../context/AuthContext";
import { LogOut, User, Bell } from "lucide-react";

export default function Header() {
    const { user, logout } = useAuth();

    return (
        <header className="bg-white border-b border-gray-100 px-8 py-5 flex items-center justify-between sticky top-0 z-40 bg-opacity-90 backdrop-blur-md">
            <div className="flex items-center gap-4">
                {/* Breadcrumbs or Title could go here */}
                <h1 className="text-xl font-black text-gray-900 tracking-tight">CoreSafe - Makine Emniyet Raporlama</h1>
            </div>

            <div className="flex items-center gap-6">
                <button className="relative p-2 text-gray-400 hover:text-black transition-colors">
                    <Bell className="size-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                <div className="h-8 w-px bg-gray-100 mx-2"></div>

                {user ? (
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-gray-900">{user.username}</p>
                            <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] uppercase font-black tracking-wider rounded">
                                {user.role}
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-900 text-[#FFD600] border-2 border-gray-100 flex items-center justify-center font-bold shadow-sm">
                                <User className="size-5" />
                            </div>
                            <button
                                onClick={logout}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                title="Çıkış Yap"
                            >
                                <LogOut className="size-5" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-right">
                        <p className="text-sm font-medium text-gray-400">Giriş Yapılmadı</p>
                    </div>
                )}
            </div>
        </header>
    );
}
