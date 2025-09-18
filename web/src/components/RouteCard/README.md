# RouteCard Components

A comprehensive set of React components for managing ferry routes in the ROPAX Management System.

## Components Overview

### 1. RouteDetailModal
**Purpose**: Display detailed information about a ferry route
**Usage**: View route information including departure/arrival ports, duration, pricing, and status

**Features**:
- Complete route information display
- Port details with city and country
- Duration formatting (hours/days)
- Currency formatting
- Status indicators
- Quick access to edit/delete actions

### 2. RouteEditModal
**Purpose**: Edit existing route information
**Usage**: Modify route details including name, ports, duration, price, and status

**Features**:
- Form validation for all fields
- Port selection dropdowns
- Duration input with limits (1-168 hours)
- Price validation with currency formatting
- Status toggle (Active/Inactive)
- Success/error feedback
- Async save operation

### 3. RouteDeleteModal
**Purpose**: Safely delete a route with confirmation
**Usage**: Remove routes from the system with proper confirmation

**Features**:
- Route name confirmation required
- Detailed route information display
- Warning about permanent deletion
- Loading states during deletion
- Error handling

### 4. AddRouteCard
**Purpose**: Create new ferry routes
**Usage**: Add new routes to the system

**Features**:
- Complete route creation form
- Port selection from available ports
- Form validation
- Duration and price inputs with validation
- Initial status setting
- Success feedback with auto-close

## Interface Definitions

### Route Interface
```typescript
interface Route {
  id: number;
  routeName: string;
  departurePort: {
    id: number;
    portName: string;
    city: string;
    country: string;
  };
  arrivalPort: {
    id: number;
    portName: string;
    city: string;
    country: string;
  };
  durationHours: number;
  price: number;
  isActive: boolean;
  createdAt?: string;
}
```

### Port Interface
```typescript
interface Port {
  id: number;
  portName: string;
  city: string;
  country: string;
}
```

## Usage Examples

### Import Components
```typescript
import {
  RouteDetailModal,
  RouteEditModal,
  RouteDeleteModal,
  AddRouteCard
} from '@/components/RouteCard';
```

### Using RouteDetailModal
```typescript
const [viewModalOpen, setViewModalOpen] = useState(false);
const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

<RouteDetailModal
  route={selectedRoute}
  isOpen={viewModalOpen}
  onClose={() => {
    setViewModalOpen(false);
    setSelectedRoute(null);
  }}
  onEdit={(route) => {
    // Handle edit action
    handleEdit(route);
  }}
  onDelete={(route) => {
    // Handle delete action
    handleDelete(route);
  }}
/>
```

### Using RouteEditModal
```typescript
const [editModalOpen, setEditModalOpen] = useState(false);

<RouteEditModal
  route={selectedRoute}
  isOpen={editModalOpen}
  onClose={() => {
    setEditModalOpen(false);
    setSelectedRoute(null);
  }}
  onSuccess={() => {
    setEditModalOpen(false);
    setSelectedRoute(null);
    refetch(); // Refresh route list
  }}
/>
```

### Using RouteDeleteModal
```typescript
const [deleteModalOpen, setDeleteModalOpen] = useState(false);

<RouteDeleteModal
  route={selectedRoute}
  isOpen={deleteModalOpen}
  onClose={() => {
    setDeleteModalOpen(false);
    setSelectedRoute(null);
  }}
  onSuccess={() => {
    setDeleteModalOpen(false);
    setSelectedRoute(null);
    refetch(); // Refresh route list
  }}
/>
```

### Using AddRouteCard
```typescript
<AddRouteCard
  onRouteAdded={() => {
    refetch(); // Refresh route list after adding
  }}
  buttonText="Create New Route"
  buttonClassName="custom-button-class"
/>
```

## API Requirements

The RouteCard components expect the following API endpoints:

### Routes API
- `GET /api/routes` - Get paginated routes
- `GET /api/routes/active` - Get active routes only
- `POST /api/routes` - Create new route
- `PUT /api/routes/{id}` - Update existing route
- `DELETE /api/routes/{id}` - Delete route

### Ports API
- `GET /api/ports` - Get all available ports for route creation/editing

## Validation Rules

### Route Name
- Required field
- Minimum 3 characters
- Should be descriptive (e.g., "Jakarta - Bali Express")

### Departure/Arrival Ports
- Both ports are required
- Departure and arrival ports must be different
- Ports must be selected from available port list

### Duration
- Required field
- Must be greater than 0
- Maximum 168 hours (7 days)
- Displayed in human-readable format (hours/days)

### Price
- Required field
- Must be greater than 0
- Maximum $10,000
- Formatted as currency (USD)

### Status
- Boolean: Active (true) or Inactive (false)
- Active routes are available for booking
- Inactive routes are not available for booking

## Styling

All components use Tailwind CSS classes and follow the design system:

- **Color Scheme**: Blue primary, red for destructive actions, green for success
- **Typography**: Consistent font sizes and weights
- **Spacing**: Proper padding and margins using Tailwind's spacing scale
- **Responsive**: Components adapt to different screen sizes
- **Accessibility**: Proper ARIA labels, keyboard navigation, and color contrast

## Error Handling

- Network errors are caught and displayed to users
- Validation errors are shown inline with form fields
- Success states provide positive feedback
- Loading states prevent multiple submissions

## Dependencies

- React 18+
- Tailwind CSS
- Lucide React (for icons)
- TypeScript support

## Integration Notes

- Components expect route data to match the backend API response structure
- All modals use portal rendering and proper z-index stacking
- Form submissions are debounced to prevent duplicate requests
- Success callbacks allow parent components to refresh data
- Error states provide actionable feedback to users