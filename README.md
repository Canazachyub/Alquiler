# Sistema de Gestion de Alquileres - Puno/Juli

Sistema web completo para administrar propiedades de alquiler en multiples ciudades (Puno y Juli), con gestion de edificios, habitaciones, ocupantes, pagos y gastos.

## Demo en Vivo

**[https://canazachyub.github.io/Alquiler/](https://canazachyub.github.io/Alquiler/)**

## Stack Tecnologico

| Componente | Tecnologia |
|------------|------------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Estilos** | TailwindCSS (sistema de tokens con paleta slate/indigo) |
| **Estado** | Zustand + TanStack Query |
| **Graficos** | Recharts |
| **PDF** | jsPDF + QRCode |
| **Backend** | Google Apps Script (REST API) |
| **Base de Datos** | Google Sheets |
| **Deploy** | GitHub Pages + GitHub Actions (CI/CD) |

---

## Caracteristicas Principales

- **Multi-ciudad**: Gestiona propiedades en Puno y Juli
- **Multi-edificio**: Multiples edificios por ciudad
- **Dashboard interactivo**: 7 KPIs organizados en 2 filas (3 prominentes + 4 secundarios) y grafico de tendencias
- **Sistema de notificaciones**: Campana con popover que muestra en tiempo real pagos pendientes, vencimientos proximos (3 dias), gastos fijos por vencer y contratos incompletos. Navegacion directa al hacer click en cada alerta
- **Calendario de pagos**: Dia actual resaltado con ring indigo, fines de semana con shade, overflow `+N` cuando hay muchos inquilinos por dia
- **Gestion de habitaciones**: Segmented control de filtros (Todas / Con deuda / Al dia / Vacantes), RoomCard con dot de estado y prioridad semantica (deuda > mantenimiento > pagado > vacante)
- **Gestion de gastos fijos**: Control de servicios recurrentes por edificio con dia de vencimiento
- **Reglamento Interno de Convivencia**: Generacion de PDF con QR a la consulta publica, checkboxes de entrega (garantia + llaves), firma centrada y disclaimer legal que aclara que no es contrato de arrendamiento
- **Vouchers PDF**: Generacion de comprobantes de pago termicos
- **Wizard de edificios**: Creacion rapida de edificio con pisos y habitaciones en un solo paso
- **Mobile-first**: FAB (boton flotante) en paginas operativas (Inquilinos, Pagos, Gastos), drawer de filtros en header movil
- **Consulta publica de ocupante**: Ruta `/consulta?hab=X` accesible via QR del PDF, sin login
- **Deploy automatico**: CI/CD con GitHub Actions hacia GitHub Pages
- **Auto-migracion de DB**: El backend detecta columnas nuevas en `CONFIG.HEADERS` y las agrega automaticamente a la hoja de Google Sheets

---

## Estructura del Proyecto

```
ALQUILER PUNO JULI/
├── .github/
│   └── workflows/
│       └── deploy.yml                   # CI/CD - Deploy automatico a GitHub Pages
│
├── backend/
│   ├── Code.gs                          # API REST completa - UNICA FUENTE del backend
│   └── appsscript.json                  # Config de Apps Script (timezone: America/Lima)
│                                        # No hay compilacion: Code.gs se pega tal cual en Apps Script
│
├── frontend/
│   ├── src/
│   │   ├── api/                         # Clientes API por recurso
│   │   │   ├── client.ts                # Axios + proxy GET para evitar CORS con Apps Script
│   │   │   ├── ciudades.api.ts
│   │   │   ├── edificios.api.ts
│   │   │   ├── pisos.api.ts
│   │   │   ├── habitaciones.api.ts
│   │   │   ├── inquilinos.api.ts
│   │   │   ├── pagos.api.ts
│   │   │   ├── gastos.api.ts
│   │   │   ├── gastosFijos.api.ts
│   │   │   └── reportes.api.ts
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                      # Modal, ConfirmDialog, Loading, EmptyState, Notifications, Fab
│   │   │   ├── cards/                   # RoomCard (con dot), StatCard (prominent prop)
│   │   │   ├── forms/                   # Forms segmentados con fieldsets
│   │   │   │   ├── InquilinoForm.tsx    # 3 fieldsets: personales, contrato, emergencia
│   │   │   │   ├── PagoForm.tsx         # 2 fieldsets: concepto, monto-metodo
│   │   │   │   ├── HabitacionForm.tsx
│   │   │   │   ├── GastoForm.tsx
│   │   │   │   └── EdificioWizard.tsx   # Wizard multi-paso
│   │   │   ├── calendar/                # PaymentCalendar con shade de weekends y +N overflow
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx          # Grupos "Operacion" y "Catalogo", tooltips en colapsado
│   │   │   │   ├── Header.tsx           # Filtros desktop + drawer movil + dropdown mes/año
│   │   │   │   ├── Layout.tsx           # Wrapper con max-width 1600px
│   │   │   │   └── AlertsPopover.tsx    # Popover de notificaciones (nuevo)
│   │   │   └── voucher/
│   │   │       ├── VoucherPago.tsx      # Voucher termico (80mm)
│   │   │       └── ContratoAlquiler.tsx # Reglamento Interno de Convivencia (A4 con QR)
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx            # 3+4 KPIs, grafico, calendario, alertas
│   │   │   ├── Ciudades.tsx
│   │   │   ├── Edificios.tsx            # Lista + Wizard
│   │   │   ├── Pisos.tsx
│   │   │   ├── Habitaciones.tsx         # Segmented control + grid RoomCards + FAB
│   │   │   ├── Inquilinos.tsx           # Tabla con formatDNI + FAB
│   │   │   ├── Pagos.tsx                # Lista por mes + FAB
│   │   │   ├── Gastos.tsx               # FAB
│   │   │   ├── Reportes.tsx
│   │   │   ├── Configuracion.tsx
│   │   │   └── ConsultaInquilino.tsx    # Ruta publica /consulta (sin login)
│   │   │
│   │   ├── hooks/                       # TanStack Query hooks
│   │   │   ├── useCiudades.ts
│   │   │   ├── useEdificios.ts
│   │   │   ├── usePisos.ts
│   │   │   ├── useHabitaciones.ts       # Incluye useHabitacionesConEstadoPago
│   │   │   ├── useInquilinos.ts
│   │   │   ├── usePagos.ts
│   │   │   ├── useGastos.ts
│   │   │   ├── useGastosFijos.ts
│   │   │   ├── useReportes.ts
│   │   │   └── useAlertas.ts            # Deriva alertas de queries cacheadas (nuevo)
│   │   │
│   │   ├── store/                       # Zustand (config global, notificaciones UI)
│   │   ├── types/                       # TypeScript interfaces
│   │   └── utils/
│   │       ├── cn.ts                    # clsx + tailwind-merge
│   │       ├── constants.ts             # API_URL, MESES, METODOS_PAGO, etc.
│   │       └── formatters.ts            # formatCurrency, formatPhone, formatDNI, formatDate
│   │
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js               # Paleta indigo + success/danger/warning + shadow-popover
│   ├── tsconfig.json
│   └── .env                             # VITE_API_URL (gitignored)
│
├── package.json                         # Monorepo (npm workspaces)
└── README.md
```

---

## Sistema de Diseño

**Paleta:** `primary` indigo (`#4f46e5`), neutro unico `slate`, semanticas `emerald/red/amber` para success/danger/warning.

**Tokens globales en `src/index.css`:**
- Botones: `.btn` + variantes `btn-primary`, `btn-outline`/`btn-secondary`, `btn-ghost`, `btn-danger`, `btn-success`. Altura fija `h-10` (sm `h-8`, lg `h-11`).
- Cards: `.card`, `.card-interactive` (con `hover:-translate-y-px + shadow-elevated`).
- Tipografia: `.page-title` (2xl/3xl), `.page-subtitle`, `.fieldset-title` (uppercase tracking-wider small).
- Inputs: `.input`, `.select`, `.label`, `.input-error`, `.form-error`. Focus ring `/40` con offset.
- Tablas: `.table` con `divide-y divide-slate-100`, headers en `normal-case text-xs`.
- Badges: `.badge badge-[success|danger|warning|info|neutral]` con `rounded-full`.
- Sombras: `shadow-soft`, `shadow-card`, `shadow-elevated`, `shadow-popover`.

**Microinteracciones:** `duration-150 ease-out` estandar. Toasts con progress bar via `transform: scaleX()`.

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
                            ├── INQUILINOS/OCUPANTES (1 activo por habitacion)
                            │       │
                            │       └── PAGOS (alquiler, internet, servicios)
                            │
                            └── GASTOS (mantenimiento, reparacion)

GASTOS FIJOS (agua, luz, internet, por edificio)
```

Al eliminar una entidad, el backend cascadea automaticamente:
- Ciudad -> Edificios -> Pisos -> Habitaciones -> Inquilinos -> Pagos/Gastos/GastosFijos
- Edificio -> Pisos -> Habitaciones -> Inquilinos -> Pagos/Gastos/GastosFijos
- Piso -> Habitaciones -> Inquilinos -> Pagos
- Habitacion -> Inquilinos + Pagos
- Inquilino -> Pagos (y libera la habitacion si era el unico activo)

### Hojas de Google Sheets

| Hoja | Campos |
|------|--------|
| **Ciudades** | ID, Nombre, Departamento, Activo, CreatedAt, UpdatedAt |
| **Edificios** | ID, CiudadId, Nombre, Descripcion, Direccion, TotalPisos, Activo |
| **Pisos** | ID, EdificioId, Numero, Descripcion |
| **Habitaciones** | ID, PisoId, Codigo, Ubicacion, MontoAlquiler, MontoInternet, MontoServicios, Estado, Activo, Observaciones |
| **Inquilinos** | ID, HabitacionId, Nombre, Apellido, DNI, Telefono, Email, FechaIngreso, FechaSalida, Estado, ContactoEmergencia, TelefonoEmergencia, Observaciones, **Garantia**, **LlaveHabitacion**, **LlavePuertaCalle** |
| **Pagos** | ID, InquilinoId, HabitacionId, Fecha, Mes, Anio, Concepto, Monto, MetodoPago, Referencia, Estado, Observaciones |
| **Gastos** | ID, EdificioId, HabitacionId, Fecha, Concepto, Categoria, Monto, ComprobanteUrl, Observaciones |
| **GastosFijos** | ID, EdificioId, Tipo, Descripcion, Monto, DiaVencimiento, Activo |

> Los 3 campos en negrita (`Garantia`, `LlaveHabitacion`, `LlavePuertaCalle`) son booleanos que alimentan los checkboxes del Reglamento PDF. Si tu hoja de Inquilinos es antigua y no los tiene, ejecuta `migrateSheets()` desde el menu **Sistema Alquiler** en Google Sheets.

---

## API Endpoints

### Base URL
```
https://script.google.com/macros/s/AKfycbzHbQF_PGclbINecDWJgA9JAAqMMvMvdtTdKveAClCU4ZW3Xt8g3tzfMqgepnuOZuCs/exec
```

Todas las requests se envian como `GET` con parametros `action`, `endpoint` y `data` (JSON stringified) para evitar problemas de CORS con Apps Script.

### Health check / Version
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/ping`, `/health`, `/version` | Devuelve `{ version, timestamp (UTC), localTime (Lima), timezone, spreadsheetId, sheets }` |
| GET | `/` (sin endpoint) | Alias del ping, util para verificar el deploy abriendo la URL en el navegador |

### Ciudades
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/ciudades` | Listar ciudades |
| GET | `/ciudades/{id}` | Obtener una ciudad |
| POST | `/ciudades` | Crear ciudad |
| PUT | `/ciudades/{id}` | Actualizar ciudad |
| DELETE | `/ciudades/{id}` | Eliminar ciudad **con cascada** (edificios, pisos, habitaciones, inquilinos, pagos, gastos, gastos fijos) |

### Edificios
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/edificios` | Listar edificios |
| GET | `/edificios?ciudadId=X` | Filtrar por ciudad |
| GET | `/edificios/{id}` | Obtener un edificio |
| POST | `/edificios` | Crear edificio |
| POST | `/edificios/completo` | **Wizard**: Crear edificio + pisos + habitaciones |
| PUT | `/edificios/{id}` | Actualizar |
| DELETE | `/edificios/{id}` | Eliminar con cascada |

### Pisos
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/pisos` | Listar todos |
| GET | `/pisos?edificioId=X` | Filtrar por edificio |
| POST | `/pisos` | Crear |
| PUT | `/pisos/{id}` | Actualizar |
| DELETE | `/pisos/{id}` | Eliminar con cascada |

### Habitaciones
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/habitaciones` | Listar habitaciones |
| GET | `/habitaciones?pisoId=X` | Filtrar por piso |
| GET | `/habitaciones?estado=occupied` | Filtrar por estado |
| GET | `/habitaciones/estado-pago?mes=X&anio=Y&edificioId=Z` | Con estado de pago del mes (incluye `diaPago`, `nombreInquilino`, `alquilerPagado`, `internetPagado`) |
| POST | `/habitaciones` | Crear habitacion |
| PUT | `/habitaciones/{id}` | Actualizar |
| DELETE | `/habitaciones/{id}` | Eliminar con cascada |

### Inquilinos
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/inquilinos` | Listar todos |
| GET | `/inquilinos?activos=true` | Solo activos |
| GET | `/inquilinos/{id}` | Obtener uno |
| GET | `/inquilinos/habitacion/{habId}` | Inquilino activo de una habitacion |
| POST | `/inquilinos` | Registrar (valida nombre, apellido, habitacion, DNI; marca habitacion como `occupied`) |
| PUT | `/inquilinos/{id}` | Actualizar (si pasa a `estado: inactivo`, libera la habitacion si era el unico activo) |
| DELETE | `/inquilinos/{id}` | Eliminar + pagos en cascada + libera habitacion |

### Pagos
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/pagos` | Listar todos |
| GET | `/pagos?mes=X&anio=Y&edificioId=Z` | Pagos del mes filtrados |
| GET | `/pagos?habitacionId=X` | Por habitacion |
| GET | `/pagos?inquilinoId=X` | Por inquilino |
| GET | `/pagos/{id}` | Obtener uno |
| GET | `/pagos/resumen?mes=X&anio=Y` | Resumen de recaudacion del mes |
| POST | `/pagos` | Registrar pago (valida habitacion, concepto, monto >= 0) |
| PUT | `/pagos/{id}` | Actualizar |
| DELETE | `/pagos/{id}` | Eliminar pago |

### Gastos
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/gastos` | Listar |
| GET | `/gastos?mes=X&anio=Y` | Gastos del mes |
| GET | `/gastos/resumen-categoria?mes=X&anio=Y` | Resumen por categoria |
| POST | `/gastos` | Registrar gasto |
| PUT | `/gastos/{id}` | Actualizar |
| DELETE | `/gastos/{id}` | Eliminar |

### Gastos Fijos
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/gastos-fijos` | Listar |
| GET | `/gastos-fijos?edificioId=X` | Por edificio |
| POST | `/gastos-fijos` | Crear |
| PUT | `/gastos-fijos/{id}` | Actualizar |
| DELETE | `/gastos-fijos/{id}` | Eliminar |

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

### 2. Configurar el Backend (Google Apps Script)

1. Crear un nuevo Google Spreadsheet
2. Ir a **Extensiones > Apps Script**
3. Copiar el contenido de `backend/Code.gs` y `backend/appsscript.json`
4. Actualizar `CONFIG.SPREADSHEET_ID` con el ID de tu Spreadsheet
5. Ejecutar la funcion `initializeDatabase()` para crear las hojas con todos los headers
6. Ejecutar `createTestData()` para datos de prueba (opcional)
7. **Desplegar como Web App**:
   - Implementar > Nueva implementacion > Aplicacion web
   - Ejecutar como: Tu cuenta
   - Acceso: Cualquier persona
   - Copiar la URL generada

Una vez desplegado, al recargar la Spreadsheet aparece el menu **Sistema Alquiler** con los items:
- **Inicializar Base de Datos**: crea hojas si no existen
- **Migrar Headers**: agrega columnas nuevas sin borrar datos (ejecutar despues de cada actualizacion del `CONFIG.HEADERS`)
- **Crear Datos de Prueba**: inserta 2 ciudades, 3 edificios, 13 habitaciones, 8 inquilinos, 18 pagos
- **Ver URL del API**: muestra la URL del Web App

### 3. Configurar el Frontend

```bash
# Instalar dependencias (monorepo, desde la raiz)
npm install

# Crear .env con la URL del API
echo 'VITE_API_URL=https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec' > frontend/.env

# Iniciar servidor de desarrollo (puerto 3000)
npm run dev:frontend
```

Alternativamente, tambien podes editar el fallback en `frontend/src/utils/constants.ts` (util para produccion en GitHub Pages donde el `.env` no se commitea).

### 4. Verificar conexion
Abri la URL del Web App en el navegador. Deberias ver un JSON con:
```json
{ "success": true, "data": { "version": "2026.04.19", "localTime": "2026-04-19 09:21:08", "timezone": "America/Lima", ... } }
```
Si en vez de eso ves el error `Recurso no encontrado: undefined`, significa que estas corriendo una version antigua del backend — copia el `Code.gs` mas reciente y vuelve a desplegar.

### 5. Build para Produccion
```bash
npm run build:frontend
```

---

## Deploy

El proyecto utiliza **GitHub Actions** para deploy automatico a **GitHub Pages**.

### CI/CD Pipeline
- Cada push a `main` dispara el workflow `.github/workflows/deploy.yml`
- Instala dependencias, compila el frontend (`npm run build`) y despliega a GitHub Pages
- Copia `index.html` a `404.html` para routing SPA
- URL de produccion: **https://canazachyub.github.io/Alquiler/**

### Re-deploy del backend (manual)
`backend/Code.gs` es la **unica** fuente del backend: se escribe en JavaScript plano y se pega tal cual en el editor de Apps Script. No existe version TypeScript ni paso de compilacion — hubo una en `backend/src/` que quedo obsoleta y fue eliminada.

A diferencia del frontend, Apps Script **no se redeploya automaticamente**. Si tocas `backend/Code.gs`:

1. Pegar el codigo actualizado en el editor de Apps Script
2. **Implementar > Gestionar implementaciones > editar (lapiz) > Nueva version**
3. La URL `/exec` se mantiene igual
4. Verificar con `/ping` que la `version` devuelta es la mas nueva

### Configuracion de GitHub Pages
1. Ir a **Settings > Pages** en el repositorio
2. En **Source**, seleccionar **GitHub Actions**

---

## Uso del Sistema

### Dashboard
- Fila 1 (3 KPIs prominentes): Tasa de ocupacion, Ingresos del mes, Pagos pendientes
- Fila 2 (4 KPIs secundarios): Total habitaciones, Pagadas, Gastos, Balance
- Grafico de barras ingresos vs gastos (ultimos 6 meses)
- Calendario de pagos con dia actual marcado
- Alerta visible cuando hay habitaciones con deuda

### Notificaciones (campana del header)
Click en la campana abre un popover con alertas agrupadas por severidad:
- **Rojas**: pagos pendientes (habitaciones ocupadas sin pago del mes)
- **Ambar**: vencimientos en los proximos 3 dias; gastos fijos proximos
- **Azules**: contratos incompletos (falta DNI, garantia o llaves)

Cada habitacion genera **una sola** alerta: si vence dentro de 3 dias sale en ambar, si no sale en rojo. Los gastos fijos se acotan al edificio seleccionado en el header.

El badge de la campana muestra el conteo total. Click en cada alerta navega a la pagina correspondiente.

### Habitaciones
- Segmented control de filtros: Todas / Con deuda / Al dia / Vacantes
- Grid de RoomCards con:
  - Dot de estado top-right (rojo/ambar/emerald/slate)
  - Shade sutil de fondo segun estado
  - Prioridad: deuda > mantenimiento > pagado > vacante
  - Piso y edificio bajo el codigo de habitacion
  - Deuda del mes calculada como la suma de alquiler + internet no pagados
- Panel resumen con "Por cobrar" del mes
- FAB en movil para crear nueva habitacion

### Inquilinos
- Tabla con DNI formateado (`70.123.456`) y telefono formateado (`951 234 567`)
- Toggle switch para mostrar inactivos
- Acciones: generar Reglamento PDF, editar, eliminar
- Al registrar, se ofrece descargar el Reglamento Interno de Convivencia
- FAB en movil

### Reglamento Interno de Convivencia (PDF)
Al registrar un inquilino o desde la tabla se genera un PDF A4 con:
- **Titulo**: "Reglamento Interno de Convivencia" (indigo)
- **QR** en tarjeta slate-50 que lleva a `/consulta?hab=X` (consulta publica)
- **Datos del Ocupante**: celular, contacto familiar, correo, codigo de habitacion
- **Entrega**: checkboxes de Garantia, Llave de habitacion, Llave de puerta de calle
- **Fecha de ingreso** y **Aporte mensual** (caja destacada indigo)
- **7 normas de convivencia** numeradas
- **Firma centrada** (sin huella dactilar)
- **Disclaimer legal**: "El presente documento tiene fines exclusivos de registro interno de convivencia y no constituye contrato de arrendamiento ni titulo equivalente para efectos legales, bancarios o tributarios."
- Nombre de archivo: `Reglamento_{Nombre}_{Apellido}_{HAB}.pdf`

### Pagos
- Navegacion por mes/año
- Filtros por concepto (alquiler, internet, servicios)
- Generacion de voucher PDF termico (80mm)
- **Envio por WhatsApp**: el boton "Generar PDF y enviar" arma el voucher y lo hace llegar al numero registrado del inquilino. En celular comparte el PDF real via el menu nativo; en escritorio lo descarga y abre el chat con el mensaje escrito para adjuntarlo. WhatsApp no admite adjuntos desde un enlace web, por eso el segundo paso es manual en escritorio
- Boton "Descargar" para obtener solo el PDF, sin abrir WhatsApp
- Fecha de pago editable
- FAB en movil

### Consulta publica `/consulta?hab=X`
- Ruta sin layout (accesible desde el QR del Reglamento)
- Muestra estado de pago del ocupante (mes actual, historial)
- No requiere autenticacion

### Calendario de Pagos
- Fondo **emerald**: todos pagados
- Fondo **red**: todos pendientes
- Fondo **amber**: mixto
- Dots por inquilino (max 5 + `+N` si hay mas)
- Ring indigo en el dia actual
- Weekend con `bg-slate-50`

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

Los IDs escalan automaticamente a 4 o 5 digitos cuando se superan 999 y 9999 registros respectivamente.

### Codigo de Habitacion
- Letra = Piso (A=1, B=2, C=3...)
- Numero = Posicion en el piso
- Ejemplo: A1, A2, B1, B2, C1, C2

---

## Contribuir / Hacer cambios

### Workflow sugerido
1. Crear rama desde `main`
2. Hacer cambios en `frontend/` o `backend/`
3. Verificar con `cd frontend && npx tsc --noEmit` que el tipado compila
4. Verificar build local con `npm run build:frontend` (descarta problemas de CI)
5. Commit y push
6. Merge a `main` dispara el deploy automatico

### Si agregas columnas nuevas al backend
1. Agregalas al array correspondiente en `CONFIG.HEADERS` de `Code.gs`
2. Redesplegar Apps Script
3. Abrir la Spreadsheet y usar el menu **Sistema Alquiler > Migrar Headers**
4. Si el campo es booleano y debe persistir como tal, agregarlo a la lista de coerciones en `BaseRepository.rowToObject`
5. Si el campo es string pero Google Sheets podria convertirlo a number (DNI, telefonos), agregarlo tambien a `objectToRow` para forzar `String(value)` al escribir

### Si rompes algo en produccion
- Los deploys son idempotentes: revertir el commit y pushear vuelve a la version anterior
- `/ping` te dice que version esta activa en el backend
- Los estados de Apps Script son persistentes — no hay rollback automatico del backend, hay que redesplegar manualmente

---

## Tecnologias Utilizadas

### Frontend
- **React 18** - Biblioteca UI
- **TypeScript** - Tipado estatico
- **Vite 5** - Build tool
- **TailwindCSS 3** - Estilos utilitarios (paleta slate/indigo)
- **TanStack Query 5** - Cache y estado del servidor
- **Zustand** - Estado global (config, UI)
- **React Hook Form** - Manejo de formularios
- **Recharts** - Graficos (ingresos vs gastos)
- **Lucide React** - Iconos (consistentes en todo el proyecto)
- **date-fns** - Manejo de fechas (locale `es`)
- **jsPDF** - Generacion de PDF (Reglamento, Voucher)
- **qrcode** - QR en el Reglamento
- **class-variance-authority + clsx + tailwind-merge** - Variantes de componentes

### Backend
- **Google Apps Script** (V8 runtime) - Backend serverless
- **Google Sheets** - Base de datos
- **Timezone**: `America/Lima` (configurado en `appsscript.json`)

### DevOps
- **GitHub Actions** - CI/CD automatizado
- **GitHub Pages** - Hosting del frontend
- **npm workspaces** - Monorepo frontend + backend

---

## Repositorio

- **Codigo**: [https://github.com/Canazachyub/Alquiler](https://github.com/Canazachyub/Alquiler)
- **Demo**: [https://canazachyub.github.io/Alquiler/](https://canazachyub.github.io/Alquiler/)

---

*Sistema desarrollado para la gestion de propiedades en Puno y Juli*
*Ultima actualizacion: Abril 2026 — version 2026.04.19*
