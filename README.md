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

## Run the backend (login  + libraries)

Login, saved libraries, Steam imports, and console catalog browsing need the small Express server in `server/`.

1. Copy `.env.example` to `.env`.
2. Set `STEAM_API_KEY` using a [Steam Web API key](https://steamcommunity.com/dev/apikey) to enable Steam imports.
3. Follow [IGDB account setup](https://api-docs.igdb.com/#account-creation): enable two-factor authentication on a Twitch account, then register a **Confidential** application in the [Twitch developer console](https://dev.twitch.tv/console/apps). Use `http://localhost` for the redirect URL. Set `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` in `.env` from that application. These credentials stay on the backend; players do not need Twitch accounts. Access tokens are obtained and renewed automatically.
4. In a second terminal, run:

```bash
npm run server
```

The Vite dev server forwards every `/api` request to it (port 3001). Restart the backend after changing `.env`. Accounts and their libraries are saved to `server/data/users.json`, which is git-ignored. Each provider key is independent: console libraries do not require connecting Steam, and Steam imports continue to work without Twitch credentials. Saved games remain viewable if a catalog provider is unavailable.

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
| POST | `/api/library/:platform/games` | Add console selections (`{ gameIds: [IGDB_ID, ...] }`); validates platform availability and saves per account |
| DELETE | `/api/library/:platform/games/:gameId` | Remove a console game by its saved ID (for IGDB games, `igdb:123`) from the current account |
| GET | `/api/steam/login` | Redirects to Steam sign-in |
| GET | `/api/steam/return` | Steam redirects back here; links the SteamID to the account |
| GET | `/api/games/:appid` | Steam store details for the game popup (description, genres, developer, release date) |
| GET | `/api/steam/library` | Returns the Steam connection status and saved list of imported games |
| POST | `/api/steam/import` | Imports and saves the owned game list, and updates recommendations using the 30 most-played games |

Console catalogs now use IGDB. Existing saved console games remain available; their older IDs are kept separate from new IGDB selections. The old `RAWG_API_KEY` setting is no longer used.

The Steam profile's "Game details" privacy setting must be Public for the import to see the games.

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
