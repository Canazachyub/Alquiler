import { useEffect, useState } from 'react';

/** true cuando la pantalla es de celular (menos de 640 px, el breakpoint `sm` de Tailwind) */
export function useEsCelular(maxPx = 639) {
  const consulta = `(max-width: ${maxPx}px)`;
  const [es, setEs] = useState(() => typeof window !== 'undefined' && window.matchMedia(consulta).matches);
  useEffect(() => {
    const mq = window.matchMedia(consulta);
    const cambio = () => setEs(mq.matches);
    cambio();
    mq.addEventListener('change', cambio);
    return () => mq.removeEventListener('change', cambio);
  }, [consulta]);
  return es;
}
