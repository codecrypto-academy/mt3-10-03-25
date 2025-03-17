'use client';

import { useMetaMask } from '../contexts/MetaMaskContext';

export const Header = () => {
  const { address, isConnected, connect } = useMetaMask();

  // Función para mostrar la dirección abreviada
  const shortenAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="bg-white shadow py-4 px-6 flex justify-between items-center">
      <div className="text-xl font-bold">Evento Admin Panel</div>
      <div>
        {isConnected && address ? (
          <div className="flex items-center">
            <div className="bg-gray-100 py-2 px-4 rounded-lg text-gray-800 font-medium">
              {shortenAddress(address)}
            </div>
          </div>
        ) : (
          <button
            onClick={connect}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
}; 