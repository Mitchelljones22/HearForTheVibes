export const APP_NAME = 'Subscription Tracker';

// When true (and src/mocks/ exists locally), the api/ modules return mock data
// instead of calling the backend. Set VITE_USE_MOCKS=true in
// frontend/.env.development.local, which is git-ignored, to turn it on.
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';
