import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { BrandAIcon, BrandBIcon, BrandCIcon, BrandDIcon, BrandEIcon } from './brand-icons';

const brands = [
  { name: 'Global Corp', icon: BrandAIcon },
  { name: 'Pioneer Inc.', icon: BrandBIcon },
  { name: 'Innovate LLC', icon: BrandCIcon },
  { name: 'Apex Solutions', icon: BrandDIcon },
  { name: 'Summit Enterprises', icon: BrandEIcon },
  { name: 'Quantum Industries', icon: BrandAIcon }, // Re-using for variety
];

const TrustedBy: React.FC = () => {
  return (
    <Card>
      <CardHeader className="border-b-0">
        <CardTitle className="text-center text-lg text-slate-500 dark:text-slate-400 font-medium w-full">
          Trusted by the industry's best
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-y-10 gap-x-6 sm:gap-8 items-center">
          {brands.map((brand, index) => (
            <div key={index} className="flex justify-center" title={brand.name}>
              <brand.icon className="h-10 w-auto text-slate-400 dark:text-slate-500 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrustedBy;