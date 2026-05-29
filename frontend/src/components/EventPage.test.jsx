import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import EventPage from './EventPage';

// MOCK ROUTER
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');

    return {
        ...actual,
        useParams: () => ({
            id: '123',
        }),
        useNavigate: () => vi.fn(),
    };
});

// MOCK AUTH
vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        user: {
            id: '1',
            name: 'Test User',
        },
    }),
}));

// MOCK API
vi.mock('../utils/api', () => ({
    apiFetch: vi.fn(() =>
        Promise.resolve({
            id: '123',
            title: 'Rock Concert',
            description: 'Amazing concert',
            location: 'Vilnius',
            date: '2026-05-20T18:00:00Z',

            tickets: [
                {
                    id: 'ticket1',
                    type: 'VIP',
                    quantity: 10,
                    sold: 0,
                    price: 20,
                },
            ],

            tags: [
                {
                    id: 'tag1',
                    name: 'Music',
                },
            ],
        })
    ),
}));

describe('EventPage', () => {

    test('renders event title', async () => {
        render(
            <MemoryRouter>
                <EventPage />
            </MemoryRouter>
        );

        expect(await screen.findByText('Rock Concert'))
            .toBeInTheDocument();
    });

    test('updates total price when adding ticket', async () => {
        render(
            <MemoryRouter>
                <EventPage />
            </MemoryRouter>
        );

        const plusButton = await screen.findByText('+');

        fireEvent.click(plusButton);

        expect(screen.getByText(/20.00€/))
            .toBeInTheDocument();
    });

    test('checkout button disabled initially', async () => {
        render(
            <MemoryRouter>
                <EventPage />
            </MemoryRouter>
        );

        const button = await screen.findByRole('button', {
            name: /proceed to checkout/i,
        });

        expect(button).toBeDisabled();
    });

    test('checkout button enabled after selecting ticket', async () => {
        render(
            <MemoryRouter>
                <EventPage />
            </MemoryRouter>
        );

        const plusButton = await screen.findByText('+');

        fireEvent.click(plusButton);

        const button = screen.getByRole('button', {
            name: /proceed to checkout/i,
        });

        expect(button).not.toBeDisabled();
    });
});