import {isSameDomain} from './extractPageVariables';

const GOOGLE_FONTS_URL = 'https://fonts.googleapis.com';

// Because of a security mechanism in browsers, it's not possible to directly access the rules on a stylesheet of
// another domain. This is only a minor nuisance because it's dead simple to fetch the sheet, add its contents to a new
// style node and read that one. It's even returned from browser cache, so pretty fast actually.
const getGoogleSheetRules = async href => {
  const id = href.replace(/[^\w]/g, '');
  const inDom = document.querySelector('style#' + id);

  if (inDom) {
    return inDom.sheet.rules;
  }
  let css;
  try {
    const response = await fetch(href);
    css = await response.text();
  } catch (e) {
    // Proceed with an empty style element, so it doesn't get retried over and over.
    css = '';
    console.info(`Failed fetching sheet ${href}`);
  }

  const style = document.createElement('style');
  style.id = id;
  style.innerText = css;
  style.disabled = true;
  document.head.appendChild(style);

  return style.sheet.cssRules;
};

const collectFontVariant = (
  fonts,
  { style: { fontFamily, fontWeight, fontStyle } }
) => {
  const variants = fonts[fontFamily]?.variants || {};

  variants[`${fontWeight || 'normal'}|${fontStyle || 'normal'}`] = {
    fontWeight: fontWeight || 'normal',
    fontStyle: fontStyle || 'normal',
  };

  fonts[fontFamily] = {
    fontFamily,
    variants,
  };

  return fonts;
};

const extractFonts = async (fonts, sheet) => {
  const rules = sheet.href?.startsWith(GOOGLE_FONTS_URL) ? await getGoogleSheetRules(sheet.href) : sheet.rules;

  const fontFaces = [...rules].filter(rule => rule instanceof CSSFontFaceRule);

  return fontFaces.reduce(collectFontVariant, fonts);
};
const ourDomainOrGoogleFonts = sheet => isSameDomain(sheet) || sheet.href.startsWith(GOOGLE_FONTS_URL);

export const getAllDefinedFonts = async () => {
  // const styleElements = [...document.querySelectorAll('style')].map(el=>el.sheet);
  //
  // const inStyleElements = styleElements.reduce(extractFonts, {});

  const sheets = [...document.styleSheets].filter(ourDomainOrGoogleFonts);
  return Object.values(await sheets.reduce(extractFonts, {}));
};
