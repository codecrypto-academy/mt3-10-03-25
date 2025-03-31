'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface MetaMaskContextType {
  selectedAccount: string | null;
  isMetaMaskInstalled: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (eventName: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (eventName: string, callback: (...args: unknown[]) => void) => void;
}

const MetaMaskContext = createContext<MetaMaskContextType | undefined>(undefined);

export function MetaMaskProvider({ children }: { children: ReactNode }) {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);

  useEffect(() => {
    // Check if MetaMask is installed
    const checkMetaMask = () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        setIsMetaMaskInstalled(true);
      }
    };

    checkMetaMask();
  }, []);

  const connect = async () => {
    if (!isMetaMaskInstalled || !window.ethereum) {
      throw new Error('MetaMask no está instalado');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      }) as string[];
      
      if (accounts && accounts.length > 0) {
        setSelectedAccount(accounts[0]);
      }
    } catch (error) {
      console.error('Error al conectar con MetaMask:', error);
      throw error;
    }
  };

  const disconnect = () => {
    setSelectedAccount(null);
  };

  // Listen for account changes
  useEffect(() => {
    if (isMetaMaskInstalled && window.ethereum) {
      const ethereum = window.ethereum as EthereumProvider;
      
      const handleAccountsChanged = (...args: unknown[]) => {
        const accounts = args[0] as string[];
        if (accounts.length === 0) {
          // User disconnected their account
          disconnect();
        } else {
          setSelectedAccount(accounts[0]);
        }
      };

      const handleChainChanged = () => {
        // Reload the page on chain change
        window.location.reload();
      };

      ethereum.on('accountsChanged', handleAccountsChanged);
      ethereum.on('chainChanged', handleChainChanged);

      return () => {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [isMetaMaskInstalled]);

  return (
    <MetaMaskContext.Provider 
      value={{ 
        selectedAccount, 
        isMetaMaskInstalled,
        connect,
        disconnect
      }}
    >
      {children}
    </MetaMaskContext.Provider>
  );
}

export function useMetaMask() {
  const context = useContext(MetaMaskContext);
  if (context === undefined) {
    throw new Error('useMetaMask must be used within a MetaMaskProvider');
  }
  return context;
}

// Add TypeScript declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
} 