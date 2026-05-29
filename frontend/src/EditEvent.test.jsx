import React from 'react';
import { describe, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditEvent from './EditEvent';

const mockNavigate = vi.fn();
const mockApiFetch = vi.fn();

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '1' }),
  };
});

// Mock api utils
vi.mock('./utils/api', () => ({
  apiFetch: (...args) => mockApiFetch(...args),
}));

// Mock logger
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

describe('EditEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockApiFetch.mockResolvedValue({
      title: 'Existing Event',
      date: '2026-06-01T12:00:00Z',
      location: 'Vilnius',
      description: 'Description',
      eventType: 'Festival',
      tags: [{ name: 'Outdoor' }],
      hasPoster: true,
      tickets: [
        {
          id: 1,
          type: 'VIP',
          quantity: 100,
          price: 50,
          sold: 0,
        },
      ],
    });
  });

  test('loads event data', async () => {
    render(<EditEvent />);

    expect(await screen.findByDisplayValue('Existing Event')).toBeInTheDocument();
  });

  test('updates title field', async () => {
    render(<EditEvent />);

    const input = await screen.findByDisplayValue('Existing Event');

    fireEvent.change(input, { target: { value: 'Updated Event' } });

    expect(screen.getByDisplayValue('Updated Event')).toBeInTheDocument();
  });

  test('adds ticket tier', async () => {
    render(<EditEvent />);

    await screen.findByDisplayValue('Existing Event');

    fireEvent.click(screen.getByText('+ Add Tier'));

    expect(screen.getAllByText('Tier Name').length).toBe(2);
  });

  test('saves event', async () => {
    mockApiFetch
      .mockResolvedValueOnce({
        title: 'Existing Event',
        date: '2026-06-01T12:00:00Z',
        location: 'Vilnius',
        description: 'Description',
        eventType: 'Festival',
        tags: [{ name: 'Outdoor' }],
        hasPoster: true,
        tickets: [
          {
            id: 1,
            type: 'VIP',
            quantity: 100,
            price: 50,
            sold: 0,
          },
        ],
      })
      .mockResolvedValueOnce({});

    render(<EditEvent />);

    await screen.findByText('Save Changes');

    fireEvent.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/events/1',
        expect.objectContaining({
          method: 'PUT',
        })
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('opens delete modal', async () => {
    render(<EditEvent />);

    await screen.findByTestId('staff_event_delete');

    fireEvent.click(screen.getByTestId('staff_event_delete'));

    expect(screen.getByText('Delete Event?')).toBeInTheDocument();
  });

  it('deletes event', async () => {
    mockApiFetch
      .mockResolvedValueOnce({ title: 'Existing Event', tickets: [] })
      .mockResolvedValueOnce({});

    render(<EditEvent />);

    await screen.findByTestId('staff_event_delete');

    fireEvent.click(screen.getByTestId('staff_event_delete'));

    fireEvent.click(screen.getByTestId('confirm_delete'));

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/events/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });
});