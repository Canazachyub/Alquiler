# PLAN — Fotos DNI, WhatsApp, aviso semanal e integración inquilinos↔habitaciones

Fecha: 2026-08-31
Estado: **Fase 2 — código implementado. Pendiente el despliegue manual del backend.**
Enfoque elegido: **B — backend enriquecido, entrega por etapas.**

## Desviación respecto al plan original

El plan preveía **dos redeploys** de Apps Script, uno por la Etapa 2 y otro por la Etapa 3. Como
ambas etapas modifican el mismo y único archivo (`backend/Code.gs`), separarlas obligaría a pegar el
archivo dos veces sin ganar nada: el segundo pegado incluiría igual el código de la primera.

Se consolidó en **un solo pegado de `Code.gs`**. El orden de verificación se mantiene intacto:
primero se prueba la subida a Drive (que es el riesgo real), y sólo después se activa el disparador
del correo. Ningún comportamiento cambia; se reduce trabajo manual.

---

## 1. Objetivo

Cuatro funcionalidades nuevas y una limpieza de deuda técnica, entregadas en tres etapas verificables por separado, aprovechando que el frontend se despliega solo con cada push y el backend requiere redeploy manual.

1. Captura de foto de ambas caras del DNI en el alta de inquilino, guardadas en Google Drive.
2. Aclarar ciudad y edificio en el formulario de inquilino.
3. Envío del voucher de pago por WhatsApp al número registrado del inquilino.
4. Correo semanal automático al administrador, cada domingo, con los vencimientos de la semana.
5. Arreglo de la integración inquilinos↔habitaciones y limpieza de código muerto.
6. **Archivo documental en Drive**: contratos y vouchers, hoy sólo descargables, pasan a poder guardarse en Drive con estructura por ciudad y edificio.

**Punto de partida:** hoy no se guarda nada en Drive. Los PDFs se arman en el navegador con jsPDF y terminan en `doc.save()` — `ContratoAlquiler.tsx:483` y `VoucherPago.tsx:456` — y sólo se descargan al equipo. No queda copia en ningún lado. El backend actual no tiene una sola llamada a `DriveApp`.

---

## 2. Decisiones tomadas

| Tema | Decisión |
|---|---|
| Enfoque | B — join en backend, entrega en 3 etapas |
| WhatsApp | Compartir nativo en Android + respaldo descarga-y-abrir-chat en escritorio |
| Captura DNI | Botón que abre la cámara del dispositivo (`input file` con `capture`) |
| Carpeta raíz de Drive | `1pMamGQnr-cKbovWE8H0ZeVEJa0moN3HH` — **confirmada por el usuario** |
| Organización en Drive | Híbrida: `Inquilinos/{Ciudad}/{Edificio}/{Hab - Nombre}/` para DNI y contrato; `Inquilinos/{Ciudad}/{Edificio}/Vouchers/{AAAA-MM}/` para los vouchers |
| Momento de subida | **Manual**, con botón «Guardar en Drive», para contrato y voucher. Las fotos de DNI suben con el guardado del inquilino, por ser un campo del formulario |
| Histórico existente | No se migra. Drive se puebla desde ahora en adelante |
| Privacidad | Todos los archivos **privados** en Drive, heredando permisos de la carpeta. El sistema guarda el enlace, no el archivo |
| Contenido del correo | Vencen esta semana **+** vencidos sin pagar, con total a cobrar |
| Alcance del correo | Todos los edificios, agrupado por ciudad y edificio |
| Destinatarios del correo | `canazach12@gmail.com` y `canazaarturo@gmail.com` (ambos en `to`, se ven entre sí) |
| Archivos legacy | Borrar las copias de la raíz, conservar `legacy/` |
| Seguridad del backend | Solo documentar el riesgo (ver §7). Sin acción en este ciclo |
| Fuera de alcance | Configuración real/mora, gastos fijos en el balance |

---

## 3. Diagnóstico que motiva el trabajo

Verificado en el código, no supuesto:

