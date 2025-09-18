import { Breadcrumb } from './bread-crumb';

// Route to breadcrumb mapping
export const routeMap: Record<string, Breadcrumb[]> = {
  // Employee Management
  '/list/employees': [
    { text: 'Management', link: '/admin' },
    { text: 'Employee List', link: '/list/employees' }
  ],
  
  // Customer Management  
  '/list/customers': [
    { text: 'Management', link: '/admin' },
    { text: 'Customer List', link: '/list/customers' }
  ],
  
  // Ferry Management
  '/list/ferries': [
    { text: 'Management', link: '/admin' },
    { text: 'Ferry List', link: '/list/ferries' }
  ],
  
  // Schedule Management
  '/list/schedules': [
    { text: 'Management', link: '/admin' },
    { text: 'Schedule List', link: '/list/schedules' }
  ],
  
  // Timetable
  '/timetable': [
    { text: 'Timetable', link: '/timetable' }
  ],
  
  // Booking Routes
  '/booking': [
    { text: 'Management', link: '/customer' },
    { text: 'Booking', link: '/booking' }
  ],
  '/booking-history': [
    { text: 'Management', link: '/customer' },
    { text: 'Booking History', link: '/booking-history' }
  ],
  
  // Dashboard Routes
  '/admin': [
    { text: 'Dashboard', link: '/admin' }
  ],
  '/operator': [
    { text: 'Dashboard', link: '/operator' }
  ],
  '/accountant': [
    { text: 'Dashboard', link: '/accountant' }
  ],
  '/guard': [
    { text: 'Dashboard', link: '/guard' }
  ],
  '/customer': [
    { text: 'Dashboard', link: '/customer' }
  ],
  '/planner': [
    { text: 'Dashboard', link: '/planner' }
  ],
  '/gate_operator': [
    { text: 'Dashboard', link: '/gate_operator' }
  ],
  '/operation_manager': [
    { text: 'Dashboard', link: '/gate_operator' }
  ],
  
  // Settings
  '/settings': [
    { text: 'Settings', link: '/settings' }
  ],
  '/profile': [
    { text: 'Profile', link: '/profile' }
  ]
};

/**
 * Get dashboard route based on user role
 * @param userRole - User's role from session
 * @returns Dashboard route string
 */
export const getDashboardRoute = (userRole?: string): string => {
  if (!userRole) return '/home';
  const role = userRole.toUpperCase();
  if (role === 'OPERATION_MANAGER') return '/gate_operator'; // legacy page path
  return `/${userRole.toLowerCase()}`;
};

/**
 * Generate breadcrumbs based on current route
 * @param pathname - Current page path
 * @param customItems - Optional custom breadcrumb items to override default
 * @param userRole - Optional user role for dynamic dashboard links
 * @returns Array of breadcrumb items
 */
export function generateBreadcrumbs(
  pathname: string, 
  customItems?: Breadcrumb[],
  userRole?: string
): Breadcrumb[] {
  if (customItems) {
    return customItems;
  }
  
  const breadcrumbs = routeMap[pathname] || [];
  
  // If userRole is provided, update management links to use dynamic dashboard route
  if (userRole && breadcrumbs.length > 0 && breadcrumbs[0].text === 'Management') {
    const dashboardRoute = getDashboardRoute(userRole);
    return breadcrumbs.map(breadcrumb => 
      breadcrumb.text === 'Management' 
        ? { ...breadcrumb, link: dashboardRoute }
        : breadcrumb
    );
  }
  
  return breadcrumbs;
}

/**
 * Generate dynamic breadcrumbs for booking flow
 * @param step - Current booking step (1-4)
 * @returns Array of breadcrumb items for booking flow
 */
export function generateBookingBreadcrumbs(step: number): Breadcrumb[] {
  const items: Breadcrumb[] = [
    { text: 'Services', link: '/booking' }
  ];
  
  if (step >= 2) {
    items.push({ text: 'Ferry Selection', link: '/booking?step=2' });
  }
  if (step >= 3) {
    items.push({ text: 'Booking Details', link: '/booking?step=3' });
  }
  if (step >= 4) {
    items.push({ text: 'Payment', link: '/booking?step=4' });
  }
  
  return items;
} 