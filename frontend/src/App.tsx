import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout';
import {
  Dashboard,
  Ciudades,
  Edificios,
  Pisos,
  Habitaciones,
  Inquilinos,
  Pagos,
  Gastos,
  Reportes,
  Configuracion,
} from '@/pages';
import { ConsultaInquilino } from '@/pages/ConsultaInquilino';

function App() {
  return (
    <Routes>
      {/* Ruta publica para consulta de inquilinos (sin layout) */}
      <Route path="/consulta" element={<ConsultaInquilino />} />

      {/* Rutas del sistema con layout */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="ciudades" element={<Ciudades />} />
        <Route path="edificios" element={<Edificios />} />
        <Route path="pisos" element={<Pisos />} />
        <Route path="habitaciones" element={<Habitaciones />} />
        <Route path="inquilinos" element={<Inquilinos />} />
        <Route path="pagos" element={<Pagos />} />
        <Route path="gastos" element={<Gastos />} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="configuracion" element={<Configuracion />} />
      </Route>
    </Routes>
  );
}

export default App;
