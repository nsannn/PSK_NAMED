import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, vi, beforeEach } from 'vitest';
import EventStatistics from './EventStatistics';

const mockApiFetch = vi.fn();

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ id: '1' }),
  };
});

// Mock your api
vi.mock('./utils/api', () => ({
  apiFetch: (...args) => mockApiFetch(...args),
}));

// Mock your logger
vi.mock('./utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock('./context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'manager-1',
      role: 'Manager',
    },
    loading: false,
  }),
}));

describe('EventStatistics', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockApiFetch.mockResolvedValue({
      title: 'Music Fest',
      location: 'Kaunas',
      date: '2026-01-01T12:00:00Z',
      tags: [
        { id: 1, name: 'Festival' },
        { id: 2, name: 'Outdoor' },
      ],
      tickets: [
        {
          id: 1,
          type: 'VIP',
          sold: 50,
          quantity: 100,
          price: 80,
        },
        {
          id: 2,
          type: 'Regular',
          sold: 200,
          quantity: 300,
          price: 20,
        },
      ],
    });
  });

  test('renders statistics', async () => {
    render(<EventStatistics />);

    expect(await screen.findByText('Music Fest')).toBeInTheDocument();

    expect(screen.getByText('Sales Overview')).toBeInTheDocument();
    expect(screen.getByText('Revenue Overview')).toBeInTheDocument();
    expect(screen.getByText('Pricing')).toBeInTheDocument();
  });

  test('calculates totals correctly', async () => {
    render(<EventStatistics />);

    await screen.findByText('Music Fest');

    const salesCard = screen.getByText('Sales Overview').closest('div');

    // Find Tickets Sold row
    const ticketsSoldRow = within(salesCard).getByText('Tickets Sold').closest('div');
    expect(within(ticketsSoldRow).getByText('250')).toBeInTheDocument();

    // Find Total Capacity row
    const totalCapacityRow = within(salesCard).getByText('Total Capacity').closest('div');
    expect(within(totalCapacityRow).getByText('400')).toBeInTheDocument();

    // Find Available row
    const availableRow = within(salesCard).getByText('Available').closest('div');
    expect(within(availableRow).getByText('150')).toBeInTheDocument();
  });

  test('shows tier breakdown', async () => {
    render(<EventStatistics />);

    // VIP tier
    const vipTier = await screen.findByTestId('tier-vip');
    expect(within(vipTier).getByText('VIP')).toBeInTheDocument();
    expect(within(vipTier).getByText('50 / 100')).toBeInTheDocument();

    // Regular tier
    const regularTier = await screen.findByTestId('tier-regular');
    expect(within(regularTier).getByText('Regular')).toBeInTheDocument();
    expect(within(regularTier).getByText('200 / 300')).toBeInTheDocument();
  });

  test('shows event info', async () => {
    render(<EventStatistics />);
    
    // Wait for the location to appear
    const locationSpan = await screen.findByText('Kaunas');
    
    // Scope to the parent InfoCard
    const infoCard = locationSpan.closest('.es-info-card');
    expect(infoCard).toBeInTheDocument();
    
    // Check that Location exists inside this card
    expect(within(infoCard).getByText('Kaunas')).toBeInTheDocument();
    
    // Check that type/tag exists inside this card
    expect(within(infoCard).getByText('Outdoor')).toBeInTheDocument();
  });
});