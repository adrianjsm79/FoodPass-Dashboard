# FoodPass Dashboard - Documentación

## 🎯 Descripción General

Dashboard administrativo para la gestión de comedores institucionales. Permite a administradores, cajeros y otros roles gestionar productos, ventas, tickets, usuarios y reportes.

## 🔐 Control de Acceso

### Roles Autorizados para Acceder al Dashboard:
- ✅ **CAJERO** - Acceso completo al POS y gestión de tickets
- ✅ **ADMIN_INSTITUCION** - Acceso completo a todas las funciones
- ✅ **SUPERADMIN** - Acceso global a todas las instituciones

### Roles NO Autorizados:
- ❌ **USUARIO** - Solo puede comprar desde la app móvil

Cuando un usuario intenta acceder sin autorización, ve el mensaje:
> "No estás autorizado para acceder al panel"

## 🔗 Integración con Backend

El dashboard se conecta con el backend en: `https://foodpass-backend.onrender.com/api`

### Endpoints Utilizados

**POST /api/auth/login**
```json
{
  "correo": "usuario@correo.com",
  "contrasena": "tucontraseña"
}
```

Respuesta:
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "token_largo...",
  "user": {
    "id": "uuid",
    "nombre_completo": "Juan Pérez",
    "correo": "juan@correo.com"
  },
  "instituciones": [
    {
      "id": "uuid",
      "nombre": "Tecsup",
      "slug": "tecsup",
      "rol": "ADMIN_INSTITUCION",
      "logo_url": "..."
    }
  ]
}
```

## 📁 Estructura del Proyecto

```
src/
├── config/
│   └── api.ts                    # Cliente HTTP para llamadas al backend
├── lib/
│   └── auth.ts                   # Utilidades de autenticación y almacenamiento
├── contexts/
│   └── AuthContext.tsx           # Contexto global de autenticación
└── app/
    ├── login/
    │   └── page.tsx              # Página de login
    └── dashboard/
        ├── layout.tsx            # Layout principal del dashboard
        ├── page.tsx              # Página de inicio
        ├── components/
        │   ├── Sidebar.tsx       # Barra lateral navegable
        │   └── Header.tsx        # Encabezado con usuario y botón salir
        ├── ventas/page.tsx       # Gestión de ventas y POS
        ├── productos/page.tsx    # Catálogo de productos
        ├── tickets/page.tsx      # Historial y canje de tickets
        ├── usuarios/page.tsx     # Gestión de usuarios
        ├── reportes/page.tsx     # Reportes y analíticos
        └── configuracion/page.tsx # Configuración de institución
```

## 🎨 Componentes Principales

### Sidebar
- **Nombre de Institución** - Muestra la institución activa
- **Menú Navegable** - 6 secciones principales
- **Botón Colapsar** - Reduce la sidebar a solo iconos
- **Sección Configuración** - Acceso a configuraciones

### Header
- **Saludo Personalizado** - "Bienvenido, {nombre}"
- **Correo del Usuario** - Subtítulo con el email
- **Botón Salir** - Cierra sesión y redirige a login

### Autenticación
- **Login Conectado** - Se autentica con el backend
- **Validación de Roles** - Solo usuarios autorizados entran
- **Almacenamiento Local** - Los datos se guardan en localStorage
- **Toasts Visuales** - Mensajes de error/éxito con Sonner

## 🚀 Configuración Local

### Requisitos
- Node.js 18+
- npm o yarn

### Instalación

```bash
cd foodpass-dashboard

# Instalar dependencias
npm install

# Crear archivo .env (copiar de .env.example)
cp .env.example .env

# Editar .env si es necesario
# NEXT_PUBLIC_API_URL=https://foodpass-backend.onrender.com/api
```

### Desarrollo

```bash
npm run dev
```

Accede a `http://localhost:3000`

### Build para Producción

```bash
npm run build
npm start
```

## 🔄 Flujo de Autenticación

1. **Usuario ingresa credenciales** en `/login`
2. **Dashboard valida** contra el backend
3. **Si tiene rol autorizado**:
   - Guarda tokens y datos en localStorage
   - Redirige a `/dashboard`
4. **Si NO está autorizado**:
   - Muestra toast de error
   - Mantiene en login
5. **En dashboard**:
   - Verifica token en cada navegación
   - Si token falta o es inválido → redirige a login

## 📱 Responsividad

- ✅ Sidebar colapsable para pantallas pequeñas
- ✅ Header adaptable
- ✅ Contenido fluido

## 🎯 Próximas Mejoras

- [ ] Implementar refresh token automático
- [ ] Agregar soporte multi-institución (cambiar institución)
- [ ] Notificaciones en tiempo real (Socket.IO)
- [ ] Temas personalizables
- [ ] Accesibilidad mejorada (WCAG)

## 🐛 Solución de Problemas

**"No estás autorizado para acceder al panel"**
- Verifica que tu usuario tenga un rol diferente a "USUARIO"

**"Error al iniciar sesión"**
- Comprueba que el backend está corriendo
- Verifica que NEXT_PUBLIC_API_URL es correcta

**"Sesión cerrada inesperadamente"**
- Puede ser que el token haya expirado
- Intenta logearte de nuevo

## 📞 Soporte

Para más información, contacta al equipo de desarrollo.
