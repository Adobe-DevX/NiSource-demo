# Header

Site-wide header and primary navigation for NiSource portal pages. The block loads a nav fragment, decorates it for desktop and mobile, and wires commerce tools (auth, cart, search, wishlist) into the header chrome.

## Overview

The header block is not authored as a typical content block. It is loaded lazily on every page and builds the `<nav>` from a fragment path defined in page metadata. JavaScript adds portal-specific navigation labels and ordering, utility tools (language, notifications, account dropdown), and interactive panels for search and mini cart.

Supporting modules:

- `renderAuthDropdown.js` — account dropdown with Sign In drop-in and authenticated menu
- `renderAuthCombine.js` — mobile nav sign-in modal via AuthCombine drop-in

## Configuration

### Page metadata

| Metadata key | Default | Description |
| --- | --- | --- |
| `nav` | `/nav` | Path to the navigation fragment |
| `wishlist` | `/wishlist` | Wishlist destination when the wishlist button is clicked |
| `mini-cart` | `/mini-cart` | Fragment loaded into the mini cart panel |

### Nav fragment structure

The nav fragment is expected to contain three sections in order:

1. **Brand** (`.nav-brand`) — logo/home link
2. **Sections** (`.nav-sections`) — primary navigation list
3. **Tools** (`.nav-tools`) — container for injected header tools

Authors can include nav items such as Account, Billing, Services, Usage, Ways To Save, Outages, and Contact Us. The block renames and reorders items for the NiSource portal layout.

## Integration

### Cookies

| Cookie | Used by | Purpose |
| --- | --- | --- |
| `auth_dropin_user_token` | Auth dropdown | Detect authenticated session |
| `auth_dropin_firstname` | Auth dropdown, AuthCombine | Display user name in header controls |

### Events

| Event | Source | Behavior |
| --- | --- | --- |
| `authenticated` | `@dropins/tools/event-bus` | Toggles auth dropdown UI between Sign In form and account menu |
| `cart/data` | `@dropins/tools/event-bus` | Updates cart badge count; preloads mini cart fragment when cart data exists |

### URL / path behavior

- Mini cart button is hidden on `/checkout`.
- Logout from the auth dropdown redirects `/customer` paths to login and `/order-details` to home.
- Search submits to `/search?q=…` via `rootLink()`.

## Behavior patterns

### Portal navigation

- Ensures a **Home** link exists at the start of the primary nav.
- Renames authored labels (for example, "My Account" → "Account", "Bills & Payments" → "Billing").
- Moves utility links (Ways To Save, Outages, Contact Us) into `.portal-utility-nav`.
- Orders primary items: Home, Account, Billing, Services, Usage.

### Portal tools

- Injects a language selector button (placeholder, label "English") and a notifications button with badge count.
- Hides commerce search and wishlist controls in the portal header layout.

### Desktop (≥ 900px)

- Hover opens nav dropdown sections with a page overlay.
- Escape and focus loss collapse expanded sections.
- Nav tools panels (search, mini cart, auth) toggle independently; outside clicks close them.

### Mobile (< 900px)

- Hamburger toggles full-height nav drawer with overlay.
- Nested nav sections expand on tap; submenu back link returns to top level.
- AuthCombine modal opens from the Account nav item when the user is not signed in.

### Auth dropdown

- **Signed out:** shows Sign In drop-in in the dropdown panel; button label falls back to "John Doe" when no name cookie is present.
- **Signed in:** shows "My Account" and Logout links; button displays the user's first name.

## Error handling

- Missing nav metadata falls back to `/nav`.
- Portal navigation decoration is idempotent (skips if `.portal-utility-nav` already exists).
- Portal tools injection is idempotent (skips if `.portal-language-button` already exists).
- Panel loaders use `withLoadingState()` to avoid duplicate loads and queue toggle actions while loading.
- AuthCombine skips nav injection when `auth_dropin_firstname` is already set.
