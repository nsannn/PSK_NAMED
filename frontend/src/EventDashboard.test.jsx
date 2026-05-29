import { describe, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
// import userEvent from '@testing-library/user-event';
import { act } from 'react'
import EventDashboard from './EventDashboard';

const navigateMock = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('./utils/api', () => ({
  apiFetch: vi.fn(),
}));

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

import { apiFetch } from './utils/api';

describe('EventDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('shows loading state', () => {
    apiFetch.mockReturnValue(new Promise(() => {}));

    render(<EventDashboard />);

    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  test('renders events', async () => {
    apiFetch.mockResolvedValueOnce([
      {
        id: 1,
        name: 'Concert A',
        date: '2026-06-01',
        ticketsSold: 50,
        ticketsTotal: 100,
        revenueAmount: 5000,
        price: 50,
      },
    ]);

    render(<EventDashboard />);

    expect((await screen.findAllByText('Concert A')).length).toBeGreaterThan(0);
  });

  test('shows empty state', async () => {
    apiFetch.mockResolvedValueOnce([]);

    render(<EventDashboard />);

    // await waitFor(() => {
    //   expect(screen.getByText('No events found.')).toBeInTheDocument();
    // });
    expect(await screen.findByText('No events found.')).toBeInTheDocument();
  });

  test('changes sort option', async () => {
    apiFetch.mockResolvedValueOnce([
      {
        id: 1,
        name: 'Concert A',
        date: '2026-06-01',
        ticketsSold: 50,
        ticketsTotal: 100,
        revenueAmount: 5000,
        price: 50,
      },
    ]);

    render(<EventDashboard />);

    const select = await screen.findByRole('combobox');

    await act(async () => {
        await fireEvent.change(select, { target: { value: 'name-asc' } });
    });

    expect(select.value).toBe('name-asc');
  });
});