import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import CheckoutCancel from './CheckoutCancel';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('CheckoutCancel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders cancelled message', () => {
    render(
      <MemoryRouter>
        <CheckoutCancel />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/payment cancelled/i)
    ).toBeInTheDocument();
  });

  test('navigates to checkout page', () => {
    render(
      <MemoryRouter>
        <CheckoutCancel />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(navigateMock).toHaveBeenCalledWith('/checkout');
  });

  test('navigates home', () => {
    render(
      <MemoryRouter>
        <CheckoutCancel />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/back to home/i));

    expect(navigateMock).toHaveBeenCalledWith('/');
  });
});