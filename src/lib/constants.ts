import type { ColorKey } from './types';

export const WAREHOUSES = ['Ilcom', 'Gandalf PG', 'Gandalf SKA', 'Ogrodnik'] as const;
export type WarehouseName = typeof WAREHOUSES[number];

export const COLOR_PALETTE: Record<ColorKey, { name: string; border: string; bg: string; dot: string }> = {
  red: { name: 'Czerwony', border: 'border-l-red-500', bg: 'bg-red-50', dot: 'bg-red-500' },
  orange: { name: 'Pomarańczowy', border: 'border-l-orange-500', bg: 'bg-orange-50', dot: 'bg-orange-500' },
  yellow: { name: 'Żółty', border: 'border-l-yellow-400', bg: 'bg-yellow-50', dot: 'bg-yellow-400' },
  green: { name: 'Zielony', border: 'border-l-green-500', bg: 'bg-green-50', dot: 'bg-green-500' },
  blue: { name: 'Niebieski', border: 'border-l-blue-500', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  purple: { name: 'Fioletowy', border: 'border-l-purple-500', bg: 'bg-purple-50', dot: 'bg-purple-500' },
  pink: { name: 'Różowy', border: 'border-l-pink-500', bg: 'bg-pink-50', dot: 'bg-pink-500' },
  cyan: { name: 'Turkusowy', border: 'border-l-cyan-400', bg: 'bg-cyan-50', dot: 'bg-cyan-400' },
  gray: { name: 'Szary', border: 'border-l-slate-500', bg: 'bg-slate-50', dot: 'bg-slate-500' },
  brown: { name: 'Brązowy', border: 'border-l-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-700' },
};