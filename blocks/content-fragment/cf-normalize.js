/**
 * Map persisted-query `item` to banner fields.
 * Primary: `SampleFragmentByPath` (`headline`, `paragraph.plaintext`).
 * Also supports legacy CTA banner (`title`, `subtitle`, `description`, `bannerimage`, `ctaurl`).
 * @param {object|undefined|null} item
 * @returns {{
 *   variant: 'sample' | 'legacy',
 *   title: string,
 *   subtitle: string,
 *   descriptionPlain: string,
 *   bannerimage: object|undefined,
 *   cta: string|object|undefined,
 *   ctalabel: string,
 * }}
 */
export function normalizeCfBannerItem(item) {
  if (!item || typeof item !== 'object') {
    return {
      variant: 'legacy',
      title: '',
      subtitle: '',
      descriptionPlain: '',
      bannerimage: undefined,
      cta: undefined,
      ctalabel: '',
    };
  }

  const isSample = 'headline' in item || 'paragraph' in item;
  if (isSample) {
    const para = item.paragraph;
    const paragraphPlain = typeof para === 'string'
      ? para
      : (para && typeof para === 'object' ? (para.plaintext ?? '') : '');
    return {
      variant: 'sample',
      title: item.headline ?? item.title ?? '',
      subtitle: item.subtitle ?? '',
      descriptionPlain: paragraphPlain || item.description?.plaintext || '',
      bannerimage: item.bannerimage,
      cta: item.ctaurl,
      ctalabel: item.ctalabel ?? '',
    };
  }

  return {
    variant: 'legacy',
    title: item.title ?? '',
    subtitle: item.subtitle ?? '',
    descriptionPlain: item.description?.plaintext ?? '',
    bannerimage: item.bannerimage,
    cta: item.ctaurl,
    ctalabel: item.ctalabel ?? '',
  };
}
