import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import UserMenu from './UserMenu';

const logoutMock = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    logout: logoutMock,
    user: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@test.com',
      role: 'Customer',
    },
  }),
}));

describe('UserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders user initials', () => {
    render(<UserMenu />);

    expect(screen.getByTestId('user-avatar-small'))
      .toHaveTextContent('JD');
  });

  test('opens dropdown menu', () => {
    render(<UserMenu />);

    fireEvent.click(screen.getByLabelText(/user menu/i));

    expect(screen.getByText(/john doe/i))
      .toBeInTheDocument();
  });

  test('calls logout when logout clicked', () => {
    render(<UserMenu />);

    fireEvent.click(screen.getByLabelText(/user menu/i));

    fireEvent.click(screen.getByText(/logout/i));

    expect(logoutMock).toHaveBeenCalled();
  });
});