- **`GET /inquilinos` no hace join de habitación.** `/pagos` sí lo hace en `Code.gs:933-938`; inquilinos no. Por eso `Inquilinos.tsx:249` (`inq.habitacion?.codigo || inq.habitacionId`) cae siempre al fallback y la tabla muestra `H006`, `H010`, `H034` en vez de `B2`, `C4`, `E1`.
- **`RoomCard.tsx:68` lee `habitacion.piso?.numero`**, pero el backend devuelve el campo plano `pisoNumero`. Todas las tarjetas muestran `Piso` seguido de nada.
- **`InquilinoForm` recibe `useHabitaciones()`**, la lista cruda sin piso ni edificio y sin filtrar por la ciudad/edificio seleccionados en el header. Con códigos que se repiten entre edificios (`B2`, `D1`), no hay forma de saber a qué edificio se está asignando al inquilino.
- **`RoomCard` pinta `deudaTotal`** pero ningún endpoint lo calcula: ese bloque nunca se renderiza.
- **`useAlertas.ts:44-81` emite dos alertas por la misma habitación.** El bloque 1 marca `danger` toda habitación ocupada sin pagar; el bloque 2 marca además `warning` a las que vencen en ≤3 días. Una habitación que vence mañana cuenta dos veces en el badge de la campana.
- **`useAlertas` no filtra `gastosFijos` por edificio**, a diferencia de habitaciones.
- **`backend/src/` está muerto y divergió de `Code.gs`**: declara una hoja `INCIDENCIAS` inexistente, le falta `GASTOS_FIJOS`, le falta `VERSION` y `EDIFICIOS` no tiene la columna `Descripcion`. No se compila ni se despliega.
- **Cuatro archivos legacy versionados dos veces**, idénticos byte a byte (MD5 verificado): `Coge.gs`, `Pane.html`, `db_estructure.gs`, `test_data.gs`, en la raíz y en `legacy/`. 262 KB duplicados.

---

## 4. Restricción de plataforma: WhatsApp

**WhatsApp no permite adjuntar un archivo desde un enlace web.** El esquema `wa.me/51XXXXXXXXX?text=...` sólo precarga texto. Adjuntar el PDF de forma automática exige la WhatsApp Business API (cuenta de empresa verificada, proveedor y costo por mensaje). No es una limitación del código.

Comportamiento acordado:

- **Android / móvil con Web Share API nivel 2:** `navigator.share({ files: [pdf] })` comparte el archivo real; el usuario elige WhatsApp y el contacto. El PDF llega como adjunto de verdad.
- **Escritorio y navegadores sin soporte:** se descarga el PDF y se abre `wa.me` con el mensaje del comprobante ya escrito; el usuario adjunta el archivo recién descargado con el clip.

La detección es `navigator.canShare?.({ files: [file] })`, no user-agent sniffing.

---

## 5. Etapas

### Etapa 1 — Solo frontend, sin redeploy de backend

Se despliega sola con el push a `main`. Ningún paso depende del backend.

**Paso 1.1 — Limpieza de deuda técnica**
- Borrar de la raíz: `Coge.gs`, `Pane.html`, `db_estructure.gs`, `test_data.gs`. Se conservan en `legacy/`.
- Borrar `backend/src/` y `backend/dist/` completos, y `backend/tsconfig.json`.
- En `backend/package.json`: quitar el script `build`. **No tocar `devDependencies`** — cambiarlas altera `package-lock.json` y con eso la clave de caché de CI.
- En `package.json` raíz: quitar los scripts `build:backend` y `build:all`, que quedan sin destino.
- En `README.md`: dejar explícito que `backend/Code.gs` es la única fuente del backend y que ya no existe una versión TypeScript.

**Paso 1.2 — `RoomCard.tsx`: arreglar el piso vacío**
- Leer `habitacion.piso?.numero ?? habitacion.pisoNumero`.
- Si no hay número de piso, **no renderizar** la línea, en vez de mostrar `Piso ` colgado.
- Agregar el nombre del edificio como segunda línea cuando esté disponible.

**Paso 1.3 — `RoomCard.tsx` + `Habitaciones.tsx`: deuda real**
- Calcular la deuda con datos que ya llegan: `(alquilerPagado ? 0 : montoAlquiler) + (internetPagado ? 0 : montoInternet)`.
- Pasarla a `RoomCard` para que el bloque rojo de deuda —hoy código muerto— muestre información verdadera.

**Paso 1.4 — `useAlertas.ts`: eliminar la doble alerta**
- Fusionar los bloques 1 y 2 en un único recorrido, con ramas excluyentes:
  - `diaPago` dentro de `[hoy, hoy+3]` → `warning` («Vence en N días»).
  - resto de casos sin pagar → `danger` («Vencido, debía pagar el N» si `diaPago < hoy`; «Pago pendiente del mes» si no se conoce el día).
- Resultado: **una alerta por habitación**, y el badge de la campana deja de contar doble.
- Filtrar `gastosFijos` por `edificioSeleccionado` cuando haya uno, igual que se hace con habitaciones.

