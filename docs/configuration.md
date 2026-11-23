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
bun run master-archive:build-active <release-id>
```

Use a release ID from `<DATA_ROOT>/master-archive/releases/index.json` with the Android and iOS versions you want. Replace `<release-id>` with that ID. The build writes `master-archive/active.sqlite` and prints both verified manifest paths.

Save an initialization JSON file outside the checkout with these absolute paths. Replace the two manifest values with `androidManifestPath` and `iosManifestPath` from the build output.

```json
{
  "activeDatabasePath": "/absolute/path/to/data/master-archive/active.sqlite",
  "selectedReleasePath": "/absolute/path/to/data/master-archive/releases/selected-release.json",
  "androidManifestPath": "/absolute/path/to/verified/android-manifest.json",
  "iosManifestPath": "/absolute/path/to/verified/ios-manifest.json"
}
```

```sh
bun run runtime:initialize /absolute/path/to/initialize.json
bun run start
```

The server stores user state in `<DATA_ROOT>/state.sqlite`. Set `REQUEST_LOG_ENABLED=true` to write requests to `<DATA_ROOT>/requests.sqlite`.

## Run with Admin

For Admin with the game API, add this to `.env`:

```dotenv
RUNTIME_SWITCH_COMMAND='["bun","run","runtime:switch"]'
```

Create `<DATA_ROOT>/config/runtime-switch.json`:

```json
{
  "controlScript": "/absolute/path/to/service-control",
  "backendBaseUrl": "http://127.0.0.1:8080/",
  "publicApiBaseUrl": "https://api.example.test/"
}
```

The executable must accept `stop` and `start` for this service. The switch command checks the client-facing maintenance response and verifies the backend after start.

```sh
bun run admin:build
bun run admin:start
```

Open `/admin` on the configured host and port. To switch releases from the command line, run `bun run runtime:switch <release-id>`.

## Tests

Set `ALTAIR_TEST_DATA_ROOT` to the absolute path of a test data directory with fixtures under `inputs/test-fixtures/`. Run `bun run test` and `bun run test:integration`.
