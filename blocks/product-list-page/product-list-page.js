// Product Discovery Dropins
import SearchResults from '@dropins/storefront-product-discovery/containers/SearchResults.js';
import SortBy from '@dropins/storefront-product-discovery/containers/SortBy.js';
import Pagination from '@dropins/storefront-product-discovery/containers/Pagination.js';
import { render as provider } from '@dropins/storefront-product-discovery/render.js';
import { Button, Icon, provider as UI } from '@dropins/tools/components.js';
import { search } from '@dropins/storefront-product-discovery/api.js';
// Wishlist Dropin
import { WishlistToggle } from '@dropins/storefront-wishlist/containers/WishlistToggle.js';
import { render as wishlistRender } from '@dropins/storefront-wishlist/render.js';
// Cart Dropin
import * as cartApi from '@dropins/storefront-cart/api.js';
import { tryRenderAemAssetsImage } from '@dropins/tools/lib/aem/assets.js';
// Event Bus
import { events } from '@dropins/tools/event-bus.js';
// AEM
import { readBlockConfig } from '../../scripts/aem.js';
import { fetchPlaceholders, getProductLink } from '../../scripts/commerce.js';

// Initializers
import '../../scripts/initializers/search.js';
import '../../scripts/initializers/wishlist.js';

/**
 * @param {{ value?: number, currency?: string } | undefined} amount
 * @returns {string}
 */
function formatSearchPriceAmount(amount) {
  if (amount == null || amount.value == null || !amount.currency) return '';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: amount.currency,
  }).format(amount.value);
}

/**
 * Regular + final amounts from product discovery search payload.
 * @param {{ typename?: string, price?: object, priceRange?: object }} product
 * @returns {{ final?: { value: number, currency: string },
 *   regular?: { value: number, currency: string } }}
 */
function getSearchProductPriceAmounts(product) {
  if (product.typename === 'ComplexProductView' && product.priceRange?.minimum) {
    const min = product.priceRange.minimum;
    return {
      final: min.final?.amount,
      regular: min.regular?.amount,
    };
  }
  if (product.price?.final?.amount) {
    return {
      final: product.price.final.amount,
      regular: product.price.regular?.amount,
    };
  }
  return { final: undefined, regular: undefined };
}

/**
 * @param {{ replaceWith: (el: Element) => void, product: object }} ctx
 */
function renderProductCardPrice(ctx) {
  const wrap = document.createElement('div');
  wrap.className = 'product-list-page__card-price';

  const { final, regular } = getSearchProductPriceAmounts(ctx.product);
  const finalStr = formatSearchPriceAmount(final);
  if (!finalStr) {
    ctx.replaceWith(wrap);
    return;
  }

  const regStr = formatSearchPriceAmount(regular);
  const hasDiscount = Boolean(
    regular
    && final
    && regular.currency === final.currency
    && Number(regular.value) > Number(final.value),
  );

  if (hasDiscount && regStr) {
    const del = document.createElement('del');
    del.className = 'product-list-page__card-price-regular';
    del.textContent = regStr;

    const sale = document.createElement('span');
    sale.className = 'product-list-page__card-price-final';
    sale.textContent = finalStr;

    wrap.append(del, document.createTextNode('\u00a0'), sale);
    wrap.setAttribute(
      'aria-label',
      `Sale price ${finalStr}, regular price ${regStr}`,
    );
  } else {
    wrap.textContent = finalStr;
    wrap.classList.add('product-list-page__card-price--single');
  }

  ctx.replaceWith(wrap);
}