**Paso 1.5 — `VoucherPago.tsx`: separar construcción de descarga**
- Extraer `buildVoucherDoc(params): jsPDF` con todo el dibujado actual, sin cambios visuales.
- `generateVoucherPDF()` pasa a ser `buildVoucherDoc()` + `doc.save()`.
- Nuevo `getVoucherBlob(params): Blob` vía `doc.output('blob')`, para poder compartir el archivo.

**Paso 1.6 — Nuevo `utils/whatsapp.ts`**
- `normalizarTelefonoPeru(tel)`: quita todo lo que no sea dígito; si quedan 9 dígitos antepone `51`; si ya viene con `51` y 11 dígitos, lo respeta; si no encaja en ningún caso, devuelve `null`.
- `compartirVoucherWhatsApp({ pago, inquilino, habitacion })`:
  1. Construye el PDF.
  2. Si `navigator.canShare({ files: [file] })` → `navigator.share(...)` con el archivo y el texto.
  3. Si no → `doc.save()` y abre `https://wa.me/<tel>?text=<mensaje>` en pestaña nueva.
  4. Si el inquilino no tiene teléfono válido → sólo descarga y avisa por toast que no hay número registrado.
- Mensaje: negocio, concepto, periodo, monto, habitación y número de comprobante.

**Paso 1.7 — `Pagos.tsx`: cablear el botón**
- «Generar PDF» pasa a ejecutar `compartirVoucherWhatsApp(...)`, tal como pediste: genera y abre WhatsApp.
- El `AbortError` que lanza `navigator.share` cuando el usuario cancela el diálogo **no** se reporta como error.
- Si preferís separar en dos botones («Generar PDF» a secas y «Enviar por WhatsApp»), es un cambio de una línea; queda anotado.

**Criterios de aceptación de la Etapa 1**
- `npx tsc --noEmit` en `frontend/` sale con 0 errores.
- `npm run build:frontend` compila.
- Ninguna tarjeta de habitación muestra `Piso` sin número.
- Una habitación ocupada que vence dentro de 3 días genera **exactamente una** alerta.
- Con un edificio seleccionado, no aparecen alertas de gastos fijos de otros edificios.
- En escritorio, «Generar PDF» descarga el voucher y abre WhatsApp Web con el mensaje escrito y el número correcto.
- En Android, «Generar PDF» abre el menú de compartir con el PDF adjunto.
- La raíz del repo ya no tiene los cuatro archivos legacy; `legacy/` sigue intacto.
- El repo ya no contiene `backend/src/`.

---

### Etapa 2 — Backend + frontend. Requiere redeploy y migración de headers

**Paso 2.1 — `Code.gs`: configuración**

> Estado verificado de la hoja `Inquilinos`: 16 columnas, `A` a `P`, terminando en `LlavePuertaCalle`. Coincide exactamente con `CONFIG.HEADERS.INQUILINOS`, que es el caso seguro de la auto-migración. Las columnas nuevas se agregan **al final**: `Q = DniFotoFrenteUrl`, `R = DniFotoReversoUrl`, `S = ContratoPdfUrl`. Ninguna columna existente se mueve.
>
> Los enlaces viven en la fila del inquilino, así que el formulario los recupera al editar y los muestra como «Ver foto». Si se vuelve a capturar una cara, se reemplaza el archivo en Drive y **se reescribe la misma celda**: la hoja siempre apunta al archivo vigente.

- `CONFIG.VERSION` → `'2026.08.31'`.
- `CONFIG.DRIVE_ROOT_FOLDER_ID = '1pMamGQnr-cKbovWE8H0ZeVEJa0moN3HH'` — carpeta confirmada.
- `CONFIG.ADMIN_EMAILS = ['canazach12@gmail.com', 'canazaarturo@gmail.com']`.
- `CONFIG.HEADERS.INQUILINOS` += `'DniFotoFrenteUrl'`, `'DniFotoReversoUrl'`, `'ContratoPdfUrl'`.
- `CONFIG.HEADERS.PAGOS` += `'VoucherPdfUrl'`.

**Paso 2.2 — `Code.gs`: join de habitación en `GET /inquilinos`**
- Mismo patrón que `/pagos` en `Code.gs:933-938`.
- Cada inquilino devuelve `habitacion: { id, codigo, pisoId, pisoNumero, edificioId, edificioNombre, ciudadId, ciudadNombre }`, o `null` si la habitación fue borrada.
- Aplica al listado, al `getById` y a `/inquilinos/habitacion/{habId}`.
- Coste: el endpoint pasa de leer 1 hoja a leer 4. Con el volumen actual (8 inquilinos, 24 habitaciones) es despreciable.

