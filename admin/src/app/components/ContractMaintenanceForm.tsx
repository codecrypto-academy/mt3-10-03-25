'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import abi from '../abi.json';
import contrato from '../contrato.json';

const ContractMaintenanceForm = () => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [status, setStatus] = useState({
    saleActive: false,
    earlyBirdActive: false,
    whitelistActive: false,
    eventCancelled: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  useEffect(() => {
    const connectToContract = async () => {
      try {
        if (typeof window !== 'undefined' && 'ethereum' in window) {
          const ethereum = window.ethereum as ethers.Eip1193Provider;
          await ethereum.request({ method: 'eth_requestAccounts' });
          const provider = new ethers.BrowserProvider(ethereum);
          const signer = await provider.getSigner();
          const contractInstance =
           new ethers.Contract(contrato.address, abi.abi, signer);
          setContract(contractInstance);
          
          // Fetch initial status
          const saleActive = await contractInstance.saleActive();
          const earlyBirdActive = await contractInstance.earlyBirdActive();
          const whitelistActive = await contractInstance.whitelistActive();
          const eventCancelled = await contractInstance.eventCancelled();
          
          setStatus({
            saleActive,
            earlyBirdActive,
            whitelistActive,
            eventCancelled
          });
        } else {
          setMessage({
            type: 'error',
            text: 'MetaMask no está instalado. Por favor, instala MetaMask para continuar.'
          });
        }
      } catch (error) {
        console.error('Error al conectar con el contrato:', error);
        setMessage({
          type: 'error',
          text: 'Error al conectar con el contrato. Verifica que tienes MetaMask instalado y configurado.'
        });
      }
    };

    connectToContract();
  }, []);

  const handleStatusChange = async (field: keyof typeof status, value: boolean) => {
    if (!contract) return;

    setIsLoading(true);
    try {
      let tx;
      switch (field) {
        case 'saleActive':
          tx = await contract.setSaleActive(value);
          break;
        case 'earlyBirdActive':
          tx = await contract.setEarlyBirdActive(value);
          break;
        case 'whitelistActive':
          tx = await contract.setWhitelistActive(value);
          break;
        case 'eventCancelled':
          tx = await contract.setEventCancelled(value);
          break;
      }

      await tx.wait();
      setStatus(prev => ({ ...prev, [field]: value }));
      setMessage({
        type: 'success',
        text: `Estado de ${field} actualizado correctamente`
      });
    } catch (error) {
      console.error('Error al actualizar el estado:', error);
      setMessage({
        type: 'error',
        text: 'Error al actualizar el estado del contrato'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-100 text-green-700' :
          message.type === 'error' ? 'bg-red-100 text-red-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Estado de Venta</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleStatusChange('saleActive', !status.saleActive)}
              disabled={isLoading}
              className={`px-4 py-2 rounded-md ${
                status.saleActive
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-green-500 hover:bg-green-600'
              } text-white disabled:opacity-50`}
            >
              {status.saleActive ? 'Desactivar Venta' : 'Activar Venta'}
            </button>
            <span className={`font-semibold ${
              status.saleActive ? 'text-green-600' : 'text-red-600'
            }`}>
              {status.saleActive ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Early Bird</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleStatusChange('earlyBirdActive', !status.earlyBirdActive)}
              disabled={isLoading}
              className={`px-4 py-2 rounded-md ${
                status.earlyBirdActive
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-green-500 hover:bg-green-600'
              } text-white disabled:opacity-50`}
            >
              {status.earlyBirdActive ? 'Desactivar Early Bird' : 'Activar Early Bird'}
            </button>
            <span className={`font-semibold ${
              status.earlyBirdActive ? 'text-green-600' : 'text-red-600'
            }`}>
              {status.earlyBirdActive ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Whitelist</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleStatusChange('whitelistActive', !status.whitelistActive)}
              disabled={isLoading}
              className={`px-4 py-2 rounded-md ${
                status.whitelistActive
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-green-500 hover:bg-green-600'
              } text-white disabled:opacity-50`}
            >
              {status.whitelistActive ? 'Desactivar Whitelist' : 'Activar Whitelist'}
            </button>
            <span className={`font-semibold ${
              status.whitelistActive ? 'text-green-600' : 'text-red-600'
            }`}>
              {status.whitelistActive ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Estado del Evento</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleStatusChange('eventCancelled', !status.eventCancelled)}
              disabled={isLoading}
              className={`px-4 py-2 rounded-md ${
                status.eventCancelled
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-red-500 hover:bg-red-600'
              } text-white disabled:opacity-50`}
            >
              {status.eventCancelled ? 'Reactivar Evento' : 'Cancelar Evento'}
            </button>
            <span className={`font-semibold ${
              status.eventCancelled ? 'text-red-600' : 'text-green-600'
            }`}>
              {status.eventCancelled ? 'Cancelado' : 'Activo'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractMaintenanceForm; 