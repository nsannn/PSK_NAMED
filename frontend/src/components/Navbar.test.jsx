import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Navbar from './Navbar';

// MOCK AUTH
let mockUser = null;

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
  }),
}));

// MOCK NAVIGATION
const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');

  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => ({
      pathname: '/',
    }),
  };
});

// MOCK AUTH MODAL
vi.mock('./AuthModal', () => ({
  default: () => <div>Auth Modal</div>,
}));

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = null;
  });

  test('renders sign in and register buttons', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(document.getElementById('btn-signin'))
        .toBeInTheDocument();

    expect(document.getElementById('btn-register'))
        .toBeInTheDocument();
  });

  test('opens auth modal when sign in clicked', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    fireEvent.click(document.getElementById('btn-signin'));

    expect(screen.getByText(/auth modal/i))
      .toBeInTheDocument();
  });

  test('navigates to dashboard', () => {
    mockUser = { role: 'Manager', email: 'manager@test.com' };

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    fireEvent.click(
      screen.getAllByRole('button', { name: /dashboard/i })[0]
    );

    expect(navigateMock).toHaveBeenCalledWith('/dashboard');
  });

  test('opens mobile menu', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByLabelText(/toggle menu/i));

    expect(document.querySelector('.mobile-sidebar--open'))
      .toBeInTheDocument();
  });
});