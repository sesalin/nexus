import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Power, Settings } from 'lucide-react';
import { Icon } from '../../Icon';
import { useOffline } from '../../../hooks/useOffline';

export interface GadgetProps {
  id: string;
  name: string;
  model: string;
  type: 'sensor' | 'camera' | 'actuator' | 'switch' | 'light' | 'security' | 'patio' | 'accessory' | 'voice' | 'thermostat' | 'dimmer' | 'lock' | 'cover' | 'remote' | 'button';
  iconPath: string;
  status: string;
  isActive?: boolean;
  value?: string;
  category?: string;
  rgbColor?: number[]; // RGB color for lights
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  onColorChange?: (rgb: number[]) => void; // Callback for color changes
}

export const GadgetCard: React.FC<GadgetProps> = ({
  name,
  model,
  type,
  iconPath,
  status,
  isActive = false,
  value,
  rgbColor,
  onPrimaryAction,
  onSecondaryAction,
  onColorChange
}) => {
  const { isOffline } = useOffline();

  // Determine color scheme based on type
  const getColorScheme = () => {
    // Special handling for lights with RGB color
    if (type === 'light' && isActive && rgbColor && rgbColor.length === 3) {
      const [r, g, b] = rgbColor;
      const rgbStr = `rgb(${r}, ${g}, ${b})`;
      const rgbAlpha = `rgba(${r}, ${g}, ${b}, 0.3)`;
      return {
        text: 'text-white',
        border: 'border-white/30',
        bg: 'bg-white/10',
        glow: '', // Empty, we use inline styles instead
        activeBg: 'bg-white',
        customColor: rgbStr,
        customColorAlpha: rgbAlpha
      };
    }

    switch (type) {
      case 'sensor':
      case 'thermostat':
        return {
          text: 'text-nexdom-gold',
          border: 'border-nexdom-gold/30',
          bg: 'bg-nexdom-gold/10',
          glow: 'shadow-[0_0_20px_rgba(230,195,106,0.2)]',
          activeBg: 'bg-nexdom-gold'
        };
      case 'camera': return {
        text: 'text-blue-400',
        border: 'border-blue-500/30',
        bg: 'bg-blue-500/10',
        glow: 'shadow-[0_0_20px_rgba(59,130,246,0.2)]',
        activeBg: 'bg-blue-500'
      };
      case 'actuator':
      case 'cover':
      case 'remote':
        return {
          text: 'text-orange-400',
          border: 'border-orange-500/30',
          bg: 'bg-orange-500/10',
          glow: 'shadow-[0_0_20px_rgba(249,115,22,0.2)]',
          activeBg: 'bg-orange-500'
        };
      case 'switch':
      case 'dimmer':
      case 'button':
        return {
          text: 'text-nexdom-lime',
          border: 'border-nexdom-lime/30',
          bg: 'bg-nexdom-lime/10',
          glow: 'shadow-[0_0_20px_rgba(0,255,136,0.2)]',
          activeBg: 'bg-nexdom-lime'
        };
      case 'light': return {
        text: 'text-yellow-300',
        border: 'border-yellow-400/30',
        bg: 'bg-yellow-400/10',
        glow: 'shadow-[0_0_20px_rgba(250,204,21,0.2)]',
        activeBg: 'bg-yellow-400'
      };
      case 'security':
      case 'lock':
        return {
          text: 'text-red-400',
          border: 'border-red-500/30',
          bg: 'bg-red-500/10',
          glow: 'shadow-[0_0_20px_rgba(239,68,68,0.2)]',
          activeBg: 'bg-red-500'
        };
      case 'patio': return {
        text: 'text-green-400',
        border: 'border-green-500/30',
        bg: 'bg-green-500/10',
        glow: 'shadow-[0_0_20px_rgba(34,197,94,0.2)]',
        activeBg: 'bg-green-500'
      };
      case 'voice': return {
        text: 'text-purple-400',
        border: 'border-purple-500/30',
        bg: 'bg-purple-500/10',
        glow: 'shadow-[0_0_20px_rgba(168,85,247,0.2)]',
        activeBg: 'bg-purple-500'
      };
      default: return {
        text: 'text-gray-400',
        border: 'border-gray-500/30',
        bg: 'bg-gray-500/10',
        glow: 'shadow-[0_0_20px_rgba(107,114,128,0.2)]',
        activeBg: 'bg-gray-500'
      };
    }
  };

  const colors = getColorScheme();

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative p-5 rounded-[1.5rem] glass-panel transition-all duration-500 group overflow-hidden
        ${isActive ? `${colors.glow} bg-white/5` : 'border-white/5 hover:border-white/20'}
        ${isOffline ? 'opacity-50 grayscale' : ''}
      `}
      style={
        isActive && (colors as any).customColor
          ? {
            borderColor: (colors as any).customColorAlpha,
            boxShadow: `0 0 20px ${(colors as any).customColorAlpha}`,
          }
          : {}
      }
    >
      {/* Animated Background Gradient */}
      <motion.div
        className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[80px] transition-opacity duration-700 pointer-events-none
          ${isActive ? 'opacity-30' : 'opacity-0 group-hover:opacity-10'}
        `}
        style={
          (colors as any).customColor
            ? { backgroundColor: (colors as any).customColor }
            : {}
        }
      />

      <div className="relative z-10 flex flex-col h-full justify-between">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            className={`p-3 rounded-xl backdrop-blur-md transition-colors duration-300 ${isActive ? `${colors.bg}` : 'bg-white/5'}`}
          >
            <Icon
              svgName={iconPath}
              size="md"
              className={`transition-colors duration-300`}
              style={
                type === 'light' && isActive && rgbColor && rgbColor.length === 3
                  ? { color: `rgb(${rgbColor[0]}, ${rgbColor[1]}, ${rgbColor[2]})` }
                  : {}
              }
              isActive={isActive}
            />
          </motion.div>

          <div className="flex gap-2">
            <motion.div
              initial={false}
              animate={{
                backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                borderColor: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'
              }}
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-2 ${isActive ? colors.text : 'text-gray-500'}`}
            >
              {isActive && (
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${colors.activeBg}`}></span>
              )}
              {status}
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <h3 className={`font-bold text-lg leading-tight mb-1 transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-300'}`}>
            {name}
          </h3>
          <p className="text-xs text-gray-500 font-mono truncate group-hover:text-gray-400 transition-colors">
            {model}
          </p>

          <AnimatePresence>
            {value && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2"
              >
                <span className="text-2xl font-light text-white/90 tracking-tight">{value}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-4 gap-3 mt-auto">
          {onPrimaryAction ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                if (!isOffline) onPrimaryAction();
              }}
              disabled={isOffline}
              style={{ cursor: isOffline ? 'not-allowed' : 'pointer' }}
              className={`
                col-span-3 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all duration-300
                ${isActive
                  ? `${colors.activeBg} text-black shadow-lg shadow-${colors.activeBg}/20`
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10 hover:text-white'
                }
              `}
            >
              <Power className={`w-4 h-4 ${isActive ? 'fill-current' : ''}`} />
              <span>{isActive ? 'ON' : 'OFF'}</span>
            </motion.button>
          ) : (
            <div className="col-span-3"></div>
          )}

          <motion.button
            whileHover={{ scale: 1.05, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              if (!isOffline) onSecondaryAction?.();
            }}
            disabled={isOffline}
            style={{ cursor: isOffline ? 'not-allowed' : 'pointer' }}
            className="col-span-1 py-3 rounded-xl flex items-center justify-center bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10 transition-all"
          >
            <Settings className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
