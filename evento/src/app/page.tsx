import { TicketList } from '@/components/TicketList';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Bienvenido al Evento
          </h1>
          <p className="text-xl text-gray-600">
            Compra tus tickets de forma segura usando blockchain
          </p>
        </div>
        <TicketList />
      </div>
    </div>
  );
}
