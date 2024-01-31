const { algoliasearch, instantsearch } = window;
const { autocomplete } = window['@algolia/autocomplete-js'];
const { createLocalStorageRecentSearchesPlugin } = window['@algolia/autocomplete-plugin-recent-searches'];
const { createQuerySuggestionsPlugin } = window['@algolia/autocomplete-plugin-query-suggestions'];

import { connectAutocomplete } from 'instantsearch.js/es/connectors'
import { breadcrumb, refinementList } from 'instantsearch.js/es/widgets';
import { stats } from 'instantsearch.js/es/widgets';
import { sortBy } from 'instantsearch.js/es/widgets';
import { ratingMenu } from 'instantsearch.js/es/widgets';
import { hitsPerPage } from 'instantsearch.js/es/widgets';

const searchClient = algoliasearch(
  'TBD',
  'TBD'
);

const search = instantsearch({
  indexName: 'dev_jbrumbaugh_takehome',
  searchClient,
  future: { preserveSharedStateOnUnmount: true },
  insights: true,
});

const virtualSearchBox = instantsearch.connectors.connectSearchBox(() => {});

search.addWidgets([
  virtualSearchBox({}),
  instantsearch.widgets.hits({
    container: '#hits',
    templates: {
      item: (hit, { html, components }) => html`
        <article>
          <img src=${hit.image} alt=${hit.name} />
          <h1>${components.Highlight({ hit, attribute: 'name' })}</h1>
        </article>
      `,
    },
  }),
  instantsearch.widgets.clearRefinements({
    container: "#clear-refinements",
  }),
  instantsearch.widgets.refinementList({
      container: "#brand-list",
      attribute: 'brand',
  }),
  instantsearch.widgets.configure({
    hitsPerPage: 10,
    maxValuesPerFacet: 10000,
  }),
  instantsearch.widgets.pagination({
    container: '#pagination',
  }),
  /* breadcrumb({
    container: '#breadcrumb',
    attributes: [
      'hierarchicalCategories.lvl0',
      'hierarchicalCategories.lvl1',
      'hierarchicalCategories.lvl2',
    ],
  }), */
  stats({
    container: '#stats',
  }),
  sortBy({
    container: '#sort-by',
    items: [
      { label: 'Featured', value: 'dev_jbrumbaugh_takehome' },
      { label: 'Customer Ranking', value: 'dev_jbrumbaugh_takehome_ranking'},
      { label: 'Price (asc)', value: 'dev_jbrumbaugh_takehome_price_asc' },
      { label: 'Price (desc)', value: 'dev_jbrumbaugh_takehome_price_desc' },
    ],
  }),
  /* 
  ratingMenu({
    container: '#rating-menu',
    attribute: 'rating',
  }), */
  hitsPerPage({
    container: '#hits-per-page',
    items: [
      { label: '10 hits per page', value: 10, default: true },
      { label: '20 hits per page', value: 20 },
      { label: '30 hits per page', value: 30 },
    ],
  }),
  refinementList({
    container: '#price-range-list',
    attribute: 'price_range',
  })  
]);

search.start();

const recentSearchesPlugin = createLocalStorageRecentSearchesPlugin({
  key: 'instantsearch',
  limit: 3,
  transformSource({ source }) {
    return {
      ...source,
      onSelect({ setIsOpen, setQuery, item, event }) {
        onSelect({ setQuery, setIsOpen, event, query: item.label });
      },
    };
  },
});

const querySuggestionsPlugin = createQuerySuggestionsPlugin({
  searchClient,
  indexName: 'instant_search_demo_query_suggestions',
  getSearchParams() {
    return recentSearchesPlugin.data.getAlgoliaSearchParams({ hitsPerPage: 6 });
  },
  transformSource({ source }) {
    return {
      ...source,
      sourceId: 'querySuggestionsPlugin',
      onSelect({ setIsOpen, setQuery, event, item }) {
        onSelect({ setQuery, setIsOpen, event, query: item.query });
      },
      getItems(params) {
        if (!params.state.query) {
          return [];
        }

        return source.getItems(params);
      },
    };
  },
});

autocomplete({
  container: '#searchbox',
  openOnFocus: true,
  detachedMediaQuery: 'none',
  onSubmit({ state }) {
    setInstantSearchUiState({ query: state.query });
  },
  plugins: [recentSearchesPlugin, querySuggestionsPlugin],
});

function setInstantSearchUiState(indexUiState) {
  search.mainIndex.setIndexUiState({ page: 1, ...indexUiState });
}

function onSelect({ setIsOpen, setQuery, event, query }) {
  if (isModifierEvent(event)) {
    return;
  }

  setQuery(query);
  setIsOpen(false);
  setInstantSearchUiState({ query });
}

function isModifierEvent(event) {
  const isMiddleClick = event.button === 1;

  return (
    isMiddleClick ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  );
}
