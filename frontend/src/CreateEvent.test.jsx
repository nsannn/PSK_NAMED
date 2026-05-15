import React from 'react';
import { describe, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateEvent from './CreateEvent';

// mocks
const mockNavigate = vi.fn();
const mockApiFetch = vi.fn();

// react-router-dom mock
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// api mock
vi.mock('./utils/api', () => ({
    apiFetch: (...args) => mockApiFetch(...args),
}));

// logger mock
vi.mock('./utils/logger', () => ({
    logger: {
        error: vi.fn(),
    },
}));

global.URL.createObjectURL = vi.fn(() => 'preview-url');

describe('CreateEvent', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('renders form fields', () => {
        render(<CreateEvent />);

        expect(screen.getByText('Create New Event')).toBeInTheDocument();
        expect(screen.getByLabelText('Event Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Location')).toBeInTheDocument();
        expect(screen.getByText('Create Event')).toBeInTheDocument();
    });

    test('updates input values', () => {
        render(<CreateEvent />);

        fireEvent.change(screen.getByLabelText('Event Name'), {
            target: { value: 'Summer Festival' },
        });

        expect(screen.getByDisplayValue('Summer Festival')).toBeInTheDocument();
    });

    test('adds ticket tier', () => {
        render(<CreateEvent />);

        fireEvent.click(screen.getByText('+ Add Tier'));

        expect(screen.getAllByText('Tier Name').length).toBe(2);
    });

    test('toggles tags', () => {
        render(<CreateEvent />);

        const onlineBtn = screen.getByText('Online');

        fireEvent.click(onlineBtn);

        expect(onlineBtn.className).toContain('option_selected');
    });

    test('uploads poster preview', () => {
        render(<CreateEvent />);

        const file = new File(['img'], 'poster.png', { type: 'image/png' });

        fireEvent.change(screen.getByLabelText(/choose file/i), {
            target: {
                files: [file],
            },
        });

        expect(global.URL.createObjectURL).toHaveBeenCalled();
    });

    test('submits form successfully', async () => {
        mockApiFetch.mockResolvedValueOnce({ id: 123 });

        render(<CreateEvent />);

        fireEvent.change(screen.getByLabelText('Event Name'), {
            target: { value: 'Concert' },
        });

        fireEvent.click(screen.getByText('Create Event'));

        await waitFor(() => {
            expect(mockApiFetch).toHaveBeenCalled();
        });

        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    test('handles submit failure', async () => {
        window.alert = vi.fn();

        mockApiFetch.mockRejectedValueOnce(new Error('Failed'));

        render(<CreateEvent />);

        fireEvent.click(screen.getByText('Create Event'));

        await waitFor(() => {
            expect(window.alert).toHaveBeenCalled();
        });
    });
});