'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import abi from "../abi.json"
import contrato from "../contrato.json"

interface WhitelistAddress {
  address: string;
  isWhitelisted: boolean;
}

const WhitelistForm = () => {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [newAddress, setNewAddress] = useState('');
  const [addresses, setAddresses] = useState<WhitelistAddress[]>([]);
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

  const checkAddress = async (address: string) => {
    if (!contract) return false;
    try {
      return await contract.isWhitelisted(address);
    } catch (error) {
      console.error('Error al verificar la dirección:', error);
      return false;
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !ethers.isAddress(newAddress)) {
      setMessage({
        type: 'error',
        text: 'Por favor, ingresa una dirección válida'
      });
      return;
    }

    setIsLoading(true);
    try {
      const tx = await contract.addToWhitelist(newAddress);
      await tx.wait();

      const isWhitelisted = await checkAddress(newAddress);
      if (isWhitelisted) {
        setAddresses(prev => [...prev, { address: newAddress, isWhitelisted: true }]);
      }

      setMessage({
        type: 'success',
        text: 'Dirección añadida a la whitelist correctamente'
      });
      setNewAddress('');
    } catch (error) {
      console.error('Error al añadir la dirección:', error);
      setMessage({
        type: 'error',
        text: 'Error al añadir la dirección a la whitelist'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAddress = async (address: string) => {
    if (!contract) return;

    setIsLoading(true);
    try {
      const tx = await contract.removeFromWhitelist(address);
      await tx.wait();

      setAddresses(prev => prev.filter(a => a.address !== address));
      setMessage({
        type: 'success',
        text: 'Dirección removida de la whitelist correctamente'
      });
    } catch (error) {
      console.error('Error al remover la dirección:', error);
      setMessage({
        type: 'error',
        text: 'Error al remover la dirección de la whitelist'
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

      <form onSubmit={handleAddAddress} className="space-y-4">
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Dirección Ethereum
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="text"
              id="address"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="flex-1 block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              placeholder="0x..."
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Añadiendo...' : 'Añadir'}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-900">Direcciones en Whitelist</h3>
        <div className="mt-4 space-y-2">
          {addresses.map((item) => (
            <div
              key={item.address}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <span className="font-mono text-sm">{item.address}</span>
              <button
                onClick={() => handleRemoveAddress(item.address)}
                disabled={isLoading}
                className="ml-3 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WhitelistForm; 