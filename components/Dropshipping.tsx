
import React, { useState } from 'react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import ImportProductModal from './ImportProductModal';
import { SearchIcon } from './icons';

const mockProducts = [
  {
    name: 'Macbook Pro 14 Inch 512GB M1 Pro',
    sku: 'MAC-09485',
    image: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp-spacegray-select-202206?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1653493200207',
    rating: 4.8,
    reviews: 886,
    tags: ['Apple', 'Electronic'],
    platform: 'Ali Express',
    price: '$180-$250',
    minOrder: '8 unit',
    description: 'Experience unparalleled performance with the MacBook Pro 14-inch, featuring the powerful M1 Pro chip.',
    supplier: {
        name: 'PrimeGoods',
        description: 'PrimeGoods Electronics is a leading...',
        logo: 'https://api.iconify.design/twemoji:package.svg'
    }
  },
  {
    name: 'Sony WH-1000XM5 Headphones',
    sku: 'SNY-10005',
    image: 'https://m.media-amazon.com/images/I/61vJtANP3fL._AC_SL1500_.jpg',
    rating: 4.9,
    reviews: 1245,
    tags: ['Sony', 'Audio', 'Electronic'],
    platform: 'ebay',
    price: '$150-$180',
    minOrder: '12 unit',
    description: 'Industry-leading noise canceling with two processors controlling eight microphones for unprecedented noise canceling.',
    supplier: {
        name: 'ElectroWorld',
        description: 'Your source for top electronics.',
        logo: 'https://api.iconify.design/twemoji:globe-showing-europe-africa.svg'
    }
  },
  {
    name: 'Logitech MX Master 3S Mouse',
    sku: 'LOG-MXM3S',
    image: 'https://resource.logitech.com/w_800,c_lpad,ar_1:1,q_auto,f_auto,dpr_1.0/d_transparent.gif/content/dam/logitech/en/products/mice/mx-master-3s/gallery/mx-master-3s-mouse-gallery-graphite-1.png?v=1',
    rating: 4.7,
    reviews: 980,
    tags: ['Logitech', 'Accessory'],
    platform: 'Amazon',
    price: '$90-$110',
    minOrder: '5 unit',
    description: 'An iconic mouse remastered. With Quiet Clicks and an 8K DPI sensor for more precision.',
    supplier: {
        name: 'PrimeGoods',
        description: 'PrimeGoods Electronics is a leading...',
        logo: 'https://api.iconify.design/twemoji:package.svg'
    }
  },
  {
    name: 'Anker PowerCore 20100',
    sku: 'ANK-PC201',
    image: 'https://m.media-amazon.com/images/I/51-a-s0uS+L._AC_SL1200_.jpg',
    rating: 4.8,
    reviews: 2050,
    tags: ['Anker', 'Accessory', 'Mobile'],
    platform: 'Ali Express',
    price: '$40-$55',
    minOrder: '20 unit',
    description: 'High-speed charging. Long-lasting, portable power.',
    supplier: {
        name: 'GadgetHub',
        description: 'All your gadget needs in one place.',
        logo: 'https://api.iconify.design/twemoji:shopping-bags.svg'
    }
  }
];

interface DropshippingProps {
    showToast: (message: string, type?: 'success' | 'error') => void;
}

const Dropshipping: React.FC<DropshippingProps> = ({ showToast }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const handleImportClick = (product: any) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in-up">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">Dropshipping Products</h2>
            <p className="text-slate-500 dark:text-slate-400">Find and import products to your store.</p>
          </div>
          <div className="relative w-full md:w-auto">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input type="text" placeholder="Search products..." className="w-full md:w-72 bg-white dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {mockProducts.map((product, index) => (
            <Card key={product.sku} className="overflow-hidden animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
              <img src={product.image} alt={product.name} className="rounded-t-xl aspect-[4/3] object-cover w-full" />
              <CardContent className="p-4">
                <p className="text-xs text-slate-500">{product.platform}</p>
                <h3 className="font-semibold h-12 text-sm text-slate-800 dark:text-slate-200">{product.name}</h3>
                <div className="flex justify-between items-center mt-2">
                  <p className="font-bold text-slate-900 dark:text-white">{product.price}</p>
                  <Button variant="outline" onClick={() => handleImportClick(product)}>Import</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {isModalOpen && selectedProduct && (
        <ImportProductModal
          product={selectedProduct}
          onClose={() => setIsModalOpen(false)}
          showToast={showToast}
        />
      )}
    </>
  );
};

export default Dropshipping;
