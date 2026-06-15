"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./login.module.css";
import { Eye, EyeOff } from "lucide-react";
import { api } from "@/config/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { isUserAuthorized } from "@/lib/auth";

export default function LoginPage() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setAuth } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!correo.trim() || !contrasena.trim()) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.login(correo, contrasena);
      
      // Verificar si el usuario tiene instituciones y al menos una con rol autorizado
      if (
        !response.instituciones ||
        response.instituciones.length === 0 ||
        !response.instituciones.some((inst: any) => isUserAuthorized(inst.rol))
      ) {
        toast.error("No estás autorizado para acceder al panel");
        setIsLoading(false);
        return;
      }

      // Guardar en contexto de autenticación
      setAuth({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        user: response.user,
        instituciones: response.instituciones,
      });

      toast.success("Sesión iniciada correctamente");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Error de login:", error);
      const errorMessage = error.message || "Error al iniciar sesión";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.card}>
        
        {/* LADO IZQUIERDO: Imagen con Veladura de Gradiente */}
        <div className={styles.imageSection}>
          <Image 
            src="/assets/fondo-comedor.png" 
            alt="Comedor Estudiantil"
            fill
            className={styles.backgroundImage}
            priority
          />
          
          <div className={styles.overlay}></div>
          
          <div className={styles.logoContainer}>
            <div className={styles.logoWrapper}>
              <Image 
                src="/assets/logo-foodpass.png" 
                alt="FoodPass Logo" 
                width={220} 
                height={100}
                className={styles.logoImage}
              />
            </div>
          </div>
        </div>

        {/* LADO DERECHO: Formulario de Ingreso */}
        <div className={styles.formSection}>
          <h2 className={styles.title}>Bienvenido</h2>
          <p className={styles.subtitle}>Ingresa tus credenciales para acceder al panel</p>

          <form onSubmit={handleLogin}>
            {/* Campo Usuario/Correo */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Correo <span className={styles.requiredStar}>*</span>
              </label>
              <input
                type="email"
                placeholder="tu@correo.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                disabled={isLoading}
                required
                className={styles.input}
              />
            </div>

            {/* Campo Clave */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Clave <span className={styles.requiredStar}>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  disabled={isLoading}
                  required
                  className={styles.input}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className={styles.togglePasswordBtn}
                >
                  {showPassword ? (
                    <EyeOff className={styles.icon} />
                  ) : (
                    <Eye className={styles.icon} />
                  )}
                </button>
              </div>
            </div>

            {/* Botón Ingresar */}
            <button
              type="submit"
              disabled={isLoading}
              className={styles.submitBtn}
            >
              {isLoading ? "Cargando..." : "ingresar"}
            </button>
          </form>

          {/* Soporte */}
          <div className={styles.supportText}>
            <span>necesitas ayuda? </span>
            <a href="#" className={styles.supportLink}>contacta con soporte</a>
          </div>
        </div>

      </div>
    </div>
  );
}