import React from 'react';
import { GadgetGrid } from '../components/dashboard/templates/GadgetGrid';
import { Cpu } from 'lucide-react';

export const Gadgets: React.FC = () => {
  return (
    <div className="p-6 pr-6 mx-auto lg:pl-32">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-nexdom-lime/10 rounded-lg border border-nexdom-lime/30">
          <Cpu className="w-6 h-6 text-nexdom-lime" />
        </div>
        <h2 className="text-3xl font-bold text-white tracking-wide">Connected Gadgets</h2>
      </div>

      <GadgetGrid />
    </div>
  );
};
