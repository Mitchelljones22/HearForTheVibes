import type { SubscriptionCategory } from '../types/subscription';

// Display name and chart color for each category. Colors are fixed per category
// (not by rank), so a category keeps its color as numbers change. The set was
// checked for color-blind separation; every bar also has its name written beside it.
export const categories: Record<SubscriptionCategory, { label: string; color: string }> = {
  developer: { label: 'Developer Tools', color: '#2a78d6' },
  design: { label: 'Design', color: '#eb6834' },
  cloud: { label: 'Cloud & Hosting', color: '#1baf7a' },
  productivity: { label: 'Productivity', color: '#eda100' },
  entertainment: { label: 'Entertainment', color: '#e87ba4' },
  communication: { label: 'Communication', color: '#6250d6' },
};
