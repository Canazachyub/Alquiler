import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Building2, Layers, Home, MapPin } from 'lucide-react';
import { useEdificios, useHabitacionesConEstadoPago, useCobros } from '@/hooks';
import { useConfigStore } from '@/store';
import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/formatters';
import { letraDePiso } from '@/utils/plano';
import type { Ciudad } from '@/types';

// Coordenadas conocidas (las ciudades no guardan lat/lng en la hoja)
const COORDENADAS: Record<string, [number, number]> = {
  PUNO: [-15.8402, -70.0219],
  JULI: [-16.2125, -69.46],
  JULIACA: [-15.4997, -70.1336],
  AREQUIPA: [-16.409, -71.5375],
  CUSCO: [-13.5319, -71.9675],
  LIMA: [-12.0464, -77.0428],
  TACNA: [-18.0146, -70.2536],
  ILAVE: [-16.0866, -69.6383],
  YUNGUYO: [-16.2447, -69.0925],
  AZANGARO: [-14.9085, -70.1964],
};
const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toUpperCase();
const coordDe = (c: Ciudad, i: number): [number, number] =>
  COORDENADAS[normalizar(c.nombre)] ?? [-15.84 - i * 0.05, -70.02 + i * 0.05];

/** Mapa de ciudades con marcadores; al tocar una se ve el desglose de edificios y pisos. */
export function MapaCiudades({ ciudades }: { ciudades: Ciudad[] }) {
  const { mesActual, anioActual } = useConfigStore();
  const { data: edificios } = useEdificios();
  const { data: habs } = useHabitacionesConEstadoPago(mesActual, anioActual);
  const cobros = useCobros();
  const [selId, setSelId] = useState<string | null>(null);
  const mapaRef = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const capa = useRef<L.LayerGroup | null>(null);
  const encuadrado = useRef(false);

  // Resumen por ciudad → edificio → piso
  const resumen = useMemo(() => {
    return ciudades.map((c, i) => {
      const eds = (edificios ?? []).filter((e) => e.ciudadId === c.id);
      const edificiosRes = eds.map((e) => {
        const hs = (habs ?? []).filter((h) => h.edificioId === e.id);
        const pisos = new Map<string, typeof hs>();
        hs.forEach((h) => pisos.set(h.pisoId, [...(pisos.get(h.pisoId) ?? []), h]));
        const pisosRes = [...pisos.values()]
          .map((ph) => ({
            numero: Number(ph[0]?.pisoNumero ?? 0),
            letra: letraDePiso(ph.map((h) => h.codigo)),
            cuartos: ph.length,
            ocupados: ph.filter((h) => h.estado === 'occupied').length,
            vencidos: ph.filter((h) => cobros.estado(h) === 'vencido').length,
          }))
          .sort((a, b) => a.numero - b.numero);
        return {
          id: e.id,
          nombre: e.nombre,
          direccion: e.direccion,
          cuartos: hs.length,
          ocupados: hs.filter((h) => h.estado === 'occupied').length,
          deuda: hs.reduce((s, h) => s + cobros.deuda(h), 0),
          ingresoMensual: hs.filter((h) => h.estado === 'occupied').reduce((s, h) => s + Number(h.montoAlquiler || 0), 0),
          pisos: pisosRes,
        };
      });
      const cuartos = edificiosRes.reduce((s, e) => s + e.cuartos, 0);
      const ocupados = edificiosRes.reduce((s, e) => s + e.ocupados, 0);
      return {
        ciudad: c,
        coord: coordDe(c, i),
        edificios: edificiosRes,
        cuartos,
        ocupados,
        ocupacion: cuartos ? (ocupados / cuartos) * 100 : 0,
      };
    });
  }, [ciudades, edificios, habs, cobros]);

  const sel = resumen.find((r) => r.ciudad.id === selId) ?? [...resumen].sort((a, b) => b.cuartos - a.cuartos)[0];

  // Crear el mapa una vez
  useEffect(() => {
    if (!mapaRef.current || mapa.current) return;
    mapa.current = L.map(mapaRef.current, { zoomControl: true, attributionControl: true }).setView([-15.9, -70.2], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap',
    }).addTo(mapa.current);
    capa.current = L.layerGroup().addTo(mapa.current);
    return () => {
      mapa.current?.remove();
      mapa.current = null;
    };
  }, []);

  // Marcadores: tamaño según cuartos, color según ocupación
  useEffect(() => {
    if (!mapa.current || !capa.current) return;
    capa.current.clearLayers();
    resumen.forEach((r) => {
      const activo = r.ciudad.id === sel?.ciudad.id;
      const color = r.cuartos === 0 ? '#A3A3AA' : r.ocupacion >= 70 ? '#4FA65B' : r.ocupacion >= 40 ? '#E08B35' : '#DF5E41';
      const m = L.circleMarker(r.coord, {
        radius: 10 + Math.min(18, r.cuartos),
        color: activo ? '#2B5CE6' : '#1B1E2A',
        weight: activo ? 4 : 2,
        fillColor: color,
        fillOpacity: 0.85,
      })
        .bindTooltip(`<b>${r.ciudad.nombre}</b><br/>${r.edificios.length} edificios · ${r.cuartos} cuartos`, { direction: 'top' })
        .on('click', () => setSelId(r.ciudad.id));
      capa.current!.addLayer(m);
    });
    // Encuadrar solo la primera vez (no al tocar cada ciudad)
    if (!encuadrado.current && resumen.length) {
      const puntos = resumen.map((r) => r.coord);
      if (puntos.length > 1) mapa.current.fitBounds(L.latLngBounds(puntos), { padding: [40, 40], maxZoom: 9 });
      else mapa.current.setView(puntos[0], 10);
      encuadrado.current = true;
    }
  }, [resumen, sel?.ciudad.id]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
      <div className="card overflow-hidden">
        <div ref={mapaRef} className="h-[320px] md:h-[440px] w-full z-0" aria-label="Mapa de ciudades" />
        <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-2.5 text-xs text-slate-600 border-t border-slate-100">
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#4FA65B]" /> Ocupación ≥ 70%</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#E08B35]" /> 40–69%</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#DF5E41]" /> &lt; 40%</span>
          <span className="ml-auto text-slate-400">Toca una ciudad · tamaño = cantidad de cuartos</span>
        </div>
      </div>

      {sel && (
        <aside className="card p-4 md:p-5 space-y-4" key={sel.ciudad.id}>
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-pine-500 text-white flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">{sel.ciudad.nombre}</h2>
              <p className="text-xs text-slate-500">{sel.ciudad.departamento}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { l: 'Edificios', v: sel.edificios.length },
              { l: 'Cuartos', v: sel.cuartos },
              { l: 'Ocupación', v: `${Math.round(sel.ocupacion)}%` },
            ].map((k) => (
              <div key={k.l} className="rounded-lg bg-slate-50 py-2">
                <p className="font-display text-xl font-bold text-slate-900 tabular-nums">{k.v}</p>
                <p className="text-[11px] text-slate-500">{k.l}</p>
              </div>
            ))}
          </div>

          <ul className="space-y-3 plano-aparecer">
            {sel.edificios.map((e) => (
              <li key={e.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-start gap-2">
                  <Building2 className="w-4 h-4 text-pine-600 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{e.nombre}</p>
                    <p className="text-xs text-slate-500 truncate">{e.direccion}</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 tabular-nums">{e.ocupados}/{e.cuartos}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {e.pisos.map((p) => (
                    <span
                      key={`${e.id}-${p.numero}`}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                        p.vencidos ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-200 bg-white text-slate-700'
                      )}
                      title={`${p.ocupados} de ${p.cuartos} ocupados${p.vencidos ? ` · ${p.vencidos} vencidos` : ''}`}
                    >
                      <Layers className="w-3 h-3" />
                      {p.letra ? `Piso ${p.letra}` : `Piso ${p.numero}`} · {p.ocupados}/{p.cuartos}
                    </span>
                  ))}
                  {!e.pisos.length && <span className="text-xs text-slate-400">Sin cuartos</span>}
                </div>
                <div className="flex justify-between text-xs mt-2.5 pt-2 border-t border-slate-100">
                  <span className="text-slate-500 inline-flex items-center gap-1"><Home className="w-3 h-3" /> Alquiler mensual {formatCurrency(e.ingresoMensual)}</span>
                  {e.deuda > 0 && <span className="font-semibold text-red-600">Debe {formatCurrency(e.deuda)}</span>}
                </div>
              </li>
            ))}
            {!sel.edificios.length && <li className="text-sm text-slate-500">Esta ciudad aún no tiene edificios.</li>}
          </ul>
        </aside>
      )}
    </div>
  );
}
