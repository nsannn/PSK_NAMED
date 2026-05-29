import { describe, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { act } from 'react'
import EventDetails from './EventDetails';

const navigateMock = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
  useParams: () => ({ id: '1' }),
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

const mockEvent = {
  id: 1,
  title: 'Rock Festival',
  location: 'Berlin',
  description: 'Great music',
  date: '2026-06-01T18:00:00',
  hasPoster: false,
  tags: [],
  tickets: [
    {
      id: 1,
      type: 'VIP',
      quantity: 100,
      sold: 50,
      price: 100,
    },
  ],
};

describe('EventDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    apiFetch.mockImplementation((url) => {
      if (url.includes('/can-send-reminder')) {
        return Promise.resolve({ canSend: true });
      }

      if (url.includes('/validators')) {
        return Promise.resolve([]);
      }

      return Promise.resolve(mockEvent);
    });
  });

  test('shows loading state', () => {
    apiFetch.mockImplementation(() => new Promise(() => {}));

    render(<EventDetails />);

    expect(screen.getByText('Loading event details...')).toBeInTheDocument();
  });

  test('renders event details', async () => {
    render(<EventDetails />);

    expect(await screen.findByText('Rock Festival')).toBeInTheDocument();

    expect(screen.getByText('Berlin')).toBeInTheDocument();
  });

  test('opens cancel modal', async () => {
    render(<EventDetails />);

    await screen.findByText('Rock Festival');

    await act(async () => {
        await fireEvent.click(screen.getByText('Cancel'));
    });

    expect(screen.getByText('Cancel Event?')).toBeInTheDocument();
  });

  test('deletes event', async () => {
    render(<EventDetails />);

    await screen.findByText('Rock Festival');

    await act(async () => {
        await fireEvent.click(screen.getByText('Cancel'));
    });
    await act(async () => {
        await fireEvent.click(screen.getByText('Confirm'));
    });

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith('/api/events/1', {
        method: 'DELETE',
      });
    });
  });
});