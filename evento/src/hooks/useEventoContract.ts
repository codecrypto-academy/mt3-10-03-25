'use client';

import { useState, useEffect } from 'react';
import { useMetaMask } from '@/context/MetaMaskContext';
import { ethers } from 'ethers';
import contractData from '../../contrato.json';
import abiData from '../../abi.json';

const CONTRACT_ADDRESS = contractData.address;
const CONTRACT_ABI = abiData.abi;

interface TicketType {
  name: string;
  maxSupply: bigint;
  currentSupply: bigint;
  price: bigint;
  earlyBirdPrice: bigint;
  whitelistPrice: bigint;
  active: boolean;
}

export function useEventoContract() {
  const { selectedAccount, isMetaMaskInstalled } = useMetaMask();
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isMetaMaskInstalled || !selectedAccount) return;

    const initializeContract = async () => {
      try {
        if (!window.ethereum) {
          throw new Error('MetaMask no está instalado');
        }

        const provider = new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        setContract(contract);
        await loadTicketTypes(contract);
      } catch (err) {
        setError('Error al inicializar el contrato');
        console.error(err);
      }
    };

    initializeContract();
  }, [isMetaMaskInstalled, selectedAccount]);

  const loadTicketTypes = async (contract: ethers.Contract) => {
    try {
      setLoading(true);
      const types = await contract.getTicketTypes();
      setTicketTypes(types);
    } catch (err) {
      setError('Error al cargar los tipos de tickets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const purchaseTickets = async (ticketTypeId: number, quantity: number = 1, discountCode: string = '') => {
    if (!contract || !selectedAccount) return;

    try {
      // Ya tenemos el ticket con su precio en ticketTypes
      const ticket = ticketTypes[ticketTypeId];
      if (!ticket) throw new Error('Tipo de ticket no encontrado');

      const totalPrice = ticket.price * BigInt(quantity);
      
      // Realizar la compra
      const tx = await contract.purchaseTickets(ticketTypeId, quantity, discountCode, {
        value: totalPrice
      });
      await tx.wait();
      
      // Actualizar la lista de tickets después de la compra
      await loadTicketTypes(contract);
    } catch (error) {
      console.error('Error al comprar tickets:', error);
      throw error;
    }
  };

  return {
    ticketTypes,
    loading,
    error,
    purchaseTickets,
    refreshTicketTypes: () => contract && loadTicketTypes(contract),
  };
} 