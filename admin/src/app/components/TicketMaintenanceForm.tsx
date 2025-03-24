'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import abi from "../abi.json"
import contrato from "../contrato.json"
// Tipo para representar un ticket basado en la estructura del contrato
interface TicketType {
  id: number;
  name: string;
  maxSupply: number;
  currentSupply: number;
  price: string;
  earlyBirdPrice: string;
  whitelistPrice: string;
  active: boolean;
}

// Interfaz para los tickets que vienen del contrato
interface ContractTicket {
  name: string;
  maxSupply: bigint;
  currentSupply: bigint;
  price: bigint;
  earlyBirdPrice: bigint;
  whitelistPrice: bigint;
  active: boolean;
}

// ABI simplificado para las funciones que necesitamos
const contractABI = abi.abi;

const contractAddress = contrato;
console.log({contractAddress});
const TicketMaintenanceForm = () => {
  // Estado para almacenar todos los tickets
  const [tickets, setTickets] = useState<TicketType[]>([]);
  // Estado para el ticket que se está editando
  const [editingTicket, setEditingTicket] = useState<TicketType | null>(null);
  // Estado para crear un nuevo ticket
  const [newTicket, setNewTicket] = useState<Omit<TicketType, 'id' | 'currentSupply'>>({
    name: '',
    maxSupply: 0,
    price: '',
    earlyBirdPrice: '',
    whitelistPrice: '',
    active: true
  });
  // Estado para mostrar/ocultar el formulario de nuevo ticket
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  // Estado para controlar el mensaje de estado
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error' | 'info' | null, message: string}>({
    type: null,
    message: ''
  });
  // Estado para mostrar cargando
  const [isLoading, setIsLoading] = useState(false);

  // Función para conectar al contrato
  const connectToContract = async () => {
    try {
      // Comprobamos si window.ethereum está disponible (Metamask)
      if (typeof window !== 'undefined' && 'ethereum' in window) {
        const ethereum = window.ethereum as ethers.Eip1193Provider;
        await ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.BrowserProvider(ethereum);
        const signer = await provider.getSigner();
        console.log({signer});
        return new ethers.Contract(contractAddress, contractABI, signer);
      } else {
        setStatusMessage({
          type: 'error',
          message: 'MetaMask no está instalado. Por favor, instala MetaMask para continuar.'
        });
        return null;
      }
    } catch (error) {
      console.error('Error al conectar con el contrato:', error);
      setStatusMessage({
        type: 'error',
        message: 'Error al conectar con el contrato. Verifica que tienes MetaMask instalado y configurado.'
      });
      return null;
    }
  };

  // Función para cargar los tickets desde el contrato
  const loadTicketsFromContract = async () => {
    setIsLoading(true);
    setStatusMessage({ type: 'info', message: 'Cargando tickets desde el contrato...' });
    
    try {
      const contract = await connectToContract();
      if (!contract) {
        console.log("No se pudo conectar al contrato");
        setIsLoading(false);
        return;
      }
      
      const ticketTypes = await contract.getTicketTypes();
      console.log({ticketTypes});
      const formattedTickets = ticketTypes.map((ticket: ContractTicket, index: number) => ({
        id: index + 1,
        name: ticket.name,
        maxSupply: Number(ticket.maxSupply),
        currentSupply: Number(ticket.currentSupply),
        price: ethers.formatEther(ticket.price),
        earlyBirdPrice: ethers.formatEther(ticket.earlyBirdPrice),
        whitelistPrice: ethers.formatEther(ticket.whitelistPrice),
        active: ticket.active
      }));
      
      setTickets(formattedTickets);
      setStatusMessage({ type: 'success', message: 'Tickets cargados correctamente.' });
    } catch (error) {
      console.error('Error al cargar los tickets:', error);
      setStatusMessage({ 
        type: 'error', 
        message: 'Error al cargar los tickets desde el contrato.' 
      });
      
      // Si hay un error, cargamos datos de ejemplo
      // loadMockData();
    } finally {
      setIsLoading(false);
    }
  };

  // Función para guardar todos los tickets en el contrato
  const saveTicketsToContract = async () => {
    setIsLoading(true);
    setStatusMessage({ type: 'info', message: 'Guardando tickets en el contrato...' });
    
    try {
      const contract = await connectToContract();
      if (!contract) {
        setIsLoading(false);
        return;
      }
      
      // Formatear los tickets para el contrato
      const ticketsForContract = tickets.map(ticket => ({
        name: ticket.name,
        maxSupply: ticket.maxSupply,
        currentSupply: ticket.currentSupply,
        price: ethers.parseEther(ticket.price),
        earlyBirdPrice: ethers.parseEther(ticket.earlyBirdPrice),
        whitelistPrice: ethers.parseEther(ticket.whitelistPrice),
        active: ticket.active
      }));
      
      // Llamar a la función writeAllTicketTypes
      const tx = await contract.writeAllTicketTypes(ticketsForContract);
      await tx.wait();
      
      setStatusMessage({ type: 'success', message: 'Tickets guardados correctamente en el contrato.' });
    } catch (error) {
      console.error('Error al guardar los tickets:', error);
      setStatusMessage({ 
        type: 'error', 
        message: 'Error al guardar los tickets en el contrato.' 
      });
    } finally {
      setIsLoading(false);
    }
  };


  // Cargar los tickets al montar el componente
  useEffect(() => {
    loadTicketsFromContract();
  }, []);

  // Manejar edición de un ticket
  const handleEdit = (ticket: TicketType) => {
    setEditingTicket({...ticket});
  };

  // Manejar cambios en el formulario de edición
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingTicket) return;
    
    const { name, value, type, checked } = e.target;
    setEditingTicket({
      ...editingTicket,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Guardar cambios del ticket editado
  const saveTicket = () => {
    if (!editingTicket) return;
    
    setTickets(tickets.map(ticket => 
      ticket.id === editingTicket.id ? editingTicket : ticket
    ));
    setEditingTicket(null);
    
    setStatusMessage({ 
      type: 'info', 
      message: 'Ticket actualizado localmente. Haz clic en "Guardar todos los cambios" para actualizar el contrato.' 
    });
  };

  // Cancelar edición
  const cancelEdit = () => {
    setEditingTicket(null);
  };

  // Manejar cambios en el formulario de nuevo ticket
  const handleNewTicketChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setNewTicket({
      ...newTicket,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Añadir nuevo ticket
  const addNewTicket = () => {
    const newId = Math.max(0, ...tickets.map(t => t.id)) + 1;
    const ticketToAdd = {
      ...newTicket,
      id: newId,
      currentSupply: 0
    };
    
    setTickets([...tickets, ticketToAdd]);
    setNewTicket({
      name: '',
      maxSupply: 0,
      price: '',
      earlyBirdPrice: '',
      whitelistPrice: '',
      active: true
    });
    setShowNewTicketForm(false);
    
    setStatusMessage({ 
      type: 'info', 
      message: 'Nuevo ticket añadido localmente. Haz clic en "Guardar todos los cambios" para actualizar el contrato.' 
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Tickets Disponibles</h3>
        <div className="space-x-2">
          <button 
            onClick={loadTicketsFromContract}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={isLoading}
          >
            Recargar datos
          </button>
          <button 
            onClick={() => setShowNewTicketForm(!showNewTicketForm)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            disabled={isLoading}
          >
            {showNewTicketForm ? 'Cancelar' : 'Añadir Ticket'}
          </button>
          <button 
            onClick={saveTicketsToContract}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            disabled={isLoading}
          >
            Guardar todos los cambios
          </button>
        </div>
      </div>

      {/* Mensaje de estado */}
      {statusMessage.type && (
        <div className={`p-3 rounded ${
          statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 
          statusMessage.type === 'error' ? 'bg-red-100 text-red-800' : 
          'bg-blue-100 text-blue-800'
        }`}>
          {statusMessage.message}
        </div>
      )}

      {/* Indicador de carga */}
      {isLoading && (
        <div className="text-center p-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2">Cargando...</p>
        </div>
      )}

      {/* Tabla de tickets */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suministro Máx.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suministro Actual</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Regular</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Early Bird</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Whitelist</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tickets.map(ticket => (
              <tr key={ticket.id}>
                <td className="px-6 py-4 text-gray-500">{ticket.name}</td>
                <td className="px-6 py-4 text-gray-500">{ticket.maxSupply}</td>
                <td className="px-6 py-4 text-gray-500">{ticket.currentSupply}</td>
                <td className="px-6 py-4 text-gray-500">{ticket.price} ETH</td>
                <td className="px-6 py-4 text-gray-500">{ticket.earlyBirdPrice} ETH</td>
                <td className="px-6 py-4 text-gray-500">{ticket.whitelistPrice} ETH</td>
                <td className="px-6 py-4 text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ticket.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {ticket.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    onClick={() => handleEdit(ticket)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Formulario de edición */}
      {editingTicket && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Editar Ticket: {editingTicket.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  type="text"
                  name="name"
                  value={editingTicket.name}
                  onChange={handleEditChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Suministro Máximo</label>
                <input
                  type="number"
                  name="maxSupply"
                  value={editingTicket.maxSupply}
                  onChange={handleEditChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Precio Regular (ETH)</label>
                <input
                  type="text"
                  name="price"
                  value={editingTicket.price}
                  onChange={handleEditChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Precio Early Bird (ETH)</label>
                <input
                  type="text"
                  name="earlyBirdPrice"
                  value={editingTicket.earlyBirdPrice}
                  onChange={handleEditChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Precio Whitelist (ETH)</label>
                <input
                  type="text"
                  name="whitelistPrice"
                  value={editingTicket.whitelistPrice}
                  onChange={handleEditChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="active"
                  checked={editingTicket.active}
                  onChange={handleEditChange}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">Activo</label>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button 
                  onClick={cancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button 
                  onClick={saveTicket}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulario para nuevo ticket */}
      {showNewTicketForm && (
        <div className="mt-6 p-4 border rounded-lg">
          <h3 className="text-lg font-medium mb-4">Añadir Nuevo Ticket</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input
                type="text"
                name="name"
                value={newTicket.name}
                onChange={handleNewTicketChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Suministro Máximo</label>
              <input
                type="number"
                name="maxSupply"
                value={newTicket.maxSupply}
                onChange={handleNewTicketChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Precio Regular (ETH)</label>
              <input
                type="text"
                name="price"
                value={newTicket.price}
                onChange={handleNewTicketChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Precio Early Bird (ETH)</label>
              <input
                type="text"
                name="earlyBirdPrice"
                value={newTicket.earlyBirdPrice}
                onChange={handleNewTicketChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Precio Whitelist (ETH)</label>
              <input
                type="text"
                name="whitelistPrice"
                value={newTicket.whitelistPrice}
                onChange={handleNewTicketChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="active"
                checked={newTicket.active}
                onChange={handleNewTicketChange}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">Activo</label>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button 
              onClick={() => setShowNewTicketForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button 
              onClick={addNewTicket}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              Añadir Ticket
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketMaintenanceForm; 