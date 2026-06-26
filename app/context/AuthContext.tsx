"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
    username: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    login: (username: string, password: string) => boolean;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    // Check for existing session on mount
    useEffect(() => {
        const storedUser = localStorage.getItem("auth_user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            if (pathname !== "/login") {
                router.push("/login");
            }
        }
    }, []);

    const login = (username: string, password: string) => {
        if (username === "admin" && password === "123456") {
            const userData = { username, role: "Administrator" };
            setUser(userData);
            localStorage.setItem("auth_user", JSON.stringify(userData));
            router.push("/");
            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("auth_user");
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
