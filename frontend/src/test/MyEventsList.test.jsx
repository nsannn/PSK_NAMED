import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import MyEventsList from '../pages/Customer/MyEventsList';

const mockNavigate = vi.fn();
const mockApiFetch = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

vi.mock('../utils/api', () => ({
  apiFetch: (...args) => mockApiFetch(...args)
}));

vi.mock('../utils/logger', () => ({
  logger: {
    error: vi.fn()
  }
}));

describe('MyEventsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockApiFetch.mockResolvedValue([
      {
        id: 1,
        name: 'Rock Show',
        date: '2026-01-01',
        location: 'Vilnius',
        description: 'Amazing concert',
        ticketsSold: 50,
        ticketsTotal: 100,
        revenue: 5000,
        price: 20,
        hasPoster: false
      }
    ]);
  });

  test('loads events', async () => {
    render(<MyEventsList />);

    // await waitFor(() => {
    //   expect(screen.getByText('Rock Show')).toBeInTheDocument();
    // });
    expect(await screen.findByText('Rock Show')).toBeInTheDocument();
  });

  test('search updates input', () => {
    render(<MyEventsList />);

    const input = screen.getByPlaceholderText('Search...');
    fireEvent.change(input, { target: { value: 'Festival' } });
    expect(input.value).toBe('Festival');
  });

  test('toggles event type filter', () => {
    render(<MyEventsList />);

    const concertBtn = screen.getByText('Concert');
    fireEvent.click(concertBtn);
    expect(concertBtn.className).toContain('option_selected');
  });

  test('opens sort menu', () => {
    render(<MyEventsList />);

    // Open the sort menu
    const sortButton = screen.getByRole('button', { name: /Sort/i });
    fireEvent.click(sortButton);

    // All sort options should now be in the DOM
    const allOptions = screen.getAllByTestId('sort-option-test');
    expect(allOptions.length).toBeGreaterThan(0); // menu opened

    // Check for a specific option by text
    const newestOption = allOptions.find(opt => opt.textContent === 'Newest');
    expect(newestOption).not.toBeUndefined();

    // Click the "Newest" option
    fireEvent.click(newestOption);
    expect(screen.getByText('Newest')).toBeInTheDocument();
});

  test('navigates to create event', () => {
    render(<MyEventsList />);

    fireEvent.click(screen.getAllByText('+ Create Event')[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/create-event');
  });

  test('opens delete modal', async () => {
    render(<MyEventsList />);

    await screen.findByText('Rock Show');
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.getByText('Cancel Event?')).toBeInTheDocument();
  });

  test('deletes event', async () => {
    mockApiFetch
      .mockResolvedValueOnce([
        {
          id: 1,
          name: 'Rock Show',
          date: '2026-01-01',
          location: 'Vilnius',
          description: 'Amazing concert',
          ticketsSold: 50,
          ticketsTotal: 100,
          revenue: 5000,
          price: 20
        }
      ])
      .mockResolvedValueOnce({});

    render(<MyEventsList />);

    await screen.findByText('Rock Show');
    
    fireEvent.click(screen.getByText('Cancel'));
    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/api/events/1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });
});