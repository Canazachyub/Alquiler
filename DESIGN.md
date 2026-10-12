# DESIGN.md — Sistema visual "Alquileres Puno/Juli"

Referencia: landing de **Ortto** ("Journeys made simple"). No copiamos la marca: tomamos su
lenguaje visual — fondo cálido casi blanco, tinta azul-noche, titulares grandes y apretados,
**un color por concepto** y tarjetas limpias tipo "nodo" — y lo aplicamos a la gestión de
alquileres.

---

## 1. Principios

1. **Un color = un concepto.** Igual que Ortto pinta "customer data" en verde azulado,
   "messaging" en coral y "analytics" en oliva, aquí cada dominio tiene su color fijo
   (ver §3). El usuario reconoce qué está viendo antes de leer.
2. **Calma por defecto, color con intención.** Superficies neutras y cálidas; el color se
   reserva para íconos-ficha, estados y datos. Nada de degradados decorativos.
3. **Titulares que mandan.** Jerarquía por tamaño y peso, tracking negativo. El texto de
   apoyo es gris cálido y más pequeño.
4. **Tarjetas como nodos.** Cada entidad (habitación, pago, gasto) se ve como un nodo del
   diagrama de Ortto: blanco, borde fino, ficha de ícono circular a color, título en negrita
   y subtítulo gris.
5. **Una acción primaria por pantalla.** Botón píldora azul. Lo secundario es texto-enlace
   con flecha ("Ver detalle →") o botón contorno.

---

## 2. Tokens base

### Superficies y tinta

| Token | Hex | Uso |
|---|---|---|
| `canvas` | `#F5F3F1` | Fondo de la app (crema cálido) |
| `canvas-alt` | `#FAF8F6` | Bandas alternas, cabeceras de tabla |
| `surface` | `#FFFFFF` | Tarjetas, modales, popovers |
| `line` | `#E7E3DF` | Bordes de tarjetas e inputs |
| `line-soft` | `#F0EDEA` | Divisores internos |
| `ink` | `#1B1E2A` | Titulares, texto fuerte, sidebar |
| `ink-2` | `#3F4350` | Texto de cuerpo |
| `muted` | `#6F717B` | Subtítulos, ayudas |
| `subtle` | `#A3A3AA` | Placeholders, ejes de gráficos |

### Acción

| Token | Hex | Uso |
|---|---|---|
| `primary-600` | `#2B5CE6` | CTA (píldora "Get started"), enlaces, foco |
| `primary-700` | `#2149C2` | Hover/active |
| `primary-50` | `#EEF2FE` | Fondo de selección, badges info |

La escala `primary-*` completa vive en `tailwind.config.js`.

### Paleta por concepto (fichas de ícono, gráficos, acentos)

Tomada de los nodos "Add shape" de Ortto:

| Concepto | Token | Hex | Ícono-ficha de Ortto |
|---|---|---|---|
| Habitaciones / ocupación | `teal` | `#44958C` | "customer data" |
| Pagos / ingresos | `leaf` | `#4FA65B` | SMS |
| Inquilinos | `sky` | `#4E9BC9` | Action |
| Gastos | `coral` | `#DF5E41` | "messaging" |
| Vencimientos / plazos | `ochre` | `#E08B35` | Delay |
| Reportes / analítica | `olive` | `#B4A04A` | "analytics" |
| Reglamento / documentos | `violet` | `#8D7AC3` | Condition |
| Edificios / pisos | `pine` | `#3F8977` | Filter |
| Alertas suaves | `rose` | `#E6888A` | Split |

Cada color tiene variante `-50` (fondo de ficha) y `-600/700` (texto sobre fondo claro).

### Semántica de estado

| Estado | Color | Nota |
|---|---|---|
| Pagado / al día | `emerald-600` `#059669` | |
| Pendiente / por vencer | `amber-600` `#D97706` | |
| Deuda / vencido / error | `red-600` `#DC2626` | |
| Vacante / inactivo | `slate-400` | gris cálido |
| Mantenimiento | `violet` | |

Los estados **siempre** llevan texto o ícono además del color (accesibilidad).

---

## 3. Tipografía

- **Familia:** `Inter Tight` para titulares (imita el grotesco apretado de Ortto), `Inter`
  para cuerpo. Números con `tabular-nums`.
- **Escala:**

| Rol | Tamaño / peso / tracking |
|---|---|
| Display (título de página) | 30–36px · 700 · `-0.03em` · `ink` |
| Lead de página | 18px · 400 · `muted` — puede llevar una palabra en color de concepto |
| H2 sección | 18px · 650 · `-0.02em` |
| H3 tarjeta | 15px · 600 |
| Cuerpo | 14px · 400 · `ink-2` |
| Meta / ayuda | 12–13px · 400 · `muted` |
| Eyebrow | 11px · 600 · MAYÚSCULAS · `0.12em` · `muted` ("ALL FEATURES") |
| KPI | 32–40px · 700 · `-0.03em` · tabular |

