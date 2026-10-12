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
| **PDF** | jsPDF + QRCode (vouchers, planillas, tracking, reglamento) |
| **Mapas** | Leaflet + OpenStreetMap |
| **Backend** | Google Apps Script (REST API) |
| **Base de Datos** | Google Sheets |
| **Deploy** | GitHub Pages + GitHub Actions (CI/CD) |

---

## Caracteristicas Principales

> Detalle completo de la última versión en [`CHANGELOG.md`](CHANGELOG.md).

- **Multi-ciudad y multi-edificio**, con **mapa de ciudades** y desglose por edificio y piso
- **Vista Edificio**: edificio 3D animado, plano de cada piso y ficha del cuarto con su ciclo de cobro
- **Planos técnicos** por piso (estilo plano de arquitectura) con puertas hacia el pasillo
- **Cobranza por ciclo real** de cada inquilino: al día / por vencer / vencido, con cuenta regresiva
- **Modalidad de pago** por inquilino: adelantado o mes vencido
- **Registrar pago** de varios meses a la vez, con método, N° de operación y quién cobró
- **Historial de pagos editable**, borrar pagos con confirmación
- **Exoneración** de cuartos usados por los propietarios (con motivo) e **internet opcional** por cuarto
- **Servicios prorrateados** (luz, agua, internet como % del alquiler) y seguimiento de facturas
- **Analítica de cobranza** con recomendaciones y fórmulas
- **Documentos PDF**: voucher para celular con QR que se puede tocar, ticket térmico, planilla para marcar a mano, resumen de pagos, hoja de tracking (2 caras) y reglamento formal
- **Consulta pública** `/consulta?hab=X` (QR) que muestra solo los datos del inquilino
- **Responsive**: hojas inferiores en celular, tarjetas en vez de tablas, botones flotantes
- **Deploy automatico** con GitHub Actions hacia GitHub Pages
- **Auto-migracion de DB**: el backend agrega a la hoja las columnas nuevas de `CONFIG.HEADERS`

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

Documentado en [`DESIGN.md`](DESIGN.md). Resumen:

- **Paleta**: fondo cálido `#F5F3F1`, tinta `#1B1E2A`, acción `primary` azul `#2B5CE6` y **un color por concepto**: `teal` habitaciones, `leaf` pagos, `sky` inquilinos, `coral` gastos, `ochre` plazos, `olive` reportes, `violet` documentos, `pine` edificios.
- **Estados de cobro** (componentes `estadoEstilos.ts`): verde al día, ámbar por vencer, rojo vencido, gris vacante, oliva exonerado, violeta mantenimiento.
- **Tipografía**: `Inter Tight` en titulares, `Inter` en cuerpo.
- **Clases globales** en `src/index.css`: `.btn` (píldora), `.card`, `.card-interactive`, `.page-title`, `.eyebrow`, `.segmented`, `.link-arrow`, `.input`, `.select`, `.table`, `.badge`, `.no-scrollbar`.
- **Componentes base**: `IconChip`, `SeccionesTabs`, `SelectorMes`, `Modal` (hoja inferior en celular), `EmptyState`.

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
| **Pisos** | ID, EdificioId, Numero, Descripcion, **Plano** |
| **Habitaciones** | ID, PisoId, Codigo, Ubicacion, MontoAlquiler, MontoInternet, MontoServicios, Estado, Activo, Observaciones, **MotivoExoneracion** |
| **Inquilinos** | ID, HabitacionId, Nombre, Apellido, DNI, Telefono, Email, FechaIngreso, FechaSalida, Estado, ContactoEmergencia, TelefonoEmergencia, Observaciones, **Garantia**, **LlaveHabitacion**, **LlavePuertaCalle**, DniFotoFrenteUrl, DniFotoReversoUrl, ContratoPdfUrl, **ModalidadPago** |
| **Pagos** | ID, InquilinoId, HabitacionId, Fecha, Mes, Anio, Concepto, Monto, MetodoPago, Referencia, Estado, Observaciones, VoucherPdfUrl |
| **Gastos** | ID, EdificioId, HabitacionId, Fecha, Concepto, Categoria, Monto, ComprobanteUrl, Observaciones |
| **GastosFijos** | ID, EdificioId, Tipo, Descripcion, Monto, DiaVencimiento, Activo |

> - `Plano`: distribución del piso en texto (filas separadas por `|`, celdas por espacio; p. ej. `escalera A1 A2|bano pasillo pasillo|A5 A4 A3`).
> - `MotivoExoneracion`: motivo cuando el cuarto está en estado `exonerated` (usado por los propietarios, no se cobra).
> - `ModalidadPago`: `adelantado` (por defecto) o `vencido`.
> - `Garantia`, `LlaveHabitacion`, `LlavePuertaCalle`: booleanos del Reglamento PDF.
> - Si tu hoja es antigua, ejecuta `migrateSheets()` desde el menu **Sistema Alquiler** o simplemente usa la app: la auto-migración agrega las columnas al final.

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

