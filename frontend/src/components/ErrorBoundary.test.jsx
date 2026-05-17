import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

// MOCK LOGGER
vi.mock('../utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

// COMPONENT THAT THROWS ERROR
function BrokenComponent() {
  throw new Error('Test error');
}

describe('ErrorBoundary', () => {
  test('renders fallback UI when component crashes', () => {
    // silence React error output in test console
    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    );

    expect(
      screen.getByText(/oops! something went wrong/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/we've encountered an unexpected error/i)
    ).toBeInTheDocument();

    console.error.mockRestore();
  });

  test('refresh button calls page reload', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const reloadMock = vi.fn();

    Object.defineProperty(window, 'location', {
      value: {
        reload: reloadMock,
      },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText(/refresh page/i));

    expect(reloadMock).toHaveBeenCalled();

    console.error.mockRestore();
  });
});