'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  minItemWidth?: string;
  maxItemWidth?: string;
  autoFit?: boolean;
  equalHeight?: boolean;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className,
  cols = {
    default: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 4,
    '2xl': 5
  },
  gap = {
    default: 4,
    sm: 4,
    md: 6,
    lg: 6,
    xl: 8,
    '2xl': 8
  },
  minItemWidth,
  maxItemWidth,
  autoFit = false,
  equalHeight = false
}) => {
  // Generate grid classes based on cols prop
  const getGridCols = () => {
    const classes = [];
    
    if (cols.default) classes.push(`grid-cols-${cols.default}`);
    if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
    if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
    if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
    if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);
    if (cols['2xl']) classes.push(`2xl:grid-cols-${cols['2xl']}`);
    
    return classes.join(' ');
  };

  // Generate gap classes based on gap prop
  const getGridGap = () => {
    const classes = [];
    
    if (gap.default) classes.push(`gap-${gap.default}`);
    if (gap.sm) classes.push(`sm:gap-${gap.sm}`);
    if (gap.md) classes.push(`md:gap-${gap.md}`);
    if (gap.lg) classes.push(`lg:gap-${gap.lg}`);
    if (gap.xl) classes.push(`xl:gap-${gap.xl}`);
    if (gap['2xl']) classes.push(`2xl:gap-${gap['2xl']}`);
    
    return classes.join(' ');
  };

  // Auto-fit grid template
  const getAutoFitStyle = () => {
    if (!autoFit || !minItemWidth) return {};
    
    return {
      gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, ${maxItemWidth || '1fr'}))`
    };
  };

  return (
    <div 
      className={cn(
        'grid w-full',
        !autoFit && getGridCols(),
        getGridGap(),
        equalHeight && 'grid-rows-[masonry]',
        className
      )}
      style={getAutoFitStyle()}
    >
      {children}
    </div>
  );
};

// Predefined grid layouts for common use cases
export const APICardGrid: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <ResponsiveGrid
    cols={{
      default: 1,
      sm: 2,
      md: 2,
      lg: 3,
      xl: 4,
      '2xl': 5
    }}
    gap={{
      default: 4,
      sm: 4,
      md: 6,
      lg: 6,
      xl: 6,
      '2xl': 8
    }}
    className={className}
    equalHeight
  >
    {children}
  </ResponsiveGrid>
);

export const DashboardGrid: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <ResponsiveGrid
    cols={{
      default: 1,
      sm: 1,
      md: 2,
      lg: 3,
      xl: 4,
      '2xl': 4
    }}
    gap={{
      default: 4,
      sm: 6,
      md: 6,
      lg: 8,
      xl: 8,
      '2xl': 8
    }}
    className={className}
  >
    {children}
  </ResponsiveGrid>
);

export const MetricsGrid: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <ResponsiveGrid
    cols={{
      default: 1,
      sm: 2,
      md: 2,
      lg: 4,
      xl: 4,
      '2xl': 6
    }}
    gap={{
      default: 3,
      sm: 4,
      md: 4,
      lg: 6,
      xl: 6,
      '2xl': 6
    }}
    className={className}
  >
    {children}
  </ResponsiveGrid>
);

export const AdminGrid: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <ResponsiveGrid
    cols={{
      default: 1,
      sm: 1,
      md: 2,
      lg: 2,
      xl: 3,
      '2xl': 3
    }}
    gap={{
      default: 4,
      sm: 6,
      md: 6,
      lg: 8,
      xl: 8,
      '2xl': 8
    }}
    className={className}
  >
    {children}
  </ResponsiveGrid>
);

// Auto-fit grid for dynamic content
export const AutoFitGrid: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  minWidth?: string;
  maxWidth?: string;
}> = ({ 
  children, 
  className,
  minWidth = '280px',
  maxWidth = '1fr'
}) => (
  <ResponsiveGrid
    autoFit
    minItemWidth={minWidth}
    maxItemWidth={maxWidth}
    gap={{
      default: 4,
      sm: 6,
      md: 6,
      lg: 8,
      xl: 8,
      '2xl': 8
    }}
    className={className}
  >
    {children}
  </ResponsiveGrid>
);

export default ResponsiveGrid;