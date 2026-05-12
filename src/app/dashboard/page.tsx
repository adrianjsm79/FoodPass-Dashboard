"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [username, setUsername] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Recuperamos el nombre de usuario de localStorage
    const storedUser = localStorage.getItem("foodpass_user");
    
    if (storedUser) {
      setUsername(storedUser);
    } else {
      // Si no hay usuario guardado, lo devolvemos al login por seguridad
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-10 rounded-2xl shadow-md text-center max-w-lg w-full">
        <div className="bg-[#16883e] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Hola, <span className="text-[#16883e]">{username}</span>
        </h1>
        <p className="text-gray-500">Bienvenido a tu panel de control de FoodPass.</p>
        
        <button 
          onClick={() => {
            localStorage.removeItem("foodpass_user");
            router.push("/login");
          }}
          className="mt-8 text-sm font-semibold text-red-600 hover:text-red-800 hover:underline"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}