### Consulta publica (QR)
| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/consulta/{habitacionId}` | Solo lo que ve el inquilino: codigo, edificio, monto, primer nombre, fecha de ingreso, modalidad y sus pagos de alquiler. Sin DNI ni telefonos |

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
- KPIs con color por concepto (ocupación, ingresos, pendientes, gastos, balance) que llevan a su sección al tocarlos
- Gráfico ingresos vs gastos y calendario de pagos
- Botón **Registrar pago** (botón flotante en celular)

### Ciclo de cobro y modalidad de pago
- El alquiler de cada mes vence el **día de ingreso** del inquilino (el 31 pasa al último día en meses cortos).
- **Adelantado** (por defecto): el pago del mes M cubre del día de pago de M al día anterior en M+1.
- **Mes vencido**: el pago del mes M vence el mismo día pero cubre el mes ya usado (M−1); el primer cobro llega un mes después de entrar.
- Estado: 🟢 al día · 🟡 por vencer (5 días o menos) · 🔴 vencido (algún mes cuya fecha ya pasó sin pago).

### Habitaciones
- **Tarjetas** agrupadas por edificio → piso (plegables) o vista **Edificio** (3D + plano + ficha).
- Filtros: Todas / Vencidos / Por vencer / Al día / Vacantes.
- Ventana del cuarto con pestañas **Habitación · Inquilino · Registrar pago · Contrato · Tracking · Resumen**.
- Ficha del cuarto: ciclo de cobro con cuenta regresiva, historial de pagos editable, exonerar, activar/quitar internet, DNI (ambas caras) y contrato.
- **Planos**: botón "Dibujar/Editar plano" con plantillas; palabras reservadas `pasillo`, `bano`, `escalera`/`gradas`, `entrada`, `cocina`, `lavanderia`, `patio`, `.` (vacío).

### Inquilinos
- Lista ordenada por edificio → piso → cuarto; tarjetas en celular.
- Formulario con **¿Cuándo paga?** (adelantado / mes vencido) y vista previa del primer periodo.
- Acciones: contrato, archivar en Drive, editar, eliminar; "Dar de baja" desde la ventana del cuarto.

### Pagos
- Indicadores del mes: cobrado (con avance vs esperado), falta cobrar, deuda vencida, por vencer.
- **Cobranza**: cuartos vencidos, por vencer y al día ordenados por urgencia, con botón Cobrar.
- **Pagos del mes**: N° de pago, cuarto, inquilino, mes que cubre, observaciones, voucher y borrar.
- **Imprimir resumen**: planilla para marcar a mano o resumen de lo pagado (una hoja A4).
- **Voucher**: formato celular para WhatsApp/Drive/descarga (QR que se puede tocar) y ticket térmico de 80 mm para imprimir.

### Gastos
- Gastos del mes por categoría.
- **Servicios y facturas**: porcentajes por servicio (modo incluido o adicional), aporte de cada cuarto, situación del mes y facturas con cuenta regresiva y registro de pago. Los porcentajes se guardan en el navegador.

### Reportes
- Histórico de ingresos/gastos y **analítica de cobranza** (puntualidad, atrasos, quién cobra, días de pago, métodos, servicios) con recomendaciones y fórmulas. Exportar PDF.

### Edificios, Pisos y Ciudades
- Edificios: gastos fijos y **vista técnica** (3D + planos estilo plano técnico, ficha al tocar un cuarto).
- Pisos: mostrados por letra y nivel.
- Ciudades: mapa con marcadores por ocupación y desglose por edificio y piso.

### Documentos PDF
| Documento | Dónde | Uso |
|---|---|---|
| Voucher celular | Pagos / Registrar pago | Enviar al inquilino por WhatsApp |
| Ticket 80 mm | Pagos → Imprimir | Impresora térmica |
| Planilla para marcar | Pagos → Imprimir resumen | Respaldo físico a mano |
| Resumen de pagos | Pagos / Reportes → Exportar | Resumen de una hoja |
| Hoja de tracking | Ventana del cuarto → Tracking | Hoja física de 2 caras |
| Reglamento / contrato | Ventana del cuarto → Contrato | Firma del ocupante |

### Consulta publica `/consulta?hab=X`
- Se abre al escanear o **tocar** el QR del voucher o del reglamento; siempre apunta a la página publicada (`URL_PUBLICA` en `utils/constants.ts`).
- Muestra solo: saludo, cuarto, estado, próximo pago con su cobertura y últimos pagos.

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
