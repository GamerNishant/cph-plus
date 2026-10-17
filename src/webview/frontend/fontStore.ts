import {
    DEFAULT_FONT_FAMILY,
    DEFAULT_FONT_SIZE,
    clampFontSize,
} from '../../fonts';

/*
 * Applies the cph.appearance.* settings to the test case boxes. The values
 * come from the page's initial state and from 'update-font' messages sent
 * when the settings change. There are no in-panel controls; fonts are
 * changed in Settings or with the CPH Plus commands.
 */

declare const window: Window & {
    cphFontSize?: number;
    cphFontFamily?: string;
};

const applyFont = (fontSize: number, fontFamily: string) => {
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty('--cph-font-size', `${clampFontSize(fontSize)}px`);
    rootStyle.setProperty(
        '--cph-font-family',
        fontFamily || DEFAULT_FONT_FAMILY,
    );
};

applyFont(
    window.cphFontSize || DEFAULT_FONT_SIZE,
    window.cphFontFamily || DEFAULT_FONT_FAMILY,
);

window.addEventListener('message', (event: MessageEvent) => {
    const data = event.data;
    if (data?.command === 'update-font') {
        applyFont(data.fontSize, data.fontFamily);
    }
});
