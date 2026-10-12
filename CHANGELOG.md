# Changelog

## Octubre 2026 — Rediseño completo y cobranza por ciclo

Versión publicada en https://canazachyub.github.io/Alquiler/

### Diseño e interfaz
- **Nuevo sistema visual** documentado en [`DESIGN.md`](DESIGN.md), inspirado en Ortto: fondo cálido, tinta azul noche, titulares grandes y **un color por concepto** (habitaciones verde azulado, pagos verde, gastos coral, reportes oliva, documentos violeta).
- Encabezados de página con eyebrow y ficha de color; botones tipo píldora; pestañas grandes con color por sección.
- **Responsive real**: ventanas tipo hoja inferior en celular, pestañas en cuadrícula, tarjetas en lugar de tablas en móvil, selector de mes compacto `‹ Octubre 2026 ›` compartido.

### Habitaciones
- **Vista Edificio**: edificio 3D animado (ventanas encendidas por estado), plano de cada piso y ficha del cuarto.
- **Planos por piso** editables en texto con plantillas (con baño, sin baño, planta baja) y guardados en la hoja (`Plano`).
- **Vista Tarjetas** agrupada por edificio → piso (en orden de nivel) con cabeceras plegables y contadores.
- Ventana de la habitación con pestañas: **Habitación · Inquilino · Registrar pago · Contrato · Tracking · Resumen**.
- Estado con **interruptor de colores** (Vacante, Ocupado, Mantenimiento, Exonerado) y avisos de coherencia con el inquilino.
- **Exonerar cuartos** (usados por los propietarios) con motivo (`MotivoExoneracion`).
- **Internet opcional**: solo se activa desde la ficha del cuarto.

### Cobranza
- **Ciclo de pago real** por inquilino (no por mes calendario): 🟢 al día, 🟡 por vencer (≤ 5 días), 🔴 vencido.
- **Modalidad de pago** por inquilino (`ModalidadPago`):
  - *Adelantado*: el pago del mes M cubre del día de pago de M al día anterior en M+1.
  - *Mes vencido*: el pago del mes M vence el mismo día pero cubre el mes ya usado (M−1).
- Ficha con cuenta regresiva, último pago, próximo pago y meses atrasados.
- **Historial de pagos editable** por meses desde el ingreso; registrar meses pendientes en la misma tabla.
- **Registrar pago** con elección de varios meses (atrasados, ciclo actual, adelantos, agrupados por año), concepto, método (Yape/Plin con N° de operación) y **quién cobró** (Yubert/Julio/Mamá).
- **Borrar pagos** con confirmación.
- Página **Pagos** reorganizada: indicadores del mes, pestaña **Cobranza** por urgencia y pestaña de pagos registrados.
- Botón **Registrar pago** también en el Dashboard.

### Documentos imprimibles (PDF)
- **Planilla de cobros para marcar a mano** (estilo registro HIS, cuadrícula tipo Excel): Pagó · Fecha · Y/J/M por mes, fechas de vencimiento impresas y filas libres.
- **Resumen de pagos** de una hoja con puntitos de color, periodo cubierto e iniciales de quien cobró.
- **Hoja de tracking** de 2 caras (formato de la hoja física): alquiler por mes con DE/HASTA y firma, más sección de internet.
- **Contrato / reglamento** con estilo formal (doble marco, letra con serifa, tabla de datos del ocupante).
- **Voucher para celular** (WhatsApp, Drive y descarga): sello PAGADO, monto en letras, periodo que cubre, próximo pago y **QR que se puede tocar** para abrir la consulta. El ticket térmico de 80 mm se mantiene para imprimir.

### Gastos y servicios
- Pestaña **Servicios y facturas**: aporte por cuarto como % del alquiler (luz 5 %, agua 3 %, internet 1 %, editables; modo incluido o adicional), situación del mes por servicio y seguimiento de facturas con cuenta regresiva y registro de pago.

### Reportes
- **Analítica de cobranza**: puntualidad, atraso promedio y mediana, quién cobra más, puntualidad por inquilino, días del mes en que pagan, métodos de pago, servicios y **recomendaciones con su fórmula**.
- Botón **Exportar PDF** funcional.

### Edificios y ciudades
- **Vista técnica** del edificio: 3D + **planos estilo plano técnico** (cuadrícula, ejes, cotas, cajetín), puertas hacia el pasillo y ficha al tocar un cuarto.
- **Mapa de ciudades** (OpenStreetMap/Leaflet) con desglose de edificios y pisos por ciudad.
- Pisos mostrados por **letra** (cada letra es un piso alquilado) y nivel.

### Consulta pública (QR)
- Página sobria para el inquilino: saludo, estado, próximo pago con su cobertura y últimos pagos. Sin DNI, teléfonos ni datos de otros cuartos.
- Nueva ruta de backend `GET /consulta/{habitacionId}` que devuelve solo esos datos.

### Correcciones de lógica
- El formulario de pago ignoraba el cuarto y el concepto elegidos.
- Dashboard y Reportes ignoraban el mes y la ciudad seleccionados.
- Datos desactualizados tras pagar/borrar (invalidación global de caché).
- Fechas por defecto en UTC (después de las 19:00 salía el día siguiente).
- DNI mostrado con 8 dígitos (Sheets borra el 0 inicial); montos en 0 sobrescritos por valores por defecto.
- Filtro de ciudad aplicado en Habitaciones, Pagos, Gastos y Reportes.

### Backend (`backend/Code.gs`)
Columnas nuevas (la auto-migración las agrega al final de cada hoja):

| Hoja | Columna |
|---|---|
| PISOS | `Plano` |
| HABITACIONES | `MotivoExoneracion` |
| INQUILINOS | `ModalidadPago` |

Estado de habitación nuevo: `exonerated`. Ruta nueva: `GET /consulta/{habitacionId}`.
