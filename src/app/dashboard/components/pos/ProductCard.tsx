'use client';

import { ImagePlus } from 'lucide-react';

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  generaTicket?: boolean;
  imagen?: string | null;
}

interface ProductCardProps {
  product: Product;
  cartQuantity?: number;
  onAddToCart: (product: Product) => void;
}

export default function ProductCard({ product, cartQuantity = 0, onAddToCart }: ProductCardProps) {
  return (
    <div
      onClick={() => onAddToCart(product)}
      className={`relative bg-white border rounded-xl p-4 cursor-pointer transition-all hover:shadow-sm ${
        cartQuantity > 0
          ? 'border-green-400 ring-1 ring-green-200'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {cartQuantity > 0 && (
        <span className="absolute top-3 right-3 bg-green-600 text-white text-xs font-semibold w-5 h-5 rounded-full flex items-center justify-center z-10">
          {cartQuantity}
        </span>
      )}

      {product.imagen ? (
        <img
          src={product.imagen}
          alt={product.name}
          className="w-full h-28 object-cover rounded-lg mb-3"
        />
      ) : (
        <div className="w-full h-28 bg-slate-100 rounded-lg mb-3 flex items-center justify-center">
          <ImagePlus size={22} className="text-slate-300" />
        </div>
      )}

      <p className="text-sm font-medium text-slate-800 leading-snug mb-0.5">{product.name}</p>
      <p className="text-xs text-slate-400 mb-2">Stock: {product.stock}</p>
      <p className="text-sm font-bold text-green-600">S/. {Number(product.price).toFixed(2)}</p>

      {product.generaTicket && (
        <p className="text-xs text-purple-500 mt-1">Genera ticket</p>
      )}
    </div>
  );
}