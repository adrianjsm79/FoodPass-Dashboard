"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./login.module.css";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() !== "") {
      localStorage.setItem("foodpass_user", username);
      router.push("/dashboard");
    }
  };

  return (
    // 2. Aplicar las clases usando el objeto 'styles'
    <div className={styles.pageContainer}>
      {/* Contenedor Principal */}
      <div className={styles.card}>
        
        {/* LADO IZQUIERDO: Imagen con Veladura de Gradiente */}
        <div className={styles.imageSection}>
          {/* Imagen de fondo */}
          <Image 
            src="/assets/fondo-comedor.png" 
            alt="Comedor Estudiantil"
            fill
            className={styles.backgroundImage}
            priority
          />
          
          {/* Veladura: Gradiente vertical definido en CSS */}
          <div className={styles.overlay}></div>
          
          {/* Logo de marca (Imagen sobre el fondo) */}
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
            {/* Campo Usuario */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Usuario <span className={styles.requiredStar}>*</span>
              </label>
              <input
                type="text"
                placeholder="nombre o correo"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={styles.input}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
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
              className={styles.submitBtn}
            >
              ingresar
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