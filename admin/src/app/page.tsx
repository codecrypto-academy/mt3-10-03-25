'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMetaMask } from './contexts/MetaMaskContext';
import { Dashboard } from './components/Dashboard';

export default function Home() {
  const { isConnected, connect } = useMetaMask();
  const router = useRouter();

  // Redireccionar al dashboard si ya está conectado (opcional)
  // useEffect(() => {
  //   if (isConnected) {
  //     router.push('/dashboard');
  //   }
  // }, [isConnected, router]);

  return (
    <div className="container mx-auto px-4 py-12">
      {isConnected ? (
        <Dashboard />
      ) : (
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-6">Panel de Administración de Eventos</h1>
          <p className="text-xl text-gray-600 mb-8">
            Gestiona tus eventos, tickets, precios y configuraciones desde un solo lugar
          </p>
          <div className="mb-12 bg-gray-100 p-8 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Necesitas conectar tu wallet</h2>
            <p className="mb-6">
              Para gestionar eventos necesitas conectar tu wallet de MetaMask con permisos de administrador
            </p>
            <button
              onClick={connect}
              className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium py-3 px-8 rounded-lg transition-colors"
            >
              Conectar con MetaMask
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-3xl mb-4">🎟️</div>
              <h3 className="text-xl font-bold mb-2">Gestión de Tickets</h3>
              <p className="text-gray-600">
                Control total sobre la emisión y el seguimiento de tickets para tus eventos
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-3xl mb-4">💰</div>
              <h3 className="text-xl font-bold mb-2">Control de Precios</h3>
              <p className="text-gray-600">
                Actualiza los precios de tus tickets y promociones de forma sencilla
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-3xl mb-4">🕒</div>
              <h3 className="text-xl font-bold mb-2">Gestión de Fases</h3>
              <p className="text-gray-600">
                Configura fases de venta como Early Bird o promociones especiales
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
