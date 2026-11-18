"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { useCart, type CartItem } from "@/src/components/site/CartProvider";

type CartAddButtonProps = {
  item: Omit<CartItem, "quantity">;
  className?: string;
  size?: "sm" | "md";
};

export function CartAddButton({ item, className, size }: CartAddButtonProps) {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const addingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const handleAdd = () => {
    if (addingRef.current) return;

    addingRef.current = true;
    setIsAdding(true);

    try {
      addItem(item);
    } catch (error) {
      addingRef.current = false;
      setIsAdding(false);
      throw error;
    }

    timeoutRef.current = setTimeout(() => {
      addingRef.current = false;
      timeoutRef.current = null;
      setIsAdding(false);
    }, 500);
  };

  return (
    <Button
      type="button"
      onClick={handleAdd}
      disabled={isAdding}
      aria-busy={isAdding}
      className={className}
      size={size}
    >
      {isAdding ? (
        <>
          <svg
            aria-hidden="true"
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Adding...
        </>
      ) : (
        "Add to cart"
      )}
    </Button>
  );
}
