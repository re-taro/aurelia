/* eslint-disable ts/no-inferrable-types */
/* eslint-disable prefer-named-capture-group */

export const LINARIA_MODULE_EXTENSION = '.linaria.module';
export const LINARIA_GLOBAL_EXTENSION = '.linaria.global';

export const regexLinariaCSS: RegExp = /\.linaria\.(module|global)\.css$/u;
export const regexIsLinariaGlobalCSSQuery: RegExp = /\.linaria\.global\.css\?/u;
export const regexLinariaCSSQuery: RegExp = /\.linaria\.(module|global)\.css\?/u;

// Pattern to quickly check if file potentially contains Linaria syntax
export const regexLinariaSyntaxPattern: RegExp = /(styled[.(]|css`)/u;
