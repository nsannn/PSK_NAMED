import { describe, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { act } from 'react';

vi.mock('../utils/api', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('../utils/logger', () => ({
  logger: {
    warn: vi.fn(),
  },
}));

import { apiFetch } from '../utils/api';

function TestComponent() {
  const { user, login, register, logout, loading } = useAuth();

  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'done'}</div>
      <div data-testid="user">{user ? user.email : 'none'}</div>

      <button onClick={() => login('test@test.com', '123456')}>
        Login
      </button>

      <button
        onClick={() =>
          register('John', 'Doe', 'john@test.com', '123456', '123456', 'Customer')
        }
      >
        Register
      </button>

      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('fetches current user on mount', async () => {
    apiFetch.mockResolvedValueOnce({
      email: 'me@test.com',
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(await screen.findByText('me@test.com'))
        .toBeInTheDocument();
  });

  test('handles failed fetchMe', async () => {
    apiFetch.mockRejectedValueOnce(new Error('Unauthorized'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(await screen.findByText('none'))
        .toBeInTheDocument();
  });

  test('login updates user', async () => {
    apiFetch
      .mockRejectedValueOnce(new Error()) // fetchMe
      .mockResolvedValueOnce({
        user: { email: 'login@test.com' },
      });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Login'));
    });

    expect(await screen.findByText('login@test.com'))
        .toBeInTheDocument();
  });

  test('register updates user', async () => {
    apiFetch
      .mockRejectedValueOnce(new Error())
      .mockResolvedValueOnce({
        user: { email: 'register@test.com' },
      });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Register'));
    });

    expect(await screen.findByText('register@test.com'))
        .toBeInTheDocument();
  });

  test('logout clears user', async () => {
    apiFetch
      .mockResolvedValueOnce({
        email: 'start@test.com',
      })
      .mockResolvedValueOnce({});

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(await screen.findByText('start@test.com'))
        .toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText('Logout'));
    });

    expect(await screen.findByText('none'))
        .toBeInTheDocument();
  });
});