import React from 'react';
import { useHomeAssistant } from './HomeAssistant';
import { GadgetCard } from './templates/GadgetCard';
import { motion, AnimatePresence } from 'framer-motion';
import { mapEntityToGadget } from './zones/ZonesPanel';
import { DeviceDetailsModal } from './modals/DeviceDetailsModal';
import { useState } from 'react';

export const LiveStatus: React.FC = () => {
  const { states, favorites, toggleEntity, toggleFavorite } = useHomeAssistant();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  // Filter entities that are in favorites
  const favoriteEntities = states?.filter(entity => favorites.includes(entity.entity_id)) || [];

  return (
    <div className="relative z-10">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-nexdom-lime rounded-full shadow-[0_0_10px_#00FF88]"></div>
          <h2 className="text-xl font-bold text-white tracking-wide">Favoritos</h2>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1 bg-nexdom-lime/10 border border-nexdom-lime/20 rounded-full flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-nexdom-lime rounded-full animate-pulse shadow-[0_0_5px_#00FF88]"></span>
            <span className="text-xs font-medium text-nexdom-lime tracking-wider uppercase">System Online</span>
          </div>
        </div>
      </div>

      {/* Favorites Grid */}
      {favoriteEntities.length === 0 ? (
        <div className="text-center py-12 glass-panel rounded-[2rem] border border-white/5">
          <p className="text-gray-400 mb-2">No favorites added yet</p>
          <p className="text-xs text-gray-600">Click on any device card to add it to favorites</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <AnimatePresence>
            {favoriteEntities.map((entity) => {
              const gadget = mapEntityToGadget(entity);
              return (
                <motion.div
                  key={entity.entity_id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <GadgetCard
                    {...gadget}
                    onPrimaryAction={() => toggleEntity(entity.entity_id)}
                    onSecondaryAction={() => setSelectedDeviceId(entity.entity_id)}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <DeviceDetailsModal
        entityId={selectedDeviceId}
        onClose={() => setSelectedDeviceId(null)}
        isFavorite={selectedDeviceId ? favorites.includes(selectedDeviceId) : false}
        onToggleFavorite={selectedDeviceId ? () => toggleFavorite(selectedDeviceId) : undefined}
      />
    </div>
  );
};
