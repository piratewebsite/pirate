import type { SiteConfig } from "@/types";
import type { CollectionEntry } from 'astro:content';
import { getEntry } from 'astro:content';

// Create an async function to get the config
export async function getSiteConfig(): Promise<SiteConfig> {
  const pwaSettings = await getEntry('pwaSettings', 'index');
  const siteSettings = await getEntry('siteSettings', 'main');
  
  if (!pwaSettings || !siteSettings) {
    throw new Error('Required content collections are missing');
  }

  // Get dynamic site URL based on environment
  const getSiteUrl = () => {
    if (pwaSettings.data.siteUrl) {
      return pwaSettings.data.siteUrl;
    }
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    if (process.env.NETLIFY_URL) {
      return process.env.NETLIFY_URL;
    }
    return 'https://pirateweb.org'; // Your actual domain
  };

  return {
    title: pwaSettings.data.title || 'PIRATE',
    description: pwaSettings.data.description || 'Thanks for being a pirate!',
    author: pwaSettings.data.name || 'PIRATE',
    siteUrl: getSiteUrl(),
    themeColor: pwaSettings.data.themeColor || '#000000',
    backgroundColor: pwaSettings.data.backgroundColor || '#000000',
    logoImage: siteSettings.data.logoImage || '/images/logo/logoImage.svg',
    showRobots: pwaSettings.data.showRobots || false,
    date: {
      locale: "en",
      options: {
        day: "numeric",
        month: "short",
        year: "numeric",
      },
    },
    lang: "en",
    ogLocale: "en",
    sortPostsByUpdatedDate: false,
  };
}

// Export a synchronous config for immediate use (with fallbacks)
export const siteConfig = {
  title: 'PIRATE',
  description: 'Thanks for being a pirate!',
  author: 'PIRATE',
  siteUrl: 'https://pirateweb.org',
  themeColor: '#000000',
  backgroundColor: '#000000',
  logoImage: '/images/logo/logoImage.svg',
  showRobots: false,
  themeMode: 'user',
  date: {
    locale: "en",
    options: {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  },
  lang: "en",
  ogLocale: "en",
  sortPostsByUpdatedDate: false,
} as const;

// Content-related types
export type Post = CollectionEntry<'posts'>;
export type Page = CollectionEntry<'pages'>;

// import { getMenuItems } from './utils/getMenuItems';

// // Used to generate links in both the Header & Footer.
// export const getMenuLinks = async () => {
// 	const menuItems = await getMenuItems();
// 	return menuItems;
// };

// // https://expressive-code.com/reference/configuration/
// // export const expressiveCodeOptions: AstroExpressiveCodeOptions = {
// // 	styleOverrides: {
// // 		borderRadius: "4px",
// // 		codeFontFamily:
// // 			'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;',
// // 		codeFontSize: "0.875rem",
// // 		codeLineHeight: "1.7142857rem",
// // 		codePaddingInline: "1rem",
// // 		frames: {
// // 			frameBoxShadowCssValue: "none",
// // 		},
// // 		uiLineHeight: "inherit",
// // 	},
// // 	themeCssSelector(theme, { styleVariants }) {
// // 		// If one dark and one light theme are available
// // 		// generate theme CSS selectors compatible with pirate-theme dark mode switch
// // 		if (styleVariants.length >= 2) {
// // 			const baseTheme = styleVariants[0]?.theme;
// // 			const altTheme = styleVariants.find((v) => v.theme.type !== baseTheme?.type)?.theme;
// // 			if (theme === baseTheme || theme === altTheme) return `[data-theme='${theme.type}']`;
// // 		}
// // 		// return default selector
// // 		return `[data-theme="${theme.name}"]`;
// // 	},
// // 	// One dark, one light theme => https://expressive-code.com/guides/themes/#available-themes
// // 	themes: ["dracula", "github-light"],
// // 	useThemedScrollbars: false,
// // };
