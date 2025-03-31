'use client';

import { useState } from 'react';
import TicketMaintenanceForm from './TicketMaintenanceForm';
import ContractMaintenanceForm from './ContractMaintenanceForm';
import DiscountCodeForm from './DiscountCodeForm';
import WhitelistForm from './WhitelistForm';
import { isOwnerFunction, useMetaMask } from '../contexts/MetaMaskContext';

type DashboardOption = 'tickets' | 'codigosDescuento' | 'whitelist' | 'contract';

export const Dashboard = () => {
  const [activeOption, setActiveOption] = useState<DashboardOption | null>(null);

  const menuOptions = [
    { id: 'tickets', name: 'Mantenimiento de los datos del contrato', icon: '🎟️' },
    { id: 'codigosDescuento', name: 'Los codigos de descuento', icon: '💰' },
    { id: 'whitelist', name: 'Whitelist', icon: '🔄' },
    { id: 'contract', name: 'Estado del Contrato', icon: '⚙️' },
  ];

  const handleOptionClick = (option: DashboardOption) => {
    setActiveOption(option);
  };

  // Función para renderizar el contenido según la opción seleccionada
  const renderContent = () => {
    switch (activeOption) {
      case 'tickets':
        return <TicketMaintenanceForm />;
      case 'codigosDescuento':
        return <DiscountCodeForm />;
      case 'whitelist':
        return <WhitelistForm />;
      case 'contract':
        return <ContractMaintenanceForm />;
      default:
        return null;
    }
  };

  const { isConnected } = useMetaMask();
  if (!isConnected) {
    return <div>No estás conectado a MetaMask</div>;
  } else {
    (async () => {  
      const isOwner = await isOwnerFunction();
      if (!isOwner) {
        // alert('No estás autorizado para acceder a esta página');
      }
    })();
  }
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
          {renderContent()}
        </div>
      )}
    </div>
  );
}; 