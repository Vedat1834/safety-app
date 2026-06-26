"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/customers");
  }, [router]);

  return (
    <div className="flex h-[calc(100vh-120px)] items-center justify-center bg-[#F8F9FA]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[#FFD600] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-gray-500">Yükleniyor...</p>
      </div>
    </div>
  );
}

