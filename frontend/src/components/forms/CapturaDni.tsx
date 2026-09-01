import { useRef, useState } from 'react';
import { Camera, X, ExternalLink, RefreshCw } from 'lucide-react';
import { comprimirImagen, pesoKb } from '@/utils/imagen';
import { cn } from '@/utils/cn';

export interface CapturaDniValue {
  /** Data URL de la foto recien capturada, pendiente de subir. */
  frente?: string;
  reverso?: string;
}

interface CapturaDniProps {
  value: CapturaDniValue;
  onChange: (value: CapturaDniValue) => void;
  /** Enlaces ya guardados en Drive, si el inquilino se esta editando. */
  urlFrenteGuardada?: string;
  urlReversoGuardada?: string;
  disabled?: boolean;
}

export function CapturaDni({
  value,
  onChange,
  urlFrenteGuardada,
  urlReversoGuardada,
  disabled = false,
}: CapturaDniProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <RanuraDni
        etiqueta="Frente"
        captura={value.frente}
        urlGuardada={urlFrenteGuardada}
        disabled={disabled}
        onCapturar={(dataUrl) => onChange({ ...value, frente: dataUrl })}
        onQuitar={() => onChange({ ...value, frente: undefined })}
      />
      <RanuraDni
        etiqueta="Reverso"
        captura={value.reverso}
        urlGuardada={urlReversoGuardada}
        disabled={disabled}
        onCapturar={(dataUrl) => onChange({ ...value, reverso: dataUrl })}
        onQuitar={() => onChange({ ...value, reverso: undefined })}
      />
    </div>
  );
}

interface RanuraDniProps {
  etiqueta: string;
  captura?: string;
  urlGuardada?: string;
  disabled: boolean;
  onCapturar: (dataUrl: string) => void;
  onQuitar: () => void;
}

function RanuraDni({
  etiqueta,
  captura,
  urlGuardada,
  disabled,
  onCapturar,
  onQuitar,
}: RanuraDniProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Permite volver a elegir el mismo archivo
    e.target.value = '';
    if (!file) return;

    setProcesando(true);
    setError(null);
    try {
      onCapturar(await comprimirImagen(file));
    } catch {
      setError('No se pudo procesar la imagen');
    } finally {
      setProcesando(false);
    }
  };

  const tieneAlgo = Boolean(captura || urlGuardada);

  return (
    <div
      className={cn(
        'rounded-xl border p-3 transition-colors',
        captura ? 'border-primary-200 bg-primary-50/30' : 'border-slate-200'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-700">{etiqueta}</span>
        {captura && (
          <span className="text-xs text-slate-500 tabular-nums">{pesoKb(captura)} KB</span>
        )}
      </div>

      {captura ? (
        <img
          src={captura}
          alt={`DNI ${etiqueta.toLowerCase()}`}
          className="w-full h-32 object-cover rounded-lg border border-slate-200 bg-slate-50"
        />
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || procesando}
          className={cn(
            'w-full h-32 rounded-lg border border-dashed flex flex-col items-center justify-center gap-1.5',
            'text-slate-500 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50/40',
            'transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
            urlGuardada ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-300'
          )}
        >
          <Camera className="w-6 h-6" />
          <span className="text-xs font-medium">
            {procesando ? 'Procesando...' : urlGuardada ? 'Reemplazar foto' : 'Tomar foto'}
          </span>
        </button>
      )}

      {/* En celular abre la camara; en escritorio, el explorador de archivos */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleArchivo}
        className="hidden"
      />

      {error && <p className="form-error mt-2">{error}</p>}

      <div className="flex items-center gap-3 mt-2 min-h-[20px]">
        {captura && (
          <>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
              className="text-xs text-primary-600 hover:underline inline-flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Repetir
            </button>
            <button
              type="button"
              onClick={onQuitar}
              disabled={disabled}
              className="text-xs text-red-600 hover:underline inline-flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Quitar
            </button>
          </>
        )}
        {!captura && urlGuardada && (
          <a
            href={urlGuardada}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-emerald-700 hover:underline inline-flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            Ver foto guardada
          </a>
        )}
        {!tieneAlgo && <span className="text-xs text-slate-400">Sin foto</span>}
      </div>
    </div>
  );
}
