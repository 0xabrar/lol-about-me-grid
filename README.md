# About Me: League of Legends

A static League of Legends profile grid builder inspired by grids.fun, scoped to champion picks only.

## Features

- Bundles all 172 League champions and their square portraits from Riot Data Dragon.
- Search and position filters for the champion picker: Top, Jungle, Mid, Bot, and Support.
- Fixed League-specific profile grid categories.
- Every cell behaves the same way: select a slot, then pick a champion.
- Local browser persistence.
- Copyable hash-based share links.
- PNG export rendered in the browser with champion portraits.

## Run Locally

This is a dependency-free static site:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Cloudflare Pages

Use these settings when importing the repository:

- Framework preset: `None`
- Build command: leave blank
- Build output directory: `/`

The site is plain HTML, CSS, and JavaScript, so no Node.js build step is required.

## Data Source

Champion metadata and square portraits are bundled from Riot Data Dragon:

- `https://ddragon.leagueoflegends.com/api/versions.json`
- `https://ddragon.leagueoflegends.com/cdn/{version}/data/en_US/champion.json`
- `https://ddragon.leagueoflegends.com/cdn/{version}/img/champion/{image}`

The browser app does not fetch Data Dragon at runtime. It reads `data/champions.js` and local files under `assets/champions/`.

Champion position filters are bundled from the League client champion statistics data exported by CommunityDragon:

- `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-champion-statistics/global/default/rcp-fe-lol-champion-statistics.js`
