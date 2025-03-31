'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import abi from "../abi.json"
import contrato from "../contrato.json"

interface DiscountCode {
  code: string;
  percentage: number;
}

const DiscountCodeForm = () => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [newCode, setNewCode] = useState<DiscountCode>({
    code: '',
    percentage: 0
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
          const contractInstance = new ethers.Contract(contrato.address, abi.abi, signer);
          setContract(contractInstance);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) return;

    setIsLoading(true);
    try {
      if (newCode.percentage <= 0 || newCode.percentage > 100) {
        throw new Error('El porcentaje debe estar entre 1 y 100');
      }

      const tx = await contract.addDiscountCode(newCode.code, newCode.percentage);
      await tx.wait();

      setMessage({
        type: 'success',
        text: 'Código de descuento añadido correctamente'
      });
      setNewCode({ code: '', percentage: 0 });
    } catch (error) {
      console.error('Error al añadir el código de descuento:', error);
      setMessage({
        type: 'error',
        text: 'Error al añadir el código de descuento. Verifica los datos e inténtalo de nuevo.'
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700">
            Código de Descuento
          </label>
          <input
            type="text"
            id="code"
            value={newCode.code}
            onChange={(e) => setNewCode(prev => ({ ...prev, code: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Ingresa el código"
            required
          />
        </div>

        <div>
          <label htmlFor="percentage" className="block text-sm font-medium text-gray-700">
            Porcentaje de Descuento
          </label>
          <input
            type="number"
            id="percentage"
            value={newCode.percentage}
            onChange={(e) => setNewCode(prev => ({ ...prev, percentage: parseInt(e.target.value) }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            min="1"
            max="100"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            El porcentaje debe estar entre 1 y 100
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Procesando...' : 'Añadir Código de Descuento'}
        </button>
      </form>
    </div>
  );
};

export default DiscountCodeForm; 