**Paso 2.3 — `Code.gs`: resolución de carpetas en Drive**
- Helper `getOrCreateFolder(padre, nombre)`: busca por nombre con `getFoldersByName`, crea si no existe.
- Helper `resolverCarpetaInquilino(inquilinoId)` → `Inquilinos/{Ciudad}/{Edificio}/{Codigo} - {Nombre} {Apellido}`.
- Helper `resolverCarpetaVouchers(habitacionId, anio, mes)` → `Inquilinos/{Ciudad}/{Edificio}/Vouchers/{AAAA-MM}`.
- Los nombres se normalizan: sin tildes, sin barras ni caracteres que Drive rechace.
- Los IDs de carpeta ya resueltos se cachean en `CacheService` (6 h) para no repetir la cadena de búsquedas en cada subida.
- Comportamiento conocido y aceptado: si después se renombra un edificio o el inquilino cambia de habitación, los archivos ya subidos **se quedan en la carpeta vieja**; se crea una carpeta nueva para lo siguiente. Reorganizar el pasado queda fuera de alcance.

**Paso 2.4 — `Code.gs`: endpoint único de subida**
- `POST /drive/documento`, cuerpo `{ tipo, inquilinoId?, pagoId?, archivoBase64, mime }`.
- `tipo` ∈ `dni-frente` | `dni-reverso` | `contrato` | `voucher`.
- El servidor **resuelve la carpeta por sí mismo** a partir de la entidad; el frontend nunca manda rutas ni IDs de carpeta.
- `Utilities.base64Decode` → `Utilities.newBlob(bytes, mime, nombre)` → `carpeta.createFile(blob)`.
- Nombres de archivo:
  - `DNI_frente.jpg` / `DNI_reverso.jpg` dentro de la carpeta del inquilino
  - `Reglamento_{AAAA-MM-DD}.pdf`
  - `Voucher_{idPago}_{Codigo}_{Nombre}_{Apellido}.pdf`
- **No** se llama a `setSharing`: cada archivo hereda los permisos de la carpeta raíz y queda privado.
- Guarda `getUrl()` en la columna correspondiente: `DniFotoFrenteUrl`, `DniFotoReversoUrl` y `ContratoPdfUrl` en `Inquilinos`; `VoucherPdfUrl` en `Pagos`.
- Si ya existía un archivo para ese slot, lo reemplaza y manda el anterior a la papelera.
- Validaciones: entidad existente, base64 no vacío, tamaño decodificado ≤ 6 MB, `tipo` conocido.

**Paso 2.5 — `Code.gs`: verificar `doPost`**
- Confirmar que `doPost` (`Code.gs:1212`) enruta `action`/`endpoint`/`data` del cuerpo igual que `doGet`. Existe pero nunca se ejerció en producción.
- **Este es el primer paso que se prueba, aislado y antes de construir nada encima.** Todo el archivo documental depende de él.

**Paso 2.6 — `api/client.ts`: POST real**
- Nueva `apiPostBody<T>(endpoint, data)` con `fetch`, método `POST`, `Content-Type: text/plain;charset=utf-8` y cuerpo `JSON.stringify({ action:'POST', endpoint, data })`.
- El `text/plain` es deliberado: convierte la petición en «simple request» y evita el preflight `OPTIONS` que Apps Script no responde. **No cambiarlo a `application/json`.**
- El resto del cliente sigue con GET; esta vía es sólo para cargas grandes.

**Paso 2.7 — Nuevo `utils/imagen.ts`**
- `comprimirImagen(file, maxAncho = 1280, calidad = 0.72): Promise<string>` — dibuja en `<canvas>`, exporta JPEG base64. Objetivo: 100-250 KB por cara.
- Corrige la orientación EXIF para que las fotos de celular no salgan rotadas.

**Paso 2.8 — Nuevo `components/forms/CapturaDni.tsx`**
- Dos ranuras, «Frente» y «Reverso».
- `<input type="file" accept="image/*" capture="environment">`: en celular abre la cámara, en laptop el explorador.
- Miniatura de lo capturado, peso en KB, botón para volver a tomar y para quitar.
- Estado controlado hacia arriba; no sube nada por su cuenta.

