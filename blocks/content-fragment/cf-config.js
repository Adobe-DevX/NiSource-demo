/**
 * NiSource Content Fragment — persisted GraphQL defaults.
 *
 * Override: `placeholders.json` beats page `<meta>`, then `cf-config.js` defaults.
 *
 * Author GET: `{authorOrigin}{graphqlPath};path=…;variation=…;ts=…`
 */

/** AEM author origin for persisted-query GET (no trailing slash). */
export const CF_DEFAULT_AUTHOR_ORIGIN = 'https://author-p199216-e2062199.adobeaemcloud.com';

/** Path after origin: `/graphql/execute.json/{endpoint}/{PersistedQueryName}` */
export const CF_DEFAULT_GRAPHQL_PATH = '/graphql/execute.json/nisource-demo/SampleFragmentByPath';

/** `data.<key>.item` for `SampleFragmentByPath { sampleFragmentByPath { item { … } } }`. */
export const CF_DEFAULT_GRAPHQL_ITEM_KEY = 'sampleFragmentByPath';
