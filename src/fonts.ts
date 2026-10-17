/**
 * Font options shared by the extension host and the judge webview. Must stay
 * free of `vscode` imports since the webview bundle imports it too.
 */

export const DEFAULT_FONT_SIZE = 13;
export const MIN_FONT_SIZE = 8;
export const MAX_FONT_SIZE = 40;
export const DEFAULT_FONT_FAMILY = "Consolas, 'Ubuntu Mono', monospace";

export type FontChoice = { label: string; value: string };

export const FONT_CHOICES: FontChoice[] = [
    { label: 'Consolas (default)', value: DEFAULT_FONT_FAMILY },
    {
        label: 'Same as editor',
        value: 'var(--vscode-editor-font-family), monospace',
    },
    { label: 'Cascadia Code', value: "'Cascadia Code', Consolas, monospace" },
    { label: 'Cascadia Mono', value: "'Cascadia Mono', Consolas, monospace" },
    { label: 'Fira Code', value: "'Fira Code', Consolas, monospace" },
    {
        label: 'JetBrains Mono',
        value: "'JetBrains Mono', Consolas, monospace",
    },
    { label: 'Source Code Pro', value: "'Source Code Pro', monospace" },
    { label: 'Courier New', value: "'Courier New', monospace" },
    { label: 'Lucida Console', value: "'Lucida Console', monospace" },
    { label: 'Menlo', value: 'Menlo, Monaco, monospace' },
    { label: 'Ubuntu Mono', value: "'Ubuntu Mono', monospace" },
    {
        label: 'Same as VS Code UI',
        value: 'var(--vscode-font-family), sans-serif',
    },
];

export const clampFontSize = (size: number): number => {
    if (!Number.isFinite(size) || size <= 0) {
        return DEFAULT_FONT_SIZE;
    }
    return Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, Math.round(size)));
};

/** Human readable name of a font-family value, for labels. */
export const fontLabel = (family: string): string => {
    const known = FONT_CHOICES.find((f) => f.value === family);
    if (known) {
        return known.label;
    }
    const first = family
        .split(',')[0]
        .trim()
        .replace(/^['"]|['"]$/g, '');
    return first || family;
};
