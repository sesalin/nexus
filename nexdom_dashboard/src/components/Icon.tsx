import React from 'react';
import * as LucideIcons from 'lucide-react';
import {
  Lightbulb, ToggleLeft, Lock, Thermometer, Blinds, Camera, Tv, Fan, Speaker, Shield, Zap, Wifi, Radio,
  Power, Battery, BatteryCharging, BatteryLow, BatteryWarning, DoorOpen, AlertTriangle
} from 'lucide-react';

// SVG icon imports (existing imports from ModuleNav)
import energyIcon from '../assets/icons/Energia.svg';
import securityIcon from '../assets/icons/Camara.svg';
import voiceIcon from '../assets/icons/Asistente-voz.svg';
import gadgetsIcon from '../assets/icons/Smart-plug.svg';

// Dynamic import of all icons in assets/icons
const iconModules = import.meta.glob('../assets/icons/*.svg', { eager: true });
const iconMap: Record<string, string> = {};

// Build the map: 'light' -> '/assets/icons/light.svg'
for (const path in iconModules) {
  const filename = path.split('/').pop()?.replace('.svg', '');
  if (filename) {
    // @ts-ignore
    iconMap[filename] = iconModules[path].default;
  }
}

// Mapping from legacy SVG names to Lucide Components
const legacyIconMapping: Record<string, React.ElementType> = {
  'light': Lightbulb,
  'switch': ToggleLeft,
  'lock': Lock,
  'climate': Thermometer,
  'thermostat': Thermometer,
  'cover': Blinds,
  'camera': Camera,
  'media_player': Tv,
  'fan': Fan,
  'speaker': Speaker,
  'security': Shield,
  'energy': Zap,
  'sensor': Wifi,
  'remote': Radio,
  'button': Power,
  'battery': Battery,
  'door': DoorOpen,
  'alert': AlertTriangle,
  'Smart-plug': Zap, // Map specific file names if needed
  'Energia': Zap,
  'Camara': Camera,
  'Asistente-voz': Radio
};

interface IconProps {
  // For Lucide React icons
  lucideIcon?: keyof typeof LucideIcons;
  // For SVG icons  
  svgIcon?: 'energy' | 'security' | 'voice' | 'gadgets';
  // For dynamic SVG icons by filename
  svgName?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
  isActive?: boolean;
  isHovering?: boolean;
}

export const Icon: React.FC<IconProps> = ({
  lucideIcon,
  svgIcon,
  svgName,
  size = 'md',
  className = '',
  style,
  isActive = false,
  isHovering = false
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  // Get SVG icon source based on type
  const getSvgSource = () => {
    switch (svgIcon) {
      case 'energy': return energyIcon;
      case 'security': return securityIcon;
      case 'voice': return voiceIcon;
      case 'gadgets': return gadgetsIcon;
      default: return null;
    }
  };

  const svgSource = svgIcon ? getSvgSource() : null;

  // Determine color classes based on state (consistent with Home icon)
  const getColorClasses = () => {
    if (isActive) {
      return 'text-nexdom-lime drop-shadow-[0_0_5px_rgba(0,255,136,0.8)] brightness-125';
    }
    if (isHovering) {
      return 'text-white';
    }
    return 'text-gray-400';
  };

  // Render Lucide React icon (Explicit prop)
  if (lucideIcon) {
    const IconComponent = LucideIcons[lucideIcon] as React.ElementType;
    if (IconComponent) {
      return (
        <IconComponent
          className={`
            ${sizeClasses[size]} 
            transition-all duration-300 
            ${getColorClasses()}
            ${className}
          `}
          style={style}
        />
      );
    }
  }

  // Render Mapped Lucide Icon (from svgName)
  if (svgName && legacyIconMapping[svgName]) {
    const IconComponent = legacyIconMapping[svgName];
    return (
      <IconComponent
        className={`
          ${sizeClasses[size]} 
          transition-all duration-300 
          ${className} 
          /* Allow parent to control color via className or style */
        `}
        style={style}
      />
    );
  }

  // Render SVG icon (Fixed types)
  if (svgSource) {
    return (
      <img
        src={svgSource}
        alt={svgIcon || 'icon'}
        className={`
          ${sizeClasses[size]} 
          z-10 
          transition-all duration-300 
          object-contain
          ${className}
        `}
        style={style}
      />
    );
  }

  // Render dynamic SVG by name or URL (Fallback for unmapped icons)
  if (svgName) {
    // Try to find in our map first
    let finalSource = iconMap[svgName];

    // Fallback to direct path if not found
    if (!finalSource) {
      finalSource = (svgName.startsWith('http') || svgName.startsWith('/')
        ? svgName
        : `./icons/${svgName}.svg`);
    }

    // Ensure path is relative for Ingress
    if (finalSource && finalSource.startsWith('/')) {
      finalSource = `.${finalSource}`;
    }

    // Use img tag directly as requested by user
    return (
      <img
        src={finalSource}
        alt={svgName}
        className={`
          ${sizeClasses[size]} 
          transition-all duration-300 
          object-contain
          ${className}
        `}
        style={style}
      />
    );
  }

  // Fallback
  return <div className={`${sizeClasses[size]} bg-gray-400`} />;
};

// Convenience component for menu navigation
export const MenuIcon: React.FC<{
  type: 'lucide' | 'svg';
  name: string;
  isActive: boolean;
  isHovering?: boolean;
}> = ({ type, name, isActive, isHovering }) => {
  if (type === 'lucide') {
    return (
      <Icon
        lucideIcon={name as keyof typeof LucideIcons}
        isActive={isActive}
        isHovering={isHovering}
      />
    );
  } else {
    return (
      <Icon
        svgIcon={name as 'energy' | 'security' | 'voice' | 'gadgets'}
        isActive={isActive}
        isHovering={isHovering}
      />
    );
  }
};
