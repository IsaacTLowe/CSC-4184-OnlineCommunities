# Online Communities: GameFinder

A game recommendation web app built with React and Vite, with a small Express backend. Users log in with a username and password, import their Steam games, and manually add Xbox and PlayStation games to a shared library. Steam imports also personalize recommendations. The contact form only shows a confirmation message.

## Requirements

- [Node.js](https://nodejs.org/) 20.19 or newer

## Setup

```bash
npm install
```

## Run locally

```bash
npm run dev
```

Then open the URL shown in the terminal (usually http://localhost:5173).

## Run the backend (accounts and libraries)

Login, saved libraries, Steam imports, and console catalog browsing need the small Express server in `server/`.

1. Copy `.env.example` to `.env`.
2. Set `STEAM_API_KEY` using a [Steam Web API key](https://steamcommunity.com/dev/apikey) to enable Steam imports.
3. Set `RAWG_API_KEY` using a [RAWG API key](https://rawg.io/apidocs) to enable the full Xbox and PlayStation catalogs. This key stays on the backend. No Xbox or PlayStation account credentials are needed.
4. In a second terminal, run:

```bash
npm run server
```

The Vite dev server forwards every `/api` request to it (port 3001). Restart the backend after changing `.env`. Accounts and their libraries are saved to `server/data/users.json`, which is git-ignored. Each provider key is independent: console libraries do not require connecting Steam, and Steam imports continue to work without a RAWG key. Saved games remain viewable if a catalog provider is unavailable.

### Using the Library

- **All games**, **Steam**, **Xbox**, and **PlayStation** buttons switch between the combined collection and individual platform libraries. Existing Steam imports appear automatically.
- The Steam import panel retains Steam sign-in, importing, re-importing, and recommendation updates. Re-importing or linking a different Steam account only replaces the Steam portion of the library.
- Below the Steam import panel, **Add Xbox games** and **Add PlayStation games** open the respective live RAWG catalog. Browse every result page, search titles, filter by genre or console generation, and sort by popularity, name, release date, or rating. Catalog coverage and availability depend on RAWG's records; it is not a live storefront inventory.
- Select up to 50 games across searches and pages, then add them to your account. Already-added games are marked, and duplicate selections are ignored. The same title can be owned on multiple platforms.
- Search, filter, and sort saved games. Manually added console games can be removed independently; Steam games continue to be managed through importing.
- RAWG requires attribution on pages using its data; the catalog and saved console library include links to RAWG.

### API

| Method | Path | What it does |
| --- | --- | --- |
| POST | `/api/register` | Create an account (`{ username, password }`) and log in |
| POST | `/api/login` | Log in (`{ username, password }`) |
| POST | `/api/logout` | Log out |
| GET | `/api/me` | Current user: username, steamId, prefs, ownedAppIds |
| PUT | `/api/prefs` | Save preferences (`{ prefs: [...] }`) |
| GET | `/api/library` | Combined saved library and Steam connection/import status (login required) |
| GET | `/api/catalog/:platform/games` | Paginated Xbox or PlayStation catalog; accepts `search`, `genre`, `console`, `sort`, and `page` |
| POST | `/api/library/:platform/games` | Add console selections (`{ gameIds: [RAWG_ID, ...] }`); validates platform availability and saves per account |
| DELETE | `/api/library/:platform/games/:gameId` | Remove a console game by RAWG ID from the current account |
| GET | `/api/steam/login` | Redirects to Steam sign-in |
| GET | `/api/steam/return` | Steam redirects back here; links the SteamID to the account |
| GET | `/api/games/:appid` | Steam store details for the game popup (description, genres, developer, release date) |
| GET | `/api/steam/library` | Returns the Steam connection status and saved list of imported games |
| POST | `/api/steam/import` | Imports and saves the owned game list, and updates recommendations using the 30 most-played games |

The Steam profile's "Game details" privacy setting must be Public for the import to see the games.

For console endpoints, `:platform` is `xbox` or `playstation`. Catalog sort values are `-added` (popularity), `name`, `-released`, and `-rating`. Genres use RAWG slugs, and `console` uses a RAWG platform ID from the console-generation selector. Provider requests are cached briefly to reduce API usage; results are fetched a page at a time rather than downloading the entire catalog into the browser.

## Tests

```bash
npm test
```

Tests use temporary accounts and mocked Steam/RAWG services. They cover catalog queries and failures, account isolation, validation, duplicates, platform-specific removal, persistence across backend restarts, and Steam importing/relinking without losing console games.

## Build

```bash
npm run build
```

The production files go to `dist/`. To preview the build locally:

```bash
npm run preview
```

## Contribution
Angel - Fix a couple of bugs and update the color scheme 
Chinmay - created the home page, adjust preferences page and the navbar
Fernando - created the FrontPage and measure to link the front page to the HomePage and Library Page
Jacob - made the import library branch page
Patrick - Fixed buttons that didn't lead anywhere, added an under constructions page 
Isaac - Initial repo/project setup and contact page.