**Paso 2.9 — `InquilinoForm.tsx`: contexto y captura**
- **Banner de contexto** arriba del todo: `Registrando en: PUNO · Casa Progreso`, tomado del store global. Si no hay edificio seleccionado, lo dice y explica que el selector lista habitaciones de todos los edificios.
- **Selector de habitación** agrupado con `<optgroup>` por edificio, con etiquetas `B2 — Piso 2`. Cuando hay edificio seleccionado, se filtra a ese edificio.
- La fuente pasa a ser `useHabitacionesConEstadoPago`, que ya devuelve `edificioNombre` y `pisoNumero`, en lugar de `useHabitaciones`.
- Nuevo fieldset «Documento de identidad» con `CapturaDni`.
- **En edición, el formulario recuerda lo ya guardado**: lee `dniFotoFrenteUrl` y `dniFotoReversoUrl` de la fila del inquilino y muestra cada cara como «Ver foto» con opción de reemplazar. Si se reemplaza, se sube el archivo nuevo, se manda el viejo a la papelera y se reescribe la misma celda de la hoja.

**Paso 2.10 — `Inquilinos.tsx`: consumir el join y subir las fotos**
- Columna «Hab.»: `B2 · Piso 2` con `Casa Progreso` como segunda línea. Se acabó el `H006`.
- El buscador también encuentra por código de habitación y nombre de edificio.
- Tras crear el inquilino, si hay fotos: se suben con `apiPostBody`, con indicador de progreso, antes de ofrecer el Reglamento.
- Si la subida falla, el inquilino **queda creado igual** y se avisa que las fotos se pueden cargar después editándolo. Nunca se pierde el alta por un fallo de subida.

**Paso 2.11 — `ContratoAlquiler.tsx`: separar construcción de descarga**
- Extraer `buildContratoDoc(data): Promise<{ doc: jsPDF; fileName: string }>` con todo el dibujado y el QR actuales, sin cambios visuales. Es `async` porque el QR se genera con `await QRCode.toDataURL`.
- `generateContratoPDF()` pasa a ser `buildContratoDoc()` + `doc.save()`, igual que hoy (`ContratoAlquiler.tsx:483`).
- Nuevo `getContratoBlob(data): Promise<Blob>`.

**Paso 2.12 — Botones «Guardar en Drive»**
- En `Inquilinos.tsx`, junto a «Descargar contrato»: botón que genera el Reglamento y lo sube por `POST /drive/documento` con `tipo: 'contrato'`.
- En el modal de voucher de `Pagos.tsx`: botón que sube el voucher con `tipo: 'voucher'`.
- Ambos con tres estados visibles: inactivo, subiendo, y **guardado** — este último con enlace directo al archivo en Drive, para poder comprobar que quedó.
- Si el documento ya estaba en Drive, el botón lo indica y al volver a pulsarlo reemplaza el archivo.
- Nada de esto es automático: el archivo sólo sube cuando lo pedís.

**Paso 2.13 — `types/index.ts`**
- `Inquilino` += `dniFotoFrenteUrl?`, `dniFotoReversoUrl?`, `contratoPdfUrl?`.
- `Pago` += `voucherPdfUrl?`.
- `Inquilino.habitacion` pasa a reflejar la forma real del join.

**Paso 2.14 — Despliegue (único, cubre también la Etapa 3)**

> **No hace falta duplicar la Spreadsheet.** La auto-migración escribe *únicamente la fila 1*
> (`Code.gs:149`); no hay ningún `setValues` sobre filas de datos. Además Sheets ya ofrece
> *Archivo → Historial de versiones* como marcha atrás. El `.gs` se pega directamente sobre el
> proyecto que ya está funcionando.
>
> **Estructura verificada contra la Spreadsheet real (2026-08-31).** Las 8 hojas gestionadas
> coinciden columna por columna con `CONFIG.HEADERS`, y las columnas destino están libres:
>
> | Hoja | Actual | Esperado | Nuevas |
> |---|---|---|---|
> | Ciudades | `A`–`F` | 6 | — |
> | Edificios | `A`–`G` | 7 | — |
> | Pisos | `A`–`D` | 4 | — |
> | Habitaciones | `A`–`J` | 10 | — |
> | Inquilinos | `A`–`P` | 16 | `Q R S` libres |
> | Pagos | `A`–`L` | 12 | `M` libre |
> | Gastos | `A`–`I` | 9 | — |
> | GastosFijos | `A`–`G` | 7 | — |
>
> La pestaña `asdones` es un remanente del sistema anterior; no figura en `CONFIG.SHEETS`, así que
> el backend la ignora por completo. No interviene en la migración.

1. Pegar `backend/Code.gs` completo en el editor de Apps Script, reemplazando lo que haya.
3. **Autorizar los permisos nuevos**: en el editor, ejecutar a mano cualquier función (por ejemplo
   `migrateSheets`). Google pedirá acceso a Drive y a Gmail, que el script antes no usaba, con la
   advertencia de «app no verificada» → *Configuración avanzada* → continuar.
   **Sin este paso el Web App falla con error de autorización**, porque se despliega ejecutándose
   como la cuenta propietaria y los permisos nuevos todavía no están concedidos.
