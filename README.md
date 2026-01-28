# Sistema de Gestion de Alquileres - Puno/Juli

Sistema web completo para administrar propiedades de alquiler en multiples ciudades (Puno y Juli), con gestion de edificios, habitaciones, inquilinos, pagos y gastos.

## Stack Tecnologico

| Componente | Tecnologia |
|------------|------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Estilos** | TailwindCSS |
| **Estado** | Zustand + TanStack Query |
| **Graficos** | Recharts |
| **Backend** | Google Apps Script (REST API) |
| **Base de Datos** | Google Sheets |

---

## Caracteristicas Principales

- **Multi-ciudad**: Gestiona propiedades en Puno y Juli
- **Multi-edificio**: Multiples edificios por ciudad
- **Dashboard interactivo**: Estadisticas en tiempo real con graficos
- **Calendario de pagos**: Visualizacion de pagos por dia de ingreso del inquilino
- **Gestion de gastos fijos**: Control de servicios recurrentes por edificio
- **Vouchers PDF**: Generacion de comprobantes de pago
- **Wizard de edificios**: Creacion rapida de edificio con pisos y habitaciones

---

## Estructura del Proyecto

```
ALQUILER PUNO JULI/
├── backend/
│   └── Code.gs                    # API REST completa (Google Apps Script)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                # Modal, Button, LoadingPage, EmptyState
│   │   │   ├── cards/             # RoomCard, StatCard
│   │   │   ├── forms/             # HabitacionForm, InquilinoForm, PagoForm, GastoForm
│   │   │   ├── calendar/          # PaymentCalendar (calendario de pagos)
│   │   │   ├── layout/            # Sidebar, Header, Layout
│   │   │   └── voucher/           # VoucherPago (PDF)
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx      # Estadisticas y graficos
│   │   │   ├── Edificios.tsx      # Gestion de edificios + Wizard
│   │   │   ├── Habitaciones.tsx   # Grid de habitaciones por piso
│   │   │   ├── Pagos.tsx          # Registro y listado de pagos
│   │   │   ├── Gastos.tsx         # Control de gastos
│   │   │   └── GastosFijos.tsx    # Gastos recurrentes por edificio
│   │   │
│   │   ├── hooks/                 # Custom hooks (React Query)
│   │   ├── services/              # api.ts (conexion con backend)
│   │   ├── store/                 # Zustand stores
│   │   ├── types/                 # TypeScript interfaces
│   │   └── utils/                 # Formatters, constants
│   │
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
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
https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec
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

### Gastos Fijos
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/gastos-fijos?edificioId=X` | Gastos fijos de un edificio |
| POST | `/gastos-fijos` | Crear gasto fijo |

### Reportes
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/reportes/dashboard?mes=X&anio=Y` | Estadisticas del dashboard |
| GET | `/reportes/historico?meses=6` | Historico de ingresos/gastos |

---

## Instalacion y Configuracion

### 1. Clonar el proyecto
```bash
git clone <repo-url>
cd "ALQUILER PUNO JULI"
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
cd frontend

# Instalar dependencias
npm install

# Crear archivo de configuracion
# Editar src/services/api.ts y actualizar API_URL con tu URL de Apps Script

# Iniciar servidor de desarrollo
npm run dev
```

### 4. Build para Produccion
```bash
npm run build
```

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
- Click para ver detalle y registrar inquilino/pago

### Pagos
- Navegacion por mes/anio
- Filtros por concepto (alquiler, internet, servicios)
- Generacion de voucher PDF
- Fecha de pago editable

### Calendario de Pagos
- Muestra cada inquilino en su dia de pago (basado en fecha de ingreso)
- Verde = pagado, Rosa = pendiente, Ambar = mixto
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

## Tipos de Datos (TypeScript)

```typescript
// Estados de habitacion
type EstadoHabitacion = 'vacant' | 'occupied' | 'maintenance';

// Conceptos de pago
type ConceptoPago = 'alquiler' | 'internet' | 'servicios' | 'otro';

// Metodos de pago
type MetodoPago = 'efectivo' | 'yape' | 'plin' | 'transferencia';

// Categorias de gasto
type CategoriaGasto = 'mantenimiento' | 'servicios' | 'limpieza' | 'reparacion' | 'otros';

// Tipos de gasto fijo
type TipoGastoFijo = 'agua' | 'luz' | 'internet' | 'gas' | 'limpieza' | 'vigilancia' | 'otro';
```

---

## Tecnologias Utilizadas

### Frontend
- **React 18** - Biblioteca UI
- **TypeScript** - Tipado estatico
- **Vite** - Build tool rapido
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

---

## Proximas Mejoras

- [ ] Autenticacion de usuarios
- [ ] Notificaciones push de pagos vencidos
- [ ] Exportacion a Excel
- [ ] App movil (React Native)
- [ ] Backup automatico de datos
- [ ] Multi-moneda

---

## Contribuir

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

---

## Licencia

Este proyecto es de uso privado.

---

*Sistema desarrollado para la gestion de propiedades en Puno y Juli*
*Ultima actualizacion: Enero 2026*
