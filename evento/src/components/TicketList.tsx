'use client';

import { useEventoContract } from '@/hooks/useEventoContract';
import { useMetaMask } from '@/context/MetaMaskContext';
import { useState } from 'react';
import { ethers } from 'ethers';
import { TicketPurchaseDialog } from './TicketPurchaseDialog';

interface SelectedTicket {
  id: number;
  name: string;
  price: bigint;
}

export function TicketList() {
  const { ticketTypes, loading, error, purchaseTickets } = useEventoContract();
  const { selectedAccount } = useMetaMask();
  const [selectedTicket, setSelectedTicket] = useState<SelectedTicket | null>(null);

  const formatPrice = (price: bigint) => {
    return ethers.formatEther(price);
  };

  const handlePurchase = async (quantity: number, discountCode: string) => {
    if (!selectedTicket) return;
    
    try {
      await purchaseTickets(selectedTicket.id, quantity, discountCode);
    } catch (err) {
      console.error('Error al comprar:', err);
      throw err;
    }
  };

  if (!selectedAccount) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Conecta tu wallet para ver los tickets
          </h2>
          <p className="text-gray-600">
            Por favor, conecta tu wallet de MetaMask para poder ver y comprar tickets.
          </p>
        </div>
      </div>
    );
  }

  if (loading && ticketTypes.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando tickets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Tickets Disponibles</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ticketTypes.map((ticket, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
          >
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{ticket.name}</h3>
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  Precio: {formatPrice(ticket.price)} ETH
                </p>
                <p className="text-sm text-gray-600">
                  Precio Early Bird: {formatPrice(ticket.earlyBirdPrice)} ETH
                </p>
                <p className="text-sm text-gray-600">
                  Precio Whitelist: {formatPrice(ticket.whitelistPrice)} ETH
                </p>
                <p className="text-sm text-gray-600">
                  Disponibles: {Number(ticket.currentSupply)} / {Number(ticket.maxSupply)}
                </p>
              </div>
              <button
                onClick={() => setSelectedTicket({ id: index, name: ticket.name, price: ticket.price })}
                disabled={!ticket.active}
                className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                  !ticket.active
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {!ticket.active ? 'No disponible' : 'Comprar Ticket'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <TicketPurchaseDialog
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onPurchase={handlePurchase}
        ticketName={selectedTicket?.name || ''}
        ticketPrice={selectedTicket?.price || BigInt(0)}
      />
    </div>
  );
} 