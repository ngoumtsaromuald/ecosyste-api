'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChevronRight, ExternalLink } from 'lucide-react';

interface TouchOptimizedCardProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'interactive' | 'elevated' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  href?: string;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  icon?: React.ReactNode;
  image?: {
    src: string;
    alt: string;
    aspectRatio?: 'square' | 'video' | 'wide';
  };
  actions?: {
    primary?: {
      label: string;
      onClick: () => void;
      variant?: 'default' | 'secondary' | 'outline';
    };
    secondary?: {
      label: string;
      onClick: () => void;
      variant?: 'default' | 'secondary' | 'outline';
    };
  };
  touchOptimized?: boolean;
  showArrow?: boolean;
}

export const TouchOptimizedCard: React.FC<TouchOptimizedCardProps> = ({
  title,
  description,
  children,
  footer,
  className,
  variant = 'default',
  size = 'md',
  onClick,
  href,
  badge,
  icon,
  image,
  actions,
  touchOptimized = true,
  showArrow = false
}) => {
  const isInteractive = onClick || href || variant === 'interactive';
  
  const cardVariants = {
    default: 'border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200',
    interactive: 'border border-gray-200 bg-white shadow-sm hover:shadow-lg hover:border-blue-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer',
    elevated: 'border-0 bg-white shadow-lg hover:shadow-xl transition-all duration-300',
    minimal: 'border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm transition-all duration-200'
  };

  const sizeVariants = {
    sm: 'p-3',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  };

  const touchStyles = touchOptimized ? {
    minHeight: '44px', // Minimum touch target size
    minWidth: '44px'
  } : {};

  const handleClick = () => {
    if (href) {
      window.open(href, '_blank', 'noopener,noreferrer');
    } else if (onClick) {
      onClick();
    }
  };

  const CardWrapper = ({ children: cardChildren }: { children: React.ReactNode }) => {
    if (isInteractive) {
      return (
        <Card 
          className={cn(
            cardVariants[variant],
            touchOptimized && 'active:scale-[0.98] touch-manipulation',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            className
          )}
          onClick={handleClick}
          style={touchStyles}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick();
            }
          }}
        >
          {cardChildren}
        </Card>
      );
    }

    return (
      <Card className={cn(cardVariants[variant], className)}>
        {cardChildren}
      </Card>
    );
  };

  return (
    <CardWrapper>
      {/* Image */}
      {image && (
        <div className={cn(
          'relative overflow-hidden rounded-t-lg -m-1 mb-4',
          image.aspectRatio === 'square' && 'aspect-square',
          image.aspectRatio === 'video' && 'aspect-video',
          image.aspectRatio === 'wide' && 'aspect-[21/9]',
          !image.aspectRatio && 'aspect-video'
        )}>
          <img 
            src={image.src} 
            alt={image.alt}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
          {badge && (
            <div className="absolute top-2 right-2">
              <Badge variant={badge.variant} className="shadow-sm">
                {badge.text}
              </Badge>
            </div>
          )}
        </div>
      )}

      <CardHeader className={cn(
        sizeVariants[size],
        image && 'pt-0'
      )}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {icon && (
              <div className="flex-shrink-0 mt-1">
                {icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className={cn(
                'line-clamp-2',
                size === 'sm' && 'text-base',
                size === 'md' && 'text-lg sm:text-xl',
                size === 'lg' && 'text-xl sm:text-2xl'
              )}>
                {title}
              </CardTitle>
              {description && (
                <CardDescription className={cn(
                  'mt-2 line-clamp-3',
                  size === 'sm' && 'text-sm',
                  size === 'md' && 'text-sm sm:text-base',
                  size === 'lg' && 'text-base sm:text-lg'
                )}>
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
          
          {/* Badge (when no image) */}
          {badge && !image && (
            <Badge variant={badge.variant} className="flex-shrink-0">
              {badge.text}
            </Badge>
          )}
          
          {/* Arrow indicator */}
          {showArrow && isInteractive && (
            <div className="flex-shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors">
              {href ? (
                <ExternalLink className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          )}
        </div>
      </CardHeader>

      {/* Content */}
      {children && (
        <CardContent className={cn(
          sizeVariants[size],
          'pt-0'
        )}>
          {children}
        </CardContent>
      )}

      {/* Actions or Footer */}
      {(actions || footer) && (
        <CardFooter className={cn(
          sizeVariants[size],
          'pt-0 flex-col sm:flex-row gap-2 sm:gap-3'
        )}>
          {actions && (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              {actions.primary && (
                <Button
                  variant={actions.primary.variant || 'default'}
                  onClick={actions.primary.onClick}
                  className={cn(
                    'w-full sm:w-auto',
                    touchOptimized && 'min-h-[44px] px-6'
                  )}
                >
                  {actions.primary.label}
                </Button>
              )}
              {actions.secondary && (
                <Button
                  variant={actions.secondary.variant || 'outline'}
                  onClick={actions.secondary.onClick}
                  className={cn(
                    'w-full sm:w-auto',
                    touchOptimized && 'min-h-[44px] px-6'
                  )}
                >
                  {actions.secondary.label}
                </Button>
              )}
            </div>
          )}
          {footer && (
            <div className="w-full sm:w-auto sm:ml-auto">
              {footer}
            </div>
          )}
        </CardFooter>
      )}
    </CardWrapper>
  );
};

// Specialized card variants
export const APICard: React.FC<{
  title: string;
  description: string;
  category: string;
  version: string;
  status: 'active' | 'deprecated' | 'beta';
  onClick: () => void;
  className?: string;
}> = ({ title, description, category, version, status, onClick, className }) => {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    deprecated: 'bg-red-100 text-red-800',
    beta: 'bg-blue-100 text-blue-800'
  };

  return (
    <TouchOptimizedCard
      title={title}
      description={description}
      variant="interactive"
      onClick={onClick}
      showArrow
      badge={{
        text: status.toUpperCase(),
        variant: status === 'active' ? 'default' : status === 'deprecated' ? 'destructive' : 'secondary'
      }}
      className={className}
    >
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span className="font-medium">{category}</span>
        <span>v{version}</span>
      </div>
    </TouchOptimizedCard>
  );
};

export const MetricCard: React.FC<{
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon?: React.ReactNode;
  className?: string;
}> = ({ title, value, change, icon, className }) => {
  return (
    <TouchOptimizedCard
      title={title}
      variant="elevated"
      size="sm"
      icon={icon}
      className={className}
    >
      <div className="space-y-2">
        <div className="text-2xl sm:text-3xl font-bold text-gray-900">
          {value}
        </div>
        {change && (
          <div className={cn(
            'flex items-center text-sm font-medium',
            change.type === 'increase' ? 'text-green-600' : 'text-red-600'
          )}>
            <span className="mr-1">
              {change.type === 'increase' ? '↗' : '↘'}
            </span>
            {Math.abs(change.value)}%
          </div>
        )}
      </div>
    </TouchOptimizedCard>
  );
};

export default TouchOptimizedCard;