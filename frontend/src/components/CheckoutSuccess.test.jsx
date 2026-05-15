import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import CheckoutSuccess from './CheckoutSuccess';

// MOCK AUTH
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
  }),
}));

// MOCK ROUTER
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');

  return {
    ...actual,
    useSearchParams: () => [new URLSearchParams()],
    useNavigate: () => vi.fn(),
  };
});

describe('CheckoutSuccess', () => {
  test('shows sign in required message', () => {
    render(
      <MemoryRouter>
        <CheckoutSuccess />
      </MemoryRouter>
    );

    expect(screen.getByText(/sign in required/i))
      .toBeInTheDocument();
  });
});