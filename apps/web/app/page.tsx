import { CustomerManagement } from "@/src/modules/customers/public";

export default function Home() {
  return (
    <main>
      <header className="page-header">
        <p className="eyebrow">ERP Taller Automotriz</p>
        <h1>Clientes</h1>
        <p>Registra personas y empresas, consulta sus datos y mantenlos actualizados.</p>
      </header>
      <CustomerManagement />
    </main>
  );
}
