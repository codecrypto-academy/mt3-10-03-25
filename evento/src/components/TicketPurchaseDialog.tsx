'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ethers } from 'ethers';

interface TicketPurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (quantity: number, discountCode: string) => Promise<void>;
  ticketName: string;
  ticketPrice: bigint;
}

export function TicketPurchaseDialog({
  isOpen,
  onClose,
  onPurchase,
  ticketName,
  ticketPrice,
}: TicketPurchaseDialogProps) {
  const [quantity, setQuantity] = useState(1);
  const [discountCode, setDiscountCode] = useState('');
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async () => {
    try {
      setIsPurchasing(true);
      await onPurchase(quantity, discountCode);
      onClose();
    } catch (error) {
      console.error('Error al comprar:', error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const totalPrice = ticketPrice * BigInt(quantity);
  const formattedPrice = ethers.formatEther(totalPrice);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Comprar {ticketName}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              Cantidad
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="discount" className="text-right">
              Descuento
            </Label>
            <Input
              id="discount"
              placeholder="Código de descuento"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="text-right font-medium">
            Total: {formattedPrice} ETH
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handlePurchase} 
            disabled={isPurchasing}
          >
            {isPurchasing ? 'Comprando...' : 'Comprar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 