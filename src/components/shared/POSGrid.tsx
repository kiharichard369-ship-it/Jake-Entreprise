import React, { useState, useMemo } from 'react';
import { Search, Plus } from 'lucide-react';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  sub_category?: string;
  current_stock: number;
  unit?: string;
  status: 'active' | 'inactive';
}

interface POSGridProps {
  products: Product[];
  categories: string[];
  onAddToCart: (product: Product) => void;
  themeColor?: string;
}

const categoryColors: Record<string, string> = {
  raw: 'text-amber-700 bg-amber-50 border-amber-200',
  cooked: 'text-orange-700 bg-orange-50 border-orange-200',
  refill: 'text-blue-700 bg-blue-50 border-blue-200',
  new: 'text-cyan-700 bg-cyan-50 border-cyan-200',
  caps: 'text-purple-700 bg-purple-50 border-purple-200',
  pet: 'text-teal-700 bg-teal-50 border-teal-200',
  jerrican: 'text-indigo-700 bg-indigo-50 border-indigo-200',
};

export function POSGrid({ products, categories, onAddToCart, themeColor = 'blue' }: POSGridProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(categories[0] || '');

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = p.category.toLowerCase() === activeCategory.toLowerCase();
      const matchSearch = search === '' || p.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch && p.status === 'active';
    });
  }, [products, activeCategory, search]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const ringColor = themeColor === 'orange' ? 'ring-orange-500' : 'ring-blue-500';
  const tabActive = themeColor === 'orange'
    ? 'bg-orange-600 text-white shadow-sm'
    : 'bg-blue-700 text-white shadow-sm';

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 border-b border-gray-100">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 px-4 py-3 border-b border-gray-100 overflow-x-auto flex-shrink-0">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-sm font-semibold uppercase tracking-wide transition-all duration-150 ${
              activeCategory === cat ? tabActive : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <p className="font-medium">No products found</p>
            <p className="text-sm">Try a different category or search</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((product) => {
              const outOfStock = product.current_stock <= 0;
              const catKey = product.category.toLowerCase();
              const colorClass = categoryColors[catKey] || 'text-gray-700 bg-gray-50 border-gray-200';

              return (
                <button
                  key={product.id}
                  onClick={() => !outOfStock && onAddToCart(product)}
                  disabled={outOfStock}
                  className={`
                    relative flex flex-col items-start p-3 rounded-xl border-2 text-left
                    transition-all duration-150 select-none
                    ${outOfStock
                      ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                      : `border-gray-100 bg-white hover:border-current hover:shadow-md active:scale-95 ${colorClass}`
                    }
                  `}
                >
                  {/* Category badge */}
                  <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide mb-2 ${colorClass}`}>
                    {product.category}
                  </span>

                  <p className="font-bold text-gray-900 text-sm leading-tight mb-1">{product.name}</p>
                  {product.sub_category && (
                    <p className="text-xs text-gray-500 mb-1">{product.sub_category}</p>
                  )}

                  <div className="flex items-center justify-between w-full mt-auto pt-2">
                    <div>
                      <p className="font-black text-gray-900 text-base">KES {product.price.toLocaleString()}</p>
                      <p className={`text-[10px] font-medium ${outOfStock ? 'text-red-500' : 'text-gray-400'}`}>
                        {outOfStock ? 'Out of stock' : `Stock: ${product.current_stock} ${product.unit || ''}`}
                      </p>
                    </div>
                    {!outOfStock && (
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm ${
                        themeColor === 'orange' ? 'bg-orange-500' : 'bg-blue-600'
                      }`}>
                        <Plus size={14} />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