export default async function decorate(block) {
  const labels = await fetchPlaceholders();

  const config = readBlockConfig(block);

  const fragment = document.createRange().createContextualFragment(`
    <div class="search__wrapper">
      <div class="search__product-sort"></div>
      <div class="search__product-list"></div>
      <div class="search__pagination"></div>
    </div>
  `);

  const $productSort = fragment.querySelector('.search__product-sort');
  const $productList = fragment.querySelector('.search__product-list');
  const $pagination = fragment.querySelector('.search__pagination');

  block.innerHTML = '';
  block.appendChild(fragment);

  // Add category url path to block for enrichment
  if (config.urlpath) {
    block.dataset.category = config.urlpath;
  }

  // Get variables from the URL
  const urlParams = new URLSearchParams(window.location.search);
  // get all params
  const {
    q,
    page,
    sort,
    filter,
  } = Object.fromEntries(urlParams.entries());

  // Request search based on the page type on block load
  if (config.urlpath) {
    // If it's a category page...
    await search({
      phrase: '', // search all products in the category
      currentPage: page ? Number(page) : 1,
      pageSize: 8,
      sort: sort ? getSortFromParams(sort) : [{ attribute: 'position', direction: 'DESC' }],
      filter: [
        { attribute: 'categoryPath', eq: config.urlpath }, // Add category filter
        ...getFilterFromParams(filter),
      ],
    }).catch(() => {
      console.error('Error searching for products');
    });
  } else {
    // If it's a search page...
    await search({
      phrase: q || '',
      currentPage: page ? Number(page) : 1,
      pageSize: 8,
      sort: getSortFromParams(sort),
      filter: getFilterFromParams(filter),
    }).catch(() => {
      console.error('Error searching for products');
    });
  }

  const getAddToCartButton = (product) => {
    if (product.typename === 'ComplexProductView') {
      const button = document.createElement('div');
      UI.render(Button, {
        children: labels.Global?.AddProductToCart,
        icon: Icon({ source: 'Cart' }),
        href: getProductLink(product.urlKey, product.sku),
        variant: 'primary',
      })(button);
      return button;
    }
    const button = document.createElement('div');
    UI.render(Button, {
      children: labels.Global?.AddProductToCart,
      icon: Icon({ source: 'Cart' }),
      onClick: () => cartApi.addProductsToCart([{ sku: product.sku, quantity: 1 }]),
      variant: 'primary',
    })(button);
    return button;
  };

  await Promise.all([
    // Sort By
    provider.render(SortBy, {})($productSort),

    // Pagination
    provider.render(Pagination, {
      onPageChange: () => {
        // scroll to the top of the page
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    })($pagination),

    // Product List
    provider.render(SearchResults, {
      routeProduct: (product) => getProductLink(product.urlKey, product.sku),
      slots: {
        ProductImage: (ctx) => {
          const { product, defaultImageProps } = ctx;
          const anchorWrapper = document.createElement('a');
          anchorWrapper.href = getProductLink(product.urlKey, product.sku);

          tryRenderAemAssetsImage(ctx, {
            alias: product.sku,
            imageProps: defaultImageProps,
            wrapper: anchorWrapper,
            params: {
              width: defaultImageProps.width,
              height: defaultImageProps.height,
            },
          });
        },
        ProductPrice: (ctx) => {
          renderProductCardPrice(ctx);
        },
        ProductActions: (ctx) => {
          const actionsWrapper = document.createElement('div');
          actionsWrapper.className = 'product-discovery-product-actions';
          // Add to Cart Button
          const addToCartBtn = getAddToCartButton(ctx.product);
          addToCartBtn.className = 'product-discovery-product-actions__add-to-cart';
          // Wishlist Button
          const $wishlistToggle = document.createElement('div');
          $wishlistToggle.classList.add('product-discovery-product-actions__wishlist-toggle');
          wishlistRender.render(WishlistToggle, {
            product: ctx.product,
            variant: 'tertiary',
          })($wishlistToggle);
          actionsWrapper.appendChild(addToCartBtn);
          actionsWrapper.appendChild($wishlistToggle);
          ctx.replaceWith(actionsWrapper);
        },
      },
    })($productList),
  ]);

  // Listen for search results (event is fired before the block is rendered; eager: true)
  events.on('search/result', (payload) => {
    const totalCount = payload.result?.totalCount || 0;

    block.classList.toggle('product-list-page--empty', totalCount === 0);
  }, { eager: true });

  // Listen for search results (event is fired after the block is rendered; eager: false)
  events.on('search/result', (payload) => {
    // update URL with new search params
    const url = new URL(window.location.href);

    if (payload.request?.phrase) {
      url.searchParams.set('q', payload.request.phrase);
    }

    if (payload.request?.currentPage) {
      url.searchParams.set('page', payload.request.currentPage);
    }

    if (payload.request?.sort) {
      url.searchParams.set('sort', getParamsFromSort(payload.request.sort));
    }

    if (payload.request?.filter) {
      url.searchParams.set('filter', getParamsFromFilter(payload.request.filter));
    }

    // Update the URL
    window.history.pushState({}, '', url.toString());
  }, { eager: false });
}

function getSortFromParams(sortParam) {
  if (!sortParam) return [];
  return sortParam.split(',').map((item) => {
    const [attribute, direction] = item.split('_');
    return { attribute, direction };
  });
}

function getParamsFromSort(sort) {
  return sort.map((item) => `${item.attribute}_${item.direction}`).join(',');
}

function getFilterFromParams(filterParam) {
  if (!filterParam) return [];

  // Decode the URL-encoded parameter
  const decodedParam = decodeURIComponent(filterParam);
  const results = [];
  const filters = decodedParam.split('|');

  filters.forEach((filter) => {
    if (filter.includes(':')) {
      const [attribute, value] = filter.split(':');

      if (value.includes(',')) {
        // Handle array values (like categories)
        results.push({
          attribute,
          in: value.split(','),
        });
      } else if (value.includes('-')) {
        // Handle range values (like price)
        const [from, to] = value.split('-');
        results.push({
          attribute,
          range: {
            from: Number(from),
            to: Number(to),
          },
        });
      } else {
        // Handle single values (like categories with one value)
        results.push({
          attribute,
          in: [value],
        });
      }
    }
  });

  return results;
}

function getParamsFromFilter(filter) {
  if (!filter || filter.length === 0) return '';

  return filter.map(({ attribute, in: inValues, range }) => {
    if (inValues) {
      return `${attribute}:${inValues.join(',')}`;
    }

    if (range) {
      return `${attribute}:${range.from}-${range.to}`;
    }

    return null;
  }).filter(Boolean).join('|');
}
