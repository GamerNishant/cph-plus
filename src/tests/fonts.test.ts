import {
    clampFontSize,
    fontLabel,
    DEFAULT_FONT_SIZE,
    DEFAULT_FONT_FAMILY,
    MIN_FONT_SIZE,
    MAX_FONT_SIZE,
} from '../fonts';

describe('clampFontSize', () => {
    test('keeps sizes inside the range', () => {
        expect(clampFontSize(16)).toBe(16);
    });

    test('clamps to min and max', () => {
        expect(clampFontSize(2)).toBe(MIN_FONT_SIZE);
        expect(clampFontSize(400)).toBe(MAX_FONT_SIZE);
    });

    test('falls back to the default for invalid values', () => {
        expect(clampFontSize(NaN)).toBe(DEFAULT_FONT_SIZE);
        expect(clampFontSize(0)).toBe(DEFAULT_FONT_SIZE);
        expect(clampFontSize(-5)).toBe(DEFAULT_FONT_SIZE);
    });

    test('rounds fractional sizes', () => {
        expect(clampFontSize(14.6)).toBe(15);
    });
});

describe('fontLabel', () => {
    test('uses the label of a known font', () => {
        expect(fontLabel(DEFAULT_FONT_FAMILY)).toBe('Consolas (default)');
    });

    test('uses the first family of a custom list, without quotes', () => {
        expect(fontLabel("'Hack', monospace")).toBe('Hack');
        expect(fontLabel('Iosevka')).toBe('Iosevka');
    });
});
