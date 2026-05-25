export interface BadgeStylePreset {
  width: number;
  height: number;
  borderRadius: number;
  brandWidth: number;
  gradientBrand: boolean;
  gradientScore: boolean;
  shadow: boolean;
  fontSize: { label: number; value: number; grade: number };
}

export const STYLES: Record<string, BadgeStylePreset> = {
  "flat": {
    width: 200,
    height: 22,
    borderRadius: 4,
    brandWidth: 118,
    gradientBrand: true,
    gradientScore: true,
    shadow: false,
    fontSize: { label: 10, value: 11, grade: 9 },
  },
  "plastic": {
    width: 200,
    height: 22,
    borderRadius: 4,
    brandWidth: 118,
    gradientBrand: true,
    gradientScore: true,
    shadow: true,
    fontSize: { label: 10, value: 11, grade: 9 },
  },
  "flat-square": {
    width: 200,
    height: 22,
    borderRadius: 0,
    brandWidth: 118,
    gradientBrand: false,
    gradientScore: false,
    shadow: false,
    fontSize: { label: 10, value: 11, grade: 9 },
  },
  "for-the-badge": {
    width: 240,
    height: 28,
    borderRadius: 4,
    brandWidth: 140,
    gradientBrand: true,
    gradientScore: true,
    shadow: false,
    fontSize: { label: 12, value: 13, grade: 10 },
  },
};

export const LAYOUTS: Record<string, { width: number; height: number; brandWidth: number; fontSize: { label: number; value: number; grade: number } }> = {
  "compact": { width: 160, height: 18, brandWidth: 92, fontSize: { label: 8, value: 9, grade: 7 } },
  "standard": { width: 200, height: 22, brandWidth: 118, fontSize: { label: 10, value: 11, grade: 9 } },
  "expanded": { width: 260, height: 28, brandWidth: 150, fontSize: { label: 12, value: 14, grade: 11 } },
};
