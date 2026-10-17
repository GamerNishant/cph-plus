import React, { useEffect, useState } from 'react';
import {
    DEFAULT_FONT_FAMILY,
    DEFAULT_FONT_SIZE,
    FONT_CHOICES,
    MAX_FONT_SIZE,
    MIN_FONT_SIZE,
    clampFontSize,
} from '../../fonts';
import { WebviewToVSEvent } from '../../types';

declare const vscodeApi: {
    postMessage: (message: WebviewToVSEvent) => void;
};

type FontState = { fontSize: number; fontFamily: string };

declare const window: Window & {
    cphFontSize?: number;
    cphFontFamily?: string;
};

/*
 * Font state lives at module level, not in a component, because the judge
 * view remounts whenever the active file changes. Keeping it here means a
 * remount always sees the latest value instead of the one from page load.
 */
let current: FontState = {
    fontSize: clampFontSize(window.cphFontSize || DEFAULT_FONT_SIZE),
    fontFamily: window.cphFontFamily || DEFAULT_FONT_FAMILY,
};
const listeners = new Set<(font: FontState) => void>();

const applyFont = (font: FontState) => {
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty('--cph-font-size', `${font.fontSize}px`);
    rootStyle.setProperty('--cph-font-family', font.fontFamily);
};

const setCurrent = (font: FontState) => {
    current = font;
    applyFont(font);
    listeners.forEach((l) => l(font));
};

applyFont(current);

window.addEventListener('message', (event: MessageEvent) => {
    const data = event.data;
    if (data?.command === 'update-font') {
        setCurrent({
            fontSize: clampFontSize(data.fontSize),
            fontFamily: data.fontFamily || DEFAULT_FONT_FAMILY,
        });
    }
});

const useFont = (): FontState => {
    const [font, setFont] = useState<FontState>(current);
    useEffect(() => {
        listeners.add(setFont);
        setFont(current);
        return () => {
            listeners.delete(setFont);
        };
    }, []);
    return font;
};

const changeFont = (font: Partial<FontState>) => {
    const next = {
        fontSize: clampFontSize(font.fontSize ?? current.fontSize),
        fontFamily: font.fontFamily ?? current.fontFamily,
    };
    setCurrent(next);
    vscodeApi.postMessage({ command: 'set-font', ...next });
};

const CUSTOM = '__custom__';

export const FontToolbar: React.FC = () => {
    const { fontSize, fontFamily } = useFont();
    const isKnownFont = FONT_CHOICES.some((f) => f.value === fontFamily);
    const isDefault =
        fontSize === DEFAULT_FONT_SIZE && fontFamily === DEFAULT_FONT_FAMILY;

    return (
        <div className="font-toolbar" role="group" aria-label="Text appearance">
            <div className="font-toolbar-group">
                <span className="font-toolbar-label">
                    <i className="codicon codicon-text-size"></i> Size
                </span>
                <button
                    className="font-btn"
                    title="Smaller text"
                    aria-label="Decrease font size"
                    disabled={fontSize <= MIN_FONT_SIZE}
                    onClick={() => changeFont({ fontSize: fontSize - 1 })}
                >
                    <i className="codicon codicon-remove"></i>
                </button>
                <button
                    className="font-size-value"
                    title="Type an exact size"
                    onClick={() =>
                        vscodeApi.postMessage({
                            command: 'run-command',
                            id: 'cph.chooseFontSize',
                        })
                    }
                >
                    {fontSize}
                </button>
                <button
                    className="font-btn"
                    title="Larger text"
                    aria-label="Increase font size"
                    disabled={fontSize >= MAX_FONT_SIZE}
                    onClick={() => changeFont({ fontSize: fontSize + 1 })}
                >
                    <i className="codicon codicon-add"></i>
                </button>
            </div>
            <div className="font-toolbar-group font-toolbar-grow">
                <span className="font-toolbar-label">Font</span>
                <select
                    className="font-select"
                    aria-label="Font"
                    value={isKnownFont ? fontFamily : CUSTOM}
                    onChange={(e) => {
                        if (e.target.value === CUSTOM) {
                            vscodeApi.postMessage({
                                command: 'run-command',
                                id: 'cph.chooseFont',
                            });
                        } else {
                            changeFont({ fontFamily: e.target.value });
                        }
                    }}
                >
                    {FONT_CHOICES.map((f) => (
                        <option
                            key={f.value}
                            value={f.value}
                            style={{ fontFamily: f.value }}
                        >
                            {f.label}
                        </option>
                    ))}
                    <option value={CUSTOM}>
                        {isKnownFont ? 'Custom font…' : `Custom: ${fontFamily}`}
                    </option>
                </select>
                <button
                    className="font-btn"
                    title="Reset to Consolas, 13"
                    aria-label="Reset font"
                    disabled={isDefault}
                    onClick={() =>
                        changeFont({
                            fontSize: DEFAULT_FONT_SIZE,
                            fontFamily: DEFAULT_FONT_FAMILY,
                        })
                    }
                >
                    <i className="codicon codicon-discard"></i>
                </button>
            </div>
        </div>
    );
};
