import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import SubscriptionsPage from '../SubscriptionsPage';
import { AuthContext } from '../../context/AuthContext';
import * as subscriptionsApi from '../../api/subscriptions';
import * as categoriesApi from '../../api/categories';

// Mock the APIs
vi.mock('../../api/subscriptions');
vi.mock('../../api/categories');

const mockUser = {
  id: '1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  currency: 'USD',
  createdAt: '2024-01-01T00:00:00Z',
};

const mockSubscription = {
  id: 1,
  name: 'Netflix',
  description: 'Streaming service',
  cost: 15.99,
  currency: 'USD',
  billingCycle: 2,
  nextBillingDate: '2024-02-01',
  isActive: true,
  isTrial: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  category: {
    id: 1,
    name: 'Entertainment',
    color: '#ff6b35',
    isDefault: false,
    createdAt: '2024-01-01T00:00:00Z',
  },
  isConverted: false,
  isRateStale: false,
};

const mockCategories = [
  {
    id: 1,
    name: 'Entertainment',
    color: '#ff6b35',
    isDefault: false,
    createdAt: '2024-01-01T00:00:00Z',
  },
];

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const authContextValue = {
    user: mockUser,
    login: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: true,
    isLoading: false,
  };

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthContext.Provider value={authContextValue}>
          {component}
        </AuthContext.Provider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('SubscriptionsPage - Edit and View Details', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock API responses
    vi.mocked(subscriptionsApi.getSubscriptions).mockResolvedValue([mockSubscription]);
    vi.mocked(categoriesApi.getCategories).mockResolvedValue(mockCategories);
    vi.mocked(subscriptionsApi.updateSubscription).mockResolvedValue();
  });

  it('should open view details dialog when clicking view details', async () => {
    renderWithProviders(<SubscriptionsPage />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Netflix')).toBeInTheDocument();
    });

    // Find and click the actions dropdown
    const actionsButton = screen.getByRole('button', { name: /actions/i });
    fireEvent.click(actionsButton);

    // Click view details
    const viewDetailsButton = screen.getByText('View Details');
    fireEvent.click(viewDetailsButton);

    // Check if view details dialog is open
    await waitFor(() => {
      expect(screen.getByText('Subscription Details')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Netflix')).toBeInTheDocument();
      expect(screen.getByText('Entertainment')).toBeInTheDocument();
    });
  });

  it('should open edit dialog with pre-populated data when clicking edit', async () => {
    renderWithProviders(<SubscriptionsPage />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Netflix')).toBeInTheDocument();
    });

    // Find and click the actions dropdown
    const actionsButton = screen.getByRole('button', { name: /actions/i });
    fireEvent.click(actionsButton);

    // Click edit
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    // Check if edit dialog is open with pre-populated data
    await waitFor(() => {
      expect(screen.getByText('Edit Subscription')).toBeInTheDocument();
      
      // Check if form fields are pre-populated
      const nameInput = screen.getByDisplayValue('Netflix');
      const costInput = screen.getByDisplayValue('15.99');
      
      expect(nameInput).toBeInTheDocument();
      expect(costInput).toBeInTheDocument();
    });
  });

  it('should call update API when saving changes in edit dialog', async () => {
    renderWithProviders(<SubscriptionsPage />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Netflix')).toBeInTheDocument();
    });

    // Open edit dialog
    const actionsButton = screen.getByRole('button', { name: /actions/i });
    fireEvent.click(actionsButton);
    
    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    // Wait for edit dialog to open
    await waitFor(() => {
      expect(screen.getByText('Edit Subscription')).toBeInTheDocument();
    });

    // Modify the name
    const nameInput = screen.getByDisplayValue('Netflix');
    fireEvent.change(nameInput, { target: { value: 'Netflix Premium' } });

    // Click save
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    // Verify API was called
    await waitFor(() => {
      expect(subscriptionsApi.updateSubscription).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          name: 'Netflix Premium',
          cost: 15.99,
          currency: 'USD',
          billingCycle: 2,
          isActive: true,
          isTrial: false,
        })
      );
    });
  });

  it('should close dialogs when clicking cancel or close buttons', async () => {
    renderWithProviders(<SubscriptionsPage />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Netflix')).toBeInTheDocument();
    });

    // Test view details dialog close
    const actionsButton = screen.getByRole('button', { name: /actions/i });
    fireEvent.click(actionsButton);
    
    const viewDetailsButton = screen.getByText('View Details');
    fireEvent.click(viewDetailsButton);

    await waitFor(() => {
      expect(screen.getByText('Subscription Details')).toBeInTheDocument();
    });

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Subscription Details')).not.toBeInTheDocument();
    });
  });
});