4. Implementar → Gestionar implementaciones → editar (lápiz) → **Nueva versión** → Implementar.
5. Verificar con `/ping` que `version` dice `2026.08.31`.
6. En la Spreadsheet: menú **Sistema Alquiler → Migrar Headers**.
7. Confirmar que `Inquilinos` tiene las columnas `Q`, `R`, `S` nuevas, `Pagos` su `VoucherPdfUrl`,
   y que ningún dato se corrió de lugar.

**Criterios de aceptación de la Etapa 2**
- `/ping` devuelve `version: 2026.08.31`.
- `GET /inquilinos` devuelve cada inquilino con su objeto `habitacion` poblado.
- La tabla de Inquilinos muestra código de habitación, piso y edificio. Ningún `H0xx` visible.
- El formulario muestra el banner con ciudad y edificio, y el selector agrupado por edificio.
- Con edificio seleccionado, el selector sólo ofrece habitaciones de ese edificio.
- Al registrar con dos fotos, se crea la ruta `Inquilinos/PUNO/Casa Progreso/{Hab} - {Nombre}/` con `DNI_frente.jpg` y `DNI_reverso.jpg` dentro.
- «Guardar en Drive» del contrato deja el PDF en esa misma carpeta del inquilino.
- «Guardar en Drive» del voucher deja el PDF en `Inquilinos/{Ciudad}/{Edificio}/Vouchers/{AAAA-MM}/`.
- Registrar un segundo pago del mismo mes reutiliza la carpeta del periodo, no crea una duplicada.
- Los archivos **no** son accesibles desde una sesión sin permiso (probar en ventana de incógnito).
- Un fallo de subida deja el inquilino o el pago creado igual y avisa; no rompe el registro.
- `npx tsc --noEmit` en 0 errores.

---

### Etapa 3 — Solo backend. No toca el frontend

**Paso 3.1 — `Code.gs`: `getResumenSemanal(fechaBase)`**
- Ventana: **domingo a sábado** de la semana que arranca en `fechaBase`, zona `America/Lima`.
- `diaPago` sale de `fechaIngreso.getDate()`, igual que en `getHabitacionesConEstadoPago` (`Code.gs:481-488`).
- Considera sólo inquilinos `activo` con habitación `occupied`.
- Devuelve dos colecciones:
  - **Vencen esta semana**: `diaPago` cae dentro de la ventana y no hay pago de alquiler registrado del mes en curso.
  - **Vencidos sin pagar**: `diaPago` ya pasó en el mes en curso y sigue sin pago.
- Cada fila: ciudad, edificio, piso, código de habitación, inquilino, teléfono, día de pago, monto, días de atraso.
- Totales por edificio y total general a cobrar.

**Paso 3.2 — `Code.gs`: `enviarResumenSemanal()`**
- Arma un correo HTML agrupado por **ciudad → edificio**, con las dos secciones y los totales.
- Envía con `MailApp.sendEmail({ to: CONFIG.ADMIN_EMAILS.join(','), subject, htmlBody })`.
- **Dos destinatarios**: `canazach12@gmail.com` y `canazaarturo@gmail.com`. Van ambos en `to`, así que cada uno ve que el otro también lo recibió. Si preferís que no se vean entre sí, se cambia a `bcc` con una línea.
- Asunto: `Alquileres · Cobros semana del D al D de MMMM`.
- Si no hay nada en ninguna de las dos listas, manda igual un correo corto diciendo que la semana está limpia — así el silencio no se confunde con un trigger caído.
- Cuota de Gmail para cuenta personal: 100 destinatarios/día. Se usan 2 por semana.

**Paso 3.3 — `Code.gs`: instalación del disparador**
- `instalarTriggerSemanal()`: borra triggers previos del mismo handler para no duplicar, y crea `ScriptApp.newTrigger('enviarResumenSemanal').timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(7).create()`.
- Apps Script agenda por franja horaria: el envío cae entre las 7 y las 8 AM de Lima, no a una hora exacta.

**Paso 3.4 — Menú en Sheets**
- Ampliar `onOpen()` con:
  - **Activar aviso semanal** → `instalarTriggerSemanal`
  - **Enviar resumen ahora (prueba)** → `enviarResumenSemanal`
  - **Desactivar aviso semanal** → borra el trigger

