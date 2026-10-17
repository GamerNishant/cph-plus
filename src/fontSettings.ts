import * as vscode from 'vscode';
import {
    DEFAULT_FONT_SIZE,
    DEFAULT_FONT_FAMILY,
    FONT_CHOICES,
    clampFontSize,
    fontLabel,
} from './fonts';
import { getFontSizePref, getFontFamilyPref } from './preferences';

export type FontState = { fontSize: number; fontFamily: string };

export const getFont = (): FontState => ({
    fontSize: getFontSizePref(),
    fontFamily: getFontFamilyPref(),
});

// Writes are chained so rapid clicks apply in order, and while one is in
// flight the config-change echo is suppressed (the webview already shows the
// new value; echoing an intermediate value would make it jump back).
let writeChain: Promise<void> = Promise.resolve();
let pendingWrites = 0;
let fontChangeListener: (font: FontState) => void = () => undefined;

/** Called with the saved font whenever it changes (from any source). */
export const setFontChangeListener = (fn: (font: FontState) => void) => {
    fontChangeListener = fn;
};

/** Notify the listener about a change made outside setFont (settings UI, settings.json). */
export const handleConfigurationChange = () => {
    if (pendingWrites === 0) {
        fontChangeListener(getFont());
    }
};

/**
 * Persist the font to User settings. The settings are application-scoped, so
 * the same value applies to every window, workspace and file.
 */
export const setFont = (font: Partial<FontState>): Promise<void> => {
    pendingWrites++;
    writeChain = writeChain
        .then(async () => {
            const config = vscode.workspace.getConfiguration('cph');
            const current = getFont();
            if (
                font.fontSize !== undefined &&
                clampFontSize(font.fontSize) !== current.fontSize
            ) {
                await config.update(
                    'appearance.fontSize',
                    clampFontSize(font.fontSize),
                    vscode.ConfigurationTarget.Global,
                );
            }
            if (
                font.fontFamily !== undefined &&
                font.fontFamily.trim() !== current.fontFamily
            ) {
                await config.update(
                    'appearance.fontFamily',
                    font.fontFamily.trim(),
                    vscode.ConfigurationTarget.Global,
                );
            }
        })
        .catch((err) => {
            globalThis.logger.error('Failed to save font settings', err);
            vscode.window.showErrorMessage(
                `CPH Plus: could not save font settings: ${
                    err?.message ?? err
                }`,
            );
        })
        .finally(() => {
            pendingWrites--;
            if (pendingWrites === 0) {
                fontChangeListener(getFont());
            }
        });
    return writeChain;
};

const showFontStatus = () => {
    const { fontSize, fontFamily } = getFont();
    vscode.window.setStatusBarMessage(
        `CPH Plus: ${fontLabel(fontFamily)}, ${fontSize}px`,
        2500,
    );
};

const chooseFont = async () => {
    const current = getFontFamilyPref();
    const items: (vscode.QuickPickItem & { value?: string })[] = [
        ...FONT_CHOICES.map((f) => ({
            label: f.label,
            description: f.value === current ? '(current)' : undefined,
            detail: f.value,
            value: f.value,
        })),
        {
            label: '$(edit) Custom font…',
            detail: 'Type any installed font name',
        },
    ];
    const picked = await vscode.window.showQuickPick(items, {
        title: 'CPH Plus: Test Case Font',
        placeHolder: `Current: ${fontLabel(current)}`,
        matchOnDetail: true,
    });
    if (!picked) {
        return;
    }
    let value = picked.value;
    if (value === undefined) {
        value = await vscode.window.showInputBox({
            title: 'CPH Plus: Custom Font',
            prompt: 'Font name, or a CSS font-family list (e.g. "Hack", monospace)',
            value: current,
        });
        if (!value?.trim()) {
            return;
        }
    }
    await setFont({ fontFamily: value });
    showFontStatus();
};

const chooseFontSize = async () => {
    const value = await vscode.window.showInputBox({
        title: 'CPH Plus: Test Case Font Size',
        prompt: 'Font size in pixels (8 to 40)',
        value: String(getFontSizePref()),
        validateInput: (text) => {
            const n = Number(text);
            return Number.isFinite(n) && n >= 8 && n <= 40
                ? undefined
                : 'Enter a number from 8 to 40';
        },
    });
    if (value === undefined) {
        return;
    }
    await setFont({ fontSize: Number(value) });
    showFontStatus();
};

export const openCphSettings = () =>
    vscode.commands.executeCommand(
        'workbench.action.openSettings',
        `@ext:${globalThis.context.extension.id}`,
    );

export const registerFontCommands = (context: vscode.ExtensionContext) => {
    const register = (id: string, fn: () => unknown) =>
        context.subscriptions.push(vscode.commands.registerCommand(id, fn));

    register('cph.openSettings', openCphSettings);
    register('cph.increaseFontSize', async () => {
        await setFont({ fontSize: getFontSizePref() + 1 });
        showFontStatus();
    });
    register('cph.decreaseFontSize', async () => {
        await setFont({ fontSize: getFontSizePref() - 1 });
        showFontStatus();
    });
    register('cph.resetFont', async () => {
        await setFont({
            fontSize: DEFAULT_FONT_SIZE,
            fontFamily: DEFAULT_FONT_FAMILY,
        });
        showFontStatus();
    });
    register('cph.chooseFont', chooseFont);
    register('cph.chooseFontSize', chooseFontSize);
};
