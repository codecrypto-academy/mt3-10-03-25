'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type DashboardOption = 'tickets' | 'prices' | 'earlyBird' | 'common';

export const Dashboard = () => {
  const [activeOption, setActiveOption] = useState<DashboardOption | null>(null);
  const router = useRouter();

  const menuOptions = [
    { id: 'tickets', name: 'Mantenimiento de Ticket', icon: '🎟️' },
    { id: 'prices', name: 'Actualización de Precios', icon: '💰' },
    { id: 'earlyBird', name: 'Activar/Desactivar Early Bird', icon: '🕒' },
    { id: 'common', name: 'Common', icon: '🔄' },
  ];

  const handleOptionClick = (option: DashboardOption) => {
    setActiveOption(option);
    // Aquí podrías agregar navegación si prefieres páginas separadas
    // router.push(`/dashboard/${option}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Panel de Administración de Eventos</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {menuOptions.map((option) => (
          <div
            key={option.id}
            onClick={() => handleOptionClick(option.id as DashboardOption)}
            className={`
              cursor-pointer bg-white rounded-lg shadow-md p-6 
              hover:shadow-lg transition-shadow border-l-4
              ${activeOption === option.id ? 'border-blue-600' : 'border-transparent'}
            `}
          >
            <div className="flex items-center">
              <div className="text-3xl mr-4">{option.icon}</div>
              <div>
                <h3 className="font-bold">{option.name}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Gestionar {option.name.toLowerCase()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {activeOption && (
        <div className="mt-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">
            {menuOptions.find(o => o.id === activeOption)?.name}
          </h2>
          <p className="text-gray-600">
            Interfaz de gestión para {menuOptions.find(o => o.id === activeOption)?.name.toLowerCase()}.
            (Esta sección se implementará según las necesidades específicas)
          </p>
        </div>
      )}
    </div>
  );
}; 