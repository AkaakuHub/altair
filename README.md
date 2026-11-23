# altair

Self-hosted game API and Admin server. Game routes retain the original client protocol.

## Architecture

```mermaid
flowchart LR
  assets["vega<br/>Asset & archive server"]
  api["altair<br/>Game API & Admin"]
  state[("Persistent user data")]
  top["deneb<br/>WebView server"]
  game["Game client"]
  admin["Admin browser"]

  assets -->|"Catalogs & master data"| api
  api <--> state
  api -->|"/v1 API & resource URLs"| game
  api -->|"Admin UI & management API"| admin
  assets -->|"Resources & media"| game
  top -->|"WebView pages & APIs"| game

  classDef current fill:#fff1b8,stroke:#996b00,stroke-width:4px,color:#111
  class api current
```

## Quick start

Install Bun and Node.js. Run `bun install --frozen-lockfile`, then follow the [installation guide](docs/configuration.md) to prepare the data and start the server.

- `/v1/docs/` serves Swagger UI.
- `/v1/openapi.json` serves the OpenAPI contract.

## Notes

- Compatibility is not 100% complete; some API endpoints, achievement/mission systems, and edge-case behaviors are partial or approximate.

## Disclaimer

This is an unofficial, independent project created strictly for educational, research, and archival purposes, with no intention of infringing any intellectual property rights.

- This project is not affiliated with, endorsed by, or associated with the original game operators, publishers, or rights holders.
- No proprietary game assets, copyrighted media, or user data are included in this repository.
- All game assets, trademarks, and intellectual property belong to their respective copyright holders.

## License

[MIT](LICENSE)
