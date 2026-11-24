# Online Communities: GameFinder

A game recommendation web app built with React and Vite, with a small Express backend. Users log in with a username and password, can optionally sign in with Steam to import their library, and get recommendations based on the kinds of games they play. The contact form only shows a confirmation message.

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

## Run the backend (login + Steam import)

Login and the Steam library import need the small Express server in `server/`.

1. Copy `.env.example` to `.env` and paste in a Steam Web API key from https://steamcommunity.com/dev/apikey
2. In a second terminal, run:

```bash
npm run server
```

The Vite dev server forwards every `/api` request to it (port 3001). Accounts are saved to `server/data/users.json`, which is git-ignored.

### API

| Method | Path | What it does |
| --- | --- | --- |
| POST | `/api/register` | Create an account (`{ username, password }`) and log in |
| POST | `/api/login` | Log in (`{ username, password }`) |
| POST | `/api/logout` | Log out |
| GET | `/api/me` | Current user: username, steamId, prefs, ownedAppIds |
| PUT | `/api/prefs` | Save preferences (`{ prefs: [...] }`) |
| GET | `/api/steam/login` | Redirects to Steam sign-in |
| GET | `/api/steam/return` | Steam redirects back here; links the SteamID to the account |
| GET | `/api/games/:appid` | Steam store details for the game popup (description, genres, developer, release date) |
| GET | `/api/steam/library` | Returns the Steam connection status and saved list of imported games |
| POST | `/api/steam/import` | Imports and saves the owned game list, and updates recommendations using the 30 most-played games |

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
