# Sistema de Gestion de Alquileres - Puno/Juli

Sistema web completo para administrar propiedades de alquiler en multiples ciudades (Puno y Juli), con gestion de edificios, habitaciones, inquilinos, pagos y gastos.

## Demo en Vivo

**[https://canazachyub.github.io/Alquiler/](https://canazachyub.github.io/Alquiler/)**

## Stack Tecnologico

| Componente | Tecnologia |
|------------|------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Estilos** | TailwindCSS |
| **Estado** | Zustand + TanStack Query |
| **Graficos** | Recharts |
| **Backend** | Google Apps Script (REST API) |
| **Base de Datos** | Google Sheets |
| **Deploy** | GitHub Pages + GitHub Actions (CI/CD) |

---

## Caracteristicas Principales

- **Multi-ciudad**: Gestiona propiedades en Puno y Juli
- **Multi-edificio**: Multiples edificios por ciudad
- **Dashboard interactivo**: Estadisticas en tiempo real con graficos
- **Calendario de pagos**: Visualizacion con colores (verde/rosa/ambar) por dia de ingreso del inquilino
- **Gestion de gastos fijos**: Control de servicios recurrentes por edificio
- **Vouchers PDF**: Generacion de comprobantes de pago
- **Wizard de edificios**: Creacion rapida de edificio con pisos y habitaciones
- **Deploy automatico**: CI/CD con GitHub Actions hacia GitHub Pages

---

## Estructura del Proyecto

```
ALQUILER PUNO JULI/
├── .github/
│   └── workflows/
│       └── deploy.yml                # CI/CD - Deploy automatico a GitHub Pages
│
├── backend/
│   └── Code.gs                       # API REST completa (Google Apps Script)
│
├── frontend/
│   ├── src/
│   │   ├── api/                      # Clientes API (ciudades, edificios, pagos, etc.)
│   │   ├── components/
│   │   │   ├── ui/                   # Modal, ConfirmDialog, Loading, EmptyState, Notifications
│   │   │   ├── cards/                # RoomCard, StatCard
│   │   │   ├── forms/                # HabitacionForm, InquilinoForm, PagoForm, GastoForm, EdificioWizard
│   │   │   ├── calendar/             # PaymentCalendar (calendario de pagos con colores)
│   │   │   ├── layout/               # Sidebar, Header, Layout
│   │   │   └── voucher/              # VoucherPago (PDF)
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx         # Estadisticas y graficos
│   │   │   ├── Ciudades.tsx          # Gestion de ciudades
│   │   │   ├── Edificios.tsx         # Gestion de edificios + Wizard
│   │   │   ├── Pisos.tsx             # Gestion de pisos
│   │   │   ├── Habitaciones.tsx      # Grid de habitaciones con estado de pago
│   │   │   ├── Inquilinos.tsx        # Gestion de inquilinos
│   │   │   ├── Pagos.tsx             # Registro y listado de pagos
│   │   │   ├── Gastos.tsx            # Control de gastos
│   │   │   ├── Reportes.tsx          # Reportes y estadisticas
│   │   │   └── Configuracion.tsx     # Configuracion del sistema
│   │   │
│   │   ├── hooks/                    # Custom hooks (React Query)
│   │   ├── store/                    # Zustand stores (config, ui)
│   │   ├── types/                    # TypeScript interfaces
│   │   └── utils/                    # Formatters, constants
│   │
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── package.json                      # Monorepo (npm workspaces)
└── README.md
```

---

## Modelo de Datos

```
CIUDADES (Puno, Juli)
    │
    └── EDIFICIOS
            │
            └── PISOS
                    │
                    └── HABITACIONES
                            │
                            ├── INQUILINOS (1 activo por habitacion)
                            │       │
                            │       └── PAGOS (alquiler, internet, servicios)
                            │
                            └── GASTOS (mantenimiento, reparacion)

GASTOS FIJOS (agua, luz, internet por edificio)
```

### Hojas de Google Sheets

| Hoja | Campos Principales |
|------|-------------------|
| **Ciudades** | ID, Nombre, Departamento, Activo |
| **Edificios** | ID, CiudadId, Nombre, Direccion, TotalPisos |
| **Pisos** | ID, EdificioId, Numero, Descripcion |
| **Habitaciones** | ID, PisoId, Codigo, Ubicacion, MontoAlquiler, MontoInternet, Estado |
| **Inquilinos** | ID, HabitacionId, Nombre, Apellido, DNI, Telefono, FechaIngreso, Estado |
| **Pagos** | ID, InquilinoId, HabitacionId, Fecha, Mes, Anio, Concepto, Monto, MetodoPago |
| **Gastos** | ID, EdificioId, Fecha, Concepto, Categoria, Monto |
| **GastosFijos** | ID, EdificioId, Tipo, Descripcion, Monto, DiaVencimiento |

---

## API Endpoints

### Base URL
```
https://script.google.com/macros/s/AKfycbxpWGNuWzi5b2ejNtZdCNbhZ1ujagSzuFywPGk-6PeGx5nOUBBg2ybbwAMq-xSTrzk/exec
```

### Ciudades
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/ciudades` | Listar ciudades |
| POST | `/ciudades` | Crear ciudad |
| PUT | `/ciudades/{id}` | Actualizar ciudad |

### Edificios
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/edificios` | Listar edificios |
| GET | `/edificios?ciudadId=X` | Filtrar por ciudad |
| POST | `/edificios` | Crear edificio |
| POST | `/edificios/completo` | **Wizard**: Crear edificio + pisos + habitaciones |

### Habitaciones
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/habitaciones` | Listar habitaciones |
| GET | `/habitaciones/estado-pago?mes=X&anio=Y` | Con estado de pago del mes |
| POST | `/habitaciones` | Crear habitacion |
| PUT | `/habitaciones/{id}` | Actualizar |

### Inquilinos
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/inquilinos` | Listar todos |
| GET | `/inquilinos?activos=true` | Solo activos |
| GET | `/inquilinos/habitacion/{habId}` | Inquilino de una habitacion |
| POST | `/inquilinos` | Registrar (cambia estado de habitacion a 'occupied') |

### Pagos
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/pagos?mes=X&anio=Y` | Pagos del mes |
| GET | `/pagos/resumen?mes=X&anio=Y` | Resumen de pagos |
| POST | `/pagos` | Registrar pago |

### Gastos
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/gastos?mes=X&anio=Y` | Gastos del mes |
| POST | `/gastos` | Registrar gasto |
| DELETE | `/gastos/{id}` | Eliminar gasto |

### Gastos Fijos
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/gastos-fijos?edificioId=X` | Gastos fijos de un edificio |
| POST | `/gastos-fijos` | Crear gasto fijo |

### Reportes
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/reportes/dashboard?mes=X&anio=Y` | Estadisticas del dashboard |
| GET | `/reportes/mensual?mes=X&anio=Y` | Reporte mensual detallado |
| GET | `/reportes/historico?meses=6` | Historico de ingresos/gastos |

---

## Instalacion y Configuracion

### 1. Clonar el proyecto
```bash
git clone https://github.com/Canazachyub/Alquiler.git
cd Alquiler
```

### 2. Configurar el Backend

1. Crear un nuevo Google Spreadsheet
2. Ir a **Extensiones > Apps Script**
3. Copiar el contenido de `backend/Code.gs`
4. Actualizar `SPREADSHEET_ID` con el ID de tu Spreadsheet
5. Ejecutar la funcion `initializeDatabase()` para crear las hojas
6. Ejecutar `createTestData()` para datos de prueba (opcional)
7. **Desplegar como Web App**:
   - Implementar > Nueva implementacion > Aplicacion web
   - Ejecutar como: Tu cuenta
   - Acceso: Cualquier persona
   - Copiar la URL generada

### 3. Configurar el Frontend

```bash
# Instalar dependencias (desde la raiz del monorepo)
npm install

# Actualizar la URL del API en frontend/src/utils/constants.ts
# API_URL = 'https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec'

# Iniciar servidor de desarrollo
npm run dev:frontend
```

### 4. Build para Produccion
```bash
npm run build:frontend
```

---

## Deploy

El proyecto utiliza **GitHub Actions** para deploy automatico a **GitHub Pages**.

### CI/CD Pipeline
- Cada push a `main` ejecuta el workflow `.github/workflows/deploy.yml`
- Instala dependencias, compila el frontend y despliega a GitHub Pages
- URL de produccion: **https://canazachyub.github.io/Alquiler/**

### Configuracion de GitHub Pages
1. Ir a **Settings > Pages** en el repositorio
2. En **Source**, seleccionar **GitHub Actions**

---

## Uso del Sistema

### Dashboard
- Vista general con estadisticas del mes actual
- Grafico de ingresos vs gastos (ultimos 6 meses)
- Calendario de pagos por fecha de ingreso de cada inquilino
- Alertas de pagos pendientes

### Edificios
- Lista de edificios por ciudad
- **Wizard de creacion**: Crear edificio completo con pisos y habitaciones en un solo paso
- Gestion de gastos fijos por edificio

### Habitaciones
- Grid visual por piso
- Colores segun estado: Verde (al dia), Rojo (con deuda), Gris (vacante), Amarillo (mantenimiento)
- Muestra dia de pago del inquilino (basado en fecha de ingreso)
- Click para ver detalle y registrar inquilino/pago

### Pagos
- Navegacion por mes/anio
- Filtros por concepto (alquiler, internet, servicios)
- Generacion de voucher PDF
- Fecha de pago editable

### Calendario de Pagos
- Fondo verde = todos pagados
- Fondo rosa = pagos pendientes
- Fondo ambar = mixto (algunos pagados, otros pendientes)
- Contadores numericos por dia
- Click en el dia para ver detalle

---

## Formato de Codigos

| Entidad | Formato | Ejemplo |
|---------|---------|---------|
| Ciudad | C + 3 digitos | C001, C002 |
| Edificio | E + 3 digitos | E001, E002 |
| Piso | P + 3 digitos | P001, P002 |
| Habitacion | H + 3 digitos | H001, H002 |
| Inquilino | I + 3 digitos | I001, I002 |
| Pago | PG + 3 digitos | PG001, PG002 |
| Gasto | G + 3 digitos | G001, G002 |
| Gasto Fijo | GF + 3 digitos | GF001, GF002 |

### Codigo de Habitacion
- Letra = Piso (A=1, B=2, C=3...)
- Numero = Posicion en el piso
- Ejemplo: A1, A2, B1, B2, C1, C2

---

## Tecnologias Utilizadas

### Frontend
- **React 18** - Biblioteca UI
- **TypeScript** - Tipado estatico
- **Vite** - Build tool
- **TailwindCSS** - Estilos utilitarios
- **TanStack Query** - Cache y estado del servidor
- **Zustand** - Estado global
- **React Hook Form** - Manejo de formularios
- **Recharts** - Graficos
- **Lucide React** - Iconos
- **date-fns** - Manejo de fechas
- **jsPDF** - Generacion de PDF

### Backend
- **Google Apps Script** - Runtime JavaScript
- **Google Sheets** - Base de datos

### DevOps
- **GitHub Actions** - CI/CD automatizado
- **GitHub Pages** - Hosting del frontend

---

## Repositorio

- **Codigo**: [https://github.com/Canazachyub/Alquiler](https://github.com/Canazachyub/Alquiler)
- **Demo**: [https://canazachyub.github.io/Alquiler/](https://canazachyub.github.io/Alquiler/)

---

*Sistema desarrollado para la gestion de propiedades en Puno y Juli*
*Ultima actualizacion: Enero 2026*