**Patrón de título de página** (eco del hero de Ortto):

```
EYEBROW · OPERACIÓN
Pagos                                   [ + Registrar pago ]  ← píldora azul
Cobros de octubre 2026 · 12 al día, 3 pendientes
```

---

## 4. Forma, sombra, espaciado

| Elemento | Valor |
|---|---|
| Radio tarjeta | `12px` (`rounded-xl`) |
| Radio input | `10px` |
| Radio botón | `999px` (píldora) |
| Radio ficha de ícono | círculo (`rounded-full`) |
| Sombra tarjeta | `0 1px 2px rgb(27 30 42 / .04), 0 4px 16px -8px rgb(27 30 42 / .08)` |
| Sombra elevada (modal, popover, panel flotante) | `0 24px 48px -24px rgb(27 30 42 / .25)` |
| Espaciado | múltiplos de 4; `gap-4/6` entre tarjetas, `p-5/6` dentro |
| Ancho máx. contenido | `1400px` |

---

## 5. Componentes

### Botones
- `.btn-primary`: píldora azul `primary-600`, texto blanco, 600, alto 40px.
- `.btn-secondary`: píldora blanca, borde `ink` 15 %, texto `ink`.
- `.btn-ghost`: sin borde, hover `canvas`.
- `.link-arrow`: texto `primary-600` 600 + "→" que se desplaza 2px en hover
  ("Learn more →" de Ortto).

### Ficha de ícono (`IconChip`)
Círculo de 36–40px, fondo color de concepto **sólido**, ícono blanco 18px — idéntico a los
nodos Email/SMS/Action. Variante `soft`: fondo `-50`, ícono `-600`.

### Tarjeta KPI (`StatCard`)
```
┌──────────────────────────────┐
│ (●) Ingresos del mes         │  ← ficha + etiqueta muted
│ S/ 3,280                     │  ← KPI 36px ink
│ ▲ 12% vs. mes anterior       │  ← meta
│ ████████████░░░░  65%        │  ← barra de progreso opcional (gauge de Ortto)
└──────────────────────────────┘
```

### Tarjeta nodo (`RoomCard`, ítems de lista)
Blanco, borde `line`, ficha arriba-izquierda, título negrita, subtítulo gris, pie con
métricas en columnas pequeñas (como "2,736 Sent · 98% Delivered · 37% Clicked").

### Tablas
Cabecera `canvas-alt`, texto 12px `muted` 600; filas 52px, divisor `line-soft`, hover
`canvas-alt`. Montos alineados a la derecha, tabulares.

### Segmented control / filtros
Contenedor `canvas` redondeado píldora; opción activa = blanco con sombra suave.

### Modal / panel
Blanco, radio 16px, sombra elevada, título 20px 700 con "×" a la derecha (panel "Add shape").

### Sidebar
Fondo `ink` `#1B1E2A` (el footer oscuro de Ortto). Ítem activo: fondo blanco 8 %,
ícono en su color de concepto. Grupos con eyebrow.

### Header
Blanco translúcido sobre `canvas`, alto 64px, filtros como píldoras.

### Gráficos (Recharts)
- Barras con radio superior 4px, colores de concepto (`leaf` ingresos, `coral` gastos,
  `primary` comparativas), rejilla horizontal punteada `line`, ejes `subtle` 12px sin líneas.
- Tooltip: tarjeta blanca, radio 10px, sombra elevada.

### Estados vacíos
Ficha grande `soft` + título + texto + `.link-arrow` a la acción.

---

## 6. Movimiento
- 150 ms `ease-out` para hover/foco; 200 ms para paneles.
- Tarjetas interactivas: `translateY(-1px)` + sombra elevada.
- Respetar `prefers-reduced-motion`.

---

## 7. Accesibilidad
- Contraste AA: texto `muted` sobre `canvas` ≥ 4.5:1.
- Foco visible: anillo `primary-600` 2px con offset.
- Color nunca es el único portador de significado.
- Objetivos táctiles ≥ 40px en móvil.

---

## 8. Mapa de aplicación por ventana

| Ventana | Color de concepto | Acción primaria |
|---|---|---|
| Dashboard | multi (KPIs con su concepto) | — |
| Habitaciones | `teal` | Nueva habitación |
| Inquilinos | `sky` | Registrar inquilino |
| Pagos | `leaf` | Registrar pago |
| Gastos | `coral` | Registrar gasto |
| Edificios / Pisos | `pine` | Nuevo edificio |
| Ciudades | `pine` | Nueva ciudad |
| Reportes | `olive` | Exportar |
| Configuración | `ink` | Guardar |