**Paso 3.5 — Prueba (el despliegue ya se hizo en el Paso 2.14)**
1. Ejecutar **Sistema Alquiler → Activar aviso semanal** una vez desde el menú de la Spreadsheet.
2. Ejecutar **Enviar resumen ahora (prueba)** y revisar **ambas** bandejas.
4. Contrastar el contenido del correo contra la pantalla de Habitaciones del mes en curso: los inquilinos, montos y días tienen que coincidir uno a uno.
5. Revisar cómo se ve en el celular, que es donde se va a leer.

**Criterios de aceptación de la Etapa 3**
- La prueba manual llega a **las dos** casillas, con formato legible en celular.
- Las filas coinciden con lo que muestra la app: mismos inquilinos, mismos montos, mismos días.
- Un inquilino que ya pagó el alquiler del mes **no** aparece en ninguna de las dos listas.
- El disparador figura activo en Apps Script → Disparadores, para el domingo entre 7 y 8 AM.
- Ejecutar «Activar aviso semanal» dos veces deja **un solo** disparador, no dos.

---

## 6. Archivos afectados

**Se borran**
- `Coge.gs`, `Pane.html`, `db_estructure.gs`, `test_data.gs` (raíz)
- `backend/src/` (9 archivos), `backend/dist/`, `backend/tsconfig.json`

**Se crean**
- `frontend/src/utils/whatsapp.ts`
- `frontend/src/utils/imagen.ts`
- `frontend/src/components/forms/CapturaDni.tsx`

**Se modifican**
- `backend/Code.gs` — configuración, join de inquilinos, resolución de carpetas y endpoint de Drive, resumen semanal, triggers, menú
- `backend/package.json`, `package.json` — scripts
- `frontend/src/api/client.ts` — POST con cuerpo
- `frontend/src/components/voucher/VoucherPago.tsx` — separar construcción de descarga
- `frontend/src/components/voucher/ContratoAlquiler.tsx` — separar construcción de descarga
- `frontend/src/components/voucher/index.ts` — exports
- `frontend/src/api/inquilinos.api.ts`, `frontend/src/api/pagos.api.ts` — llamadas de subida a Drive
- `frontend/src/components/cards/RoomCard.tsx` — piso, edificio, deuda
- `frontend/src/components/forms/InquilinoForm.tsx` — banner, selector agrupado, captura DNI
- `frontend/src/components/forms/index.ts` — exports
- `frontend/src/pages/Pagos.tsx` — botón WhatsApp
- `frontend/src/pages/Inquilinos.tsx` — columna de habitación, subida de fotos
- `frontend/src/pages/Habitaciones.tsx` — cálculo de deuda
- `frontend/src/hooks/useAlertas.ts` — deduplicación y filtro por edificio
- `frontend/src/types/index.ts` — campos nuevos
- `README.md` — documentación

---

## 7. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| El POST con `text/plain` no atraviesa CORS contra Apps Script | **Alto**: de él dependen DNI, contratos y vouchers | Es el patrón estándar y `doPost` ya existe, pero no está probado contra este deployment. Se prueba **primero**, aislado (Paso 2.5), antes de construir nada encima. Plan B: subida en modo ciego (`no-cors`) y confirmación por GET |
| `Migrar Headers` desalinea columnas | **Bajo** (revisado en el código) | La migración escribe solo la fila 1 (`Code.gs:149`), nunca filas de datos. En `Inquilinos` está verificado que `A`-`P` coinciden y `Q`-`S` están libres. Único punto a revisar: que nadie haya agregado una columna a mano en `Pagos` a partir de `M`. Marcha atrás disponible en *Archivo → Historial de versiones* |
| Estructura de carpetas queda obsoleta al renombrar un edificio o mudar un inquilino | Bajo | Los archivos viejos permanecen donde estaban y los nuevos van a la carpeta nueva. Reorganizar el pasado queda fuera de alcance |
| Apps Script no tiene rollback | Medio | Guardar el `Code.gs` anterior antes de pegar el nuevo. `/ping` dice siempre qué versión está viva |
| El join encarece `GET /inquilinos` | Bajo hoy | 4 hojas en vez de 1. Con el volumen actual, ~1 s. A escala de miles de filas habría que paginar |
| `navigator.share` con archivos no está en todos los navegadores | Bajo | El respaldo de descarga + `wa.me` cubre el 100% de los casos |
| Fotos de DNI pesadas agotan el tiempo de Apps Script | Medio | Compresión en el navegador antes de subir, objetivo 100-250 KB por cara, tope de 4 MB en el servidor |

