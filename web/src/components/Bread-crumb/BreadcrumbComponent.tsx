"use client";

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { Breadcrumb } from './bread-crumb';

interface BreadcrumbProps {
  items: Breadcrumb[];
  className?: string;
}

const BreadcrumbComponent: React.FC<BreadcrumbProps> = ({
  items,
  className = ''
}) => {
  return (
    <nav 
      className={`flex items-center space-x-1 text-sm text-gray-600 mb-6 ${className}`}
      aria-label="Breadcrumb"
    >
      {/* Home Link */}
      <Link
        href="/home"
        className="flex items-center hover:text-blue-600 transition-colors duration-200"
        aria-label="Go to home page"
      >
        <Home className="h-4 w-4" />
        <span className="ml-1 hidden sm:inline">Home</span>
      </Link>

      {/* Breadcrumb Items */}
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
          
          {index === items.length - 1 ? (
            // Current page (not clickable)
            <span 
              className="font-medium text-gray-900 truncate"
              aria-current="page"
            >
              {item.text}
            </span>
          ) : (
            // Clickable breadcrumb link
            <Link
              href={item.link}
              className="hover:text-blue-600 transition-colors duration-200 truncate"
              title={item.text}
            >
              {item.text}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default BreadcrumbComponent; 