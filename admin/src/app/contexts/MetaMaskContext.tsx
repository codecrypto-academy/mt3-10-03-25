'use client';

import { ethers } from 'ethers';
import abi from "../abi.json"
import contrato from "../contrato.json"
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Add type declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: ethers.Eip1193Provider & {
      isMetaMask?: boolean;
      on(event: string, listener: (...args: any[]) => void): void;
      removeListener(event: string, listener: (...args: any[]) => void): void;
    };
  }
}

interface MetaMaskContextType {
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const MetaMaskContext = createContext<MetaMaskContextType>({
  address: null,
  isConnected: false,
  connect: async () => {},
  disconnect: () => {},
});

export async function isOwnerFunction(): Promise<boolean> {
  if (typeof window.ethereum === 'undefined') {
    alert('MetaMask is not installed!');
    return false;
  }
  const provider = new ethers.BrowserProvider(window.ethereum);
  const contractInstance = new ethers.Contract(contrato.address, abi.abi, provider);
  const isOwner = await contractInstance.isOnwer();
  return isOwner;
}


export const useMetaMask = () => useContext(MetaMaskContext);

interface MetaMaskProviderProps {
  children: ReactNode;
}



export const MetaMaskProvider = ({ children }: MetaMaskProviderProps) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask is not installed!');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
     
      if (accounts.length > 0) {
        
        
        setAddress(accounts[0]);
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error connecting to MetaMask', error);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setIsConnected(false);
  };

  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      setAddress(null);
      setIsConnected(false);
    } else if (accounts[0] !== address) {
      // User switched accounts
     

      setAddress(accounts[0]);
      setIsConnected(true);
    }
  };

  useEffect(() => {
    // Check if MetaMask is already connected on component mount
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.send('eth_accounts', []);
          
          if (accounts.length > 0) {
            
            setAddress(accounts[0]);
            setIsConnected(true);
          }
        } catch (error) {
          console.error('Error checking MetaMask connection', error);
        }
      }
    };

    checkConnection();

    // Set up event listeners for account changes
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      // Clean up event listeners
      if (typeof window.ethereum !== 'undefined') {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  return (
    <MetaMaskContext.Provider value={{ address, isConnected, connect, disconnect }}>
      {children}
    </MetaMaskContext.Provider>
  );
}; 