import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { act } from 'react'
import AuthModal from './AuthModal';

// MOCK AUTH CONTEXT
const loginMock = vi.fn();
const registerMock = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    login: loginMock,
    register: registerMock,
  }),
}));

describe('AuthModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders login mode correctly', () => {
    render(
      <AuthModal
        mode="login"
        onSwitchMode={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/sign in to your account/i))
      .toBeInTheDocument();

    expect(screen.getByRole('button', { name: /sign in/i }))
      .toBeInTheDocument();
  });

  test('renders register mode correctly', () => {
    render(
      <AuthModal
        mode="register"
        onSwitchMode={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/create new account/i))
      .toBeInTheDocument();

    expect(screen.getByPlaceholderText(/first name/i))
      .toBeInTheDocument();
  });

  test('shows error when passwords do not match', async () => {
    render(
      <AuthModal
        mode="register"
        onSwitchMode={vi.fn()}
        onClose={vi.fn()}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/first name/i), {
      target: { value: 'John' },
    });

    fireEvent.change(screen.getByPlaceholderText(/last name/i), {
      target: { value: 'Doe' },
    });

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'john@test.com' },
    });

    fireEvent.change(screen.getByPlaceholderText(/^password$/i), {
      target: { value: '123456' },
    });

    fireEvent.change(screen.getByPlaceholderText(/confirm password/i), {
      target: { value: '654321' },
    });

    fireEvent.click(screen.getByRole('checkbox'));

    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    expect(await screen.findByText(/passwords do not match/i))
      .toBeInTheDocument();
  });

  test('calls login function', async () => {
    render(
      <AuthModal
        mode="login"
        onSwitchMode={vi.fn()}
        onClose={vi.fn()}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'john@test.com' },
    });

    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: '123456' },
    });

    await act(async () => {
        await fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    });

    expect(loginMock).toHaveBeenCalled();
  });
});