# Installation

Run the commands from the repository root. Install Bun and Node.js, then run `bun install --frozen-lockfile`. Copy `.env.example` to `.env` and set these values.

| Variable | Value |
| --- | --- |
| `DATA_ROOT` | Absolute path to a writable directory outside the checkout. |
| `HOST` | Listen address, for example `127.0.0.1`. |
| `PORT` | Listen port, for example `8080`. |
| `ASSET_BASE_URL` | HTTP(S) URL that serves the resource files. The importer also accepts a `file:` URL for local files. |

## Prepare the inputs

```text
<DATA_ROOT>/
  inputs/
    catalogs/                            # created by the catalog command
    resource-version-registry/
      client-res.json
      client-ios-res.json
    archives/
      archive.json
      archive-details.json
      with-station.json
      with-station-details.json
    comments/
      comments.sqlite
```

Each registry maps client versions to arrays of complete resource versions, including the metadata after `@`. Use the Android registry in `client-res.json` and the iOS registry in `client-ios-res.json`. Supply the archive JSON and comment database for the saved releases you intend to serve. Initial cards and items come from the included `official-user-initial-state/`.

Place resource files at paths relative to the asset base URL, preserving each `catalog.assetPath` (for example, `raw/<prefix>/<realName>`). Name saved Android catalogs `<clientVersion>__<encodedVersion>__cache__catalog.json.gz`. Name saved iOS catalogs `<clientVersion>__<encodedVersion>.sqlite3`. Here `<encodedVersion>` is the unpadded base64url encoding of the complete resource version.

## Build the first release

```sh
bun run catalog:import-canonical android /absolute/path/to/android-catalogs
bun run catalog:import-canonical ios /absolute/path/to/ios-catalogs
bun run master-archive:import-saved
bun run runtime:initialize <release-id>
bun run start
```

Choose a release ID from `<DATA_ROOT>/master-archive/releases/index.json`. Initialization builds the active database and writes the selected release and maintenance state.

The server stores user state in `<DATA_ROOT>/state.sqlite`. Set `REQUEST_LOG_ENABLED=true` to write requests to `<DATA_ROOT>/requests.sqlite`.

## Run with Admin

```sh
bun run admin:build
bun run admin:start
```

Open `/admin` on the configured host and port. For managed release switching, put an executable at `<DATA_ROOT>/config/service-control` that accepts `stop` and `start`, and set `PUBLIC_API_BASE_URL` to the client-facing API URL. The switch checks that URL for the maintenance response and verifies the backend using `HOST` and `PORT` after restart. To switch releases from the command line, run `bun run runtime:switch <release-id>`.

## Tests

Place or link the saved test data directory at `.test-data`, with fixtures under `inputs/test-fixtures/`. Run `bun run test` and `bun run test:integration`. Missing fixtures fail the tests that use them.
