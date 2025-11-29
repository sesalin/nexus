import React from 'react';
import * as LucideIcons from 'lucide-react';

// SVG icon imports (existing imports from ModuleNav)
import energyIcon from '../assets/icons/Energia.svg';
import securityIcon from '../assets/icons/Camara.svg';
import voiceIcon from '../assets/icons/Asistente-voz.svg';
import gadgetsIcon from '../assets/icons/Smart-plug.svg';

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

  // Render Lucide React icon
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
        />
      );
    }
  }

  // Render SVG icon
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
          ${getColorClasses()}
          ${className}
        `}
      />
    );
  }

  // Render dynamic SVG by name or URL
  if (svgName) {
    const isAbsolute = svgName.startsWith('http') || svgName.startsWith('/');
    // CRITICAL FIX: Use relative path './icons/' to support HA Ingress
    // Ingress serves the app at a subpath, so '/icons/' (absolute) fails.
    const dynamicSvgSource = isAbsolute
      ? svgName
      : `./icons/${svgName}.svg`;

    return (
      <div
        className={`
          ${sizeClasses[size]} 
          transition-all duration-300 
          ${getColorClasses()}
          ${className}
        `}
        style={{
          backgroundColor: 'currentColor',
          maskImage: `url(${dynamicSvgSource})`,
          maskSize: 'contain',
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskImage: `url(${dynamicSvgSource})`,
          WebkitMaskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          ...style, // Merge custom styles
        }}
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
