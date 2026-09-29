# Project layout

The replay code reads `catalog.json` and the session manifest. A session points to one circuit layout and to two season-specific car IDs. This lets a new year reuse the Canada scene without copying geometry.

| Path | Purpose | When adding another season or circuit |
| --- | --- | --- |
| `catalog.json` | Public session index and default selection | Add each new session ID and manifest path. |
| `data/<year>/<event>/<session>/<segment>/session.json` | Drivers, cars, lap paths, timing and track ID | Create a manifest per comparison. |
| `data/<year>/<event>/<session>/<segment>/laps/<driver>.json` | Normalized measured telemetry for one lap | Import and verify each driver's lap separately. |
| `tracks/<venue>/layouts/<layout-version>/` | Circuit coordinates, racing line, map and corner zones | Reuse a layout across years when geometry matches; version it when it changes. |
| `tracks/<venue>/scenery/` | Buildings, barriers, vegetation and venue details | Add a venue module; keep reusable texture files in `assets/environment/`. |
| `cars/registry.json` | Year and constructor to model and livery mapping | Register new season paint and optional new model. |
| `cars/liveries/<year>/<constructor>.js` | Constructor paint, shared by its drivers | Add one module per constructor and season. Driver numbers are runtime inputs. |
| `cars/models/` | Shared or constructor-specific model files | Include attribution and terms alongside each model. |
| `src/player/` | Catalog loading, sampling, route and playback | Change only for general replay behavior. |
| `src/renderer/` | Track, scenery and cars in 3D | Change for reusable rendering or camera work. |
| `src/ui/`, `src/showroom/` | Replay controls and livery preview | Add controls and inspect paint here. |
| `tools/`, `tests/` | Offline import, static build, validation | Update checks for new sessions and layouts. |
| `vendor/`, `docs/ASSETS.md` | Vendored renderer dependencies and credits | Preserve license and origin information. |

## Additions in separate commits

1. Add a constructor's paint under its year and register it in `cars/registry.json`. Inspect it in the showroom at multiple angles and with both driver numbers. Commit that constructor's paint and registry entry together.
2. Add a circuit's layout and scenery together with its credited source assets. Validate camera clearance, racing line, boundaries and lap alignment before linking a session.
3. Import each session into its year and event directory, add it to `catalog.json`, and run `npm run check` and `npm run build`. Review the telemetry provenance before publication.

Generated `dist/`, dependency `node_modules/`, import caches, and Sites hosting configuration are excluded from this source repository. The 2025 telemetry is retained, while its unapproved paint drafts and selectable replay are withheld until correct references are supplied. Ferrari 2026 is a showroom study and has no replay data yet.