**Riesgo conocido, documentado y fuera de alcance por decisión tuya:** el Web App está publicado con acceso «Cualquier persona» y su URL viaja hardcodeada en `constants.ts:2`, es decir, dentro del bundle público de GitHub Pages. Quien tenga esa URL puede leer, crear y **borrar en cascada** ciudades enteras sin autenticarse. Los datos incluyen DNI y teléfonos, y a partir de la Etapa 2 también enlaces a fotos de documentos de identidad. Este plan **no** lo corrige.

---

## 8. Datos pendientes antes de implementar

1. **Carpeta de Drive — CONFIRMADA.** `1pMamGQnr-cKbovWE8H0ZeVEJa0moN3HH`, heredada del sistema anterior (`legacy/Coge.gs:1577` y `:2242`, donde servía para backups y una subcarpeta `Comprobantes`). Todo lo nuevo cuelga de una subcarpeta `Inquilinos`, sin tocar lo que ya hay ahí.
2. **Correos del administrador — CONFIRMADOS.** `canazach12@gmail.com` y `canazaarturo@gmail.com`.
3. **Franja horaria del envío del domingo — PENDIENTE.** Propuesta: 7-8 AM, hora de Lima. Es lo único que falta, y sólo afecta al Paso 3.3.

---

## 8-bis. Correcciones aplicadas tras el despliegue

**Desfase de un día en todas las fechas — CORREGIDO.** Las fechas se guardan como medianoche UTC
(el frontend manda `YYYY-MM-DD` y `new Date('2026-06-01')` lo interpreta como `2026-06-01T00:00:00Z`).
Leerlas con `getDate()` en un contexto UTC-5 —el script de Apps Script y el navegador en Perú—
devuelve el día anterior. El dato guardado siempre estuvo bien; el defecto era de lectura.

Corregido con `partesDeFecha()` en el backend y `aFechaCalendario()` en el frontend, que leen los
componentes del propio string ISO en vez de pasar por la zona horaria local. Afectaba a:

- `getHabitacionesConEstadoPago` → `diaPago` (día de pago de cada habitación)
- `getResumenSemanal` → `diaPago` (correo semanal)
- Filtrado de gastos por mes en 5 lugares: `getResumenGastosPorCategoria`, `getDashboardStats`,
  `GET /gastos?mes&anio`, reporte mensual e histórico. Un gasto del día 1 se contaba en el mes
  anterior. Sin impacto visible hoy porque la hoja `Gastos` está vacía.
- `formatDate` del frontend → toda fecha mostrada en tablas (la de ingreso salía un día antes)
- Fecha de ingreso impresa en el **Reglamento PDF**

**Inquilino I004 movido — RESUELTO.** Edwin Pelinco estaba cargado en `H034` (C5, piso 3, BASE 2,
Juli) cuando ocupa `H013` (C5, piso 3, Casa Progreso, Puno). Dos habitaciones con el mismo código
en el mismo piso: exactamente la ambigüedad que motivó el join y el selector agrupado. Se movió el
inquilino y se repuntaron sus pagos PG004 y PG005. Con eso se resolvieron las dos inconsistencias
que había (habitación de Puno ocupada sin inquilino, habitación de Juli vacante con inquilino).

---

## 9. Hallazgos fuera de alcance (detectados al revisar la Spreadsheet)

No se tocaron: quedan documentados para decidir en un ciclo aparte.

1. **`Pagos.InquilinoId` está vacío en todos los registros.** `PagoForm.tsx` nunca envía ese campo.
   Consecuencia real: al eliminar un inquilino, la cascada de `Code.gs:882-884` busca sus pagos con
   `getByField('inquilinoId', id)` y no encuentra ninguno, así que **los pagos quedan huérfanos**.
   Borrar por habitación sí los limpia (`Code.gs:418` cruza por `habitacionId`); borrar por inquilino
   no. Nada de lo implementado en este ciclo depende de ese campo: el resumen semanal y los vouchers
   cruzan por `habitacionId`. Arreglo sugerido: poblar `inquilinoId` al registrar el pago y hacer que
   la cascada busque por ambos campos.

2. **Pestaña `asdones`**: hoja del sistema anterior con datos de prueba (`Juan Pérez`, `Carlos Ruiz`)
   y el esquema viejo de habitaciones. Ignorada por el backend. Se puede borrar.

3. **Códigos de habitación repetidos entre edificios**, confirmado en la hoja: `A1` está en `H001`
   (Casa Progreso) y en `H024` (BASE 2); `B1` en `H004` y `H025`; `C5` en `H013` y `H034`. Es la
   causa de fondo de la confusión que motivó este trabajo, y queda resuelta por el join en
   `/inquilinos` y el selector agrupado por edificio.

---

## 10. Gate

Fase 1 cerrada. No se escribe código hasta recibir **`implementa`**.
