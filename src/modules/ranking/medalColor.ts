import { colors } from '../../configs/colors';

export function medalColor(position: number): string | null {
  if (position === 1) return colors.gold.main;
  if (position === 2) return colors.medal.silver;
  if (position === 3) return colors.medal.bronze;
  return null;
}
