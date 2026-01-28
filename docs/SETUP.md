# Guía de Instalación y Configuración

## Requisitos Previos

- Node.js >= 18.x
- npm >= 9.x
- Cuenta de Google con acceso a Google Sheets y Apps Script
- Git

## 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/alquiler-puno-juli.git
cd alquiler-puno-juli
```

## 2. Configurar el Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Crear archivo de configuración
cp .env.example .env

# Editar .env con la URL de tu API
# VITE_API_URL=https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec

# Iniciar en modo desarrollo
npm run dev
```

El frontend estará disponible en `http://localhost:3000`

## 3. Configurar el Backend (Google Apps Script)

### 3.1 Instalar clasp

```bash
npm install -g @google/clasp
```

### 3.2 Autenticarse con Google

```bash
clasp login
```

Esto abrirá un navegador para autorizar clasp con tu cuenta de Google.

### 3.3 Crear un nuevo proyecto de Apps Script

Opción A: Crear desde cero
```bash
cd backend
clasp create --title "Sistema Alquiler API" --type webapp
```

Opción B: Vincular a un proyecto existente
```bash
cd backend
clasp clone TU_SCRIPT_ID
```

### 3.4 Configurar el Spreadsheet

1. Crea un nuevo Google Spreadsheet
2. Copia el ID del Spreadsheet (está en la URL)
3. Edita `backend/src/config.ts` y actualiza `SPREADSHEET_ID`

### 3.5 Desplegar el Backend

```bash
cd backend

# Instalar dependencias
npm install

# Compilar TypeScript
npm run build

# Subir a Apps Script
npm run push

# Crear deployment
clasp deploy --description "Primera versión"
```

### 3.6 Obtener la URL del API

```bash
clasp open
```

En el editor de Apps Script:
1. Click en "Implementar" > "Nueva implementación"
2. Seleccionar tipo: "Aplicación web"
3. Configurar:
   - Ejecutar como: "Yo"
   - Quién tiene acceso: "Cualquier persona"
4. Click en "Implementar"
5. Copiar la URL del deployment

### 3.7 Actualizar el Frontend

Edita `frontend/.env` con la URL obtenida:
```
VITE_API_URL=https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec
```

## 4. Inicializar la Base de Datos

1. Abre el Google Spreadsheet
2. En el menú, verás "Sistema Alquiler"
3. Click en "Inicializar Base de Datos"
4. (Opcional) Click en "Crear Datos de Prueba"

## 5. Configurar GitHub Actions (CI/CD)

### 5.1 Configurar Secrets en GitHub

Ve a tu repositorio > Settings > Secrets and variables > Actions

Agrega los siguientes secrets:

| Secret | Descripción |
|--------|-------------|
| `API_URL` | URL del deployment de Apps Script |
| `SCRIPT_ID` | ID del proyecto de Apps Script |
| `CLASP_CREDENTIALS` | Contenido del archivo `~/.clasprc.json` |

### 5.2 Obtener CLASP_CREDENTIALS

```bash
cat ~/.clasprc.json
```

Copia todo el contenido JSON y agrégalo como secret.

### 5.3 Configurar GitHub Pages

1. Ve a Settings > Pages
2. En "Source", selecciona "GitHub Actions"

## 6. Verificar Instalación

### Frontend
```bash
cd frontend
npm run dev
```
Abre http://localhost:3000 - deberías ver el dashboard

### Backend
1. Abre la URL del API en el navegador
2. Deberías ver una respuesta JSON

## Comandos Útiles

### Frontend
```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run preview  # Preview del build
npm run lint     # Verificar código
```

### Backend
```bash
npm run build    # Compilar TypeScript
npm run push     # Subir a Apps Script
npm run deploy   # Build + Push + Deploy
npm run open     # Abrir editor online
npm run logs     # Ver logs
```

## Solución de Problemas

### Error de CORS
Si el frontend no puede conectar con el API:
1. Verifica que el deployment sea público
2. Asegúrate de usar la URL correcta del deployment
3. El API debe responder con JSON, no HTML

### Error de autenticación de clasp
```bash
clasp logout
clasp login
```

### El menú no aparece en Sheets
1. Recarga la página del Spreadsheet
2. O ejecuta manualmente `onOpen()` desde el editor de Apps Script

## Estructura de URLs

- Frontend (desarrollo): `http://localhost:3000`
- Frontend (producción): `https://tu-usuario.github.io/alquiler-puno-juli`
- API: `https://script.google.com/macros/s/DEPLOYMENT_ID/exec`
