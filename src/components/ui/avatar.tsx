import { User } from 'lucide-react';
import { ReactNode } from 'react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  children?: ReactNode;
}

export function Avatar({ 
  src, 
  alt, 
  firstName, 
  lastName, 
  username,
  size = 'md',
  className = '',
  children
}: AvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-xl',
    xl: 'h-24 w-24 text-3xl'
  };

  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    }
    if (username) {
      return username.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  // If children are provided, render as container (for backward compatibility)
  if (children) {
    return (
      <div className={`relative inline-flex ${sizeClasses[size]} ${className}`}>
        {children}
      </div>
    );
  }

  if (src) {
    return (
      <img
        src={src}
        alt={alt || 'Avatar'}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-primary/10 flex items-center justify-center font-medium text-primary ${className}`}
    >
      {getInitials()}
    </div>
  );
}

// AvatarFallback component for backward compatibility
interface AvatarFallbackProps {
  children: ReactNode;
  className?: string;
}

export function AvatarFallback({ children, className = '' }: AvatarFallbackProps) {
  return (
    <div className={`h-full w-full rounded-full bg-primary/10 flex items-center justify-center font-medium text-primary ${className}`}>
      {children}
    </div>
  );
}
