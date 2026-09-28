# Brown GP Ghost Lab — migration draft

Canada Q3 comparisons for 2025 (Russell / Verstappen) and 2026 (Russell / Antonelli). Choose a replay season above the viewer. Changing sessions reloads the renderer to release the previous session's graphics resources.

## Run

Node 22+ is recommended. Run `npm ci`, `npm run check`, `npm run build`, then `npm run dev`. The published site is plain static output in `dist/`; no API keys or server are required at playback time. Relative asset paths support hosting under `/ghostlab/` as well as a separate domain.

## Organization

- `catalog.json`: available comparisons, default session, track and car registries.
- `data/<year>/<event>/<session>/<segment>/`: session manifest and individual lap files.
- `tracks/montreal/layouts/canada-v1/`: locked circuit map, racing line, start/finish alignment and corner zones.
- `tracks/montreal/scenery/`: reusable Canada environment.
- `cars/registry.json`: maps constructor/year identifiers to model and livery modules.
- `cars/models/`, `cars/liveries/<year>/<team>.js`: shared geometry and paint modules separated by season. The current 2025 Mercedes file is a checkpoint copy pending 2025 references.
- `src/player/`: telemetry sampling, route reconstruction and playback.
- `src/renderer/`: circuit and car rendering.
- `src/ui/`: session selection, labels and styles.
- `tools/`: static build and offline telemetry import.
- `tests/`: lap validation and movement regression checks.

## Add another session

1. Copy `tools/sessions/canada-2025-q3.json` and specify reviewed lap identities, start timestamps, exact durations and car IDs.
2. Run `node tools/import-openf1.mjs <specification.json>`. It downloads public telemetry into an ignored cache and writes normalized lap files and a session manifest. Review the provider coverage and positional alignment before accepting a session.
3. Add the new manifest to `catalog.json`. Existing Canada sessions use `montreal-canada-v1` without copying scenery or changing the renderer.
4. Run the checks and rebuild. Add expected lap durations to the regression checks when adding a new comparison.

For another circuit, create a separate layout, scenery module and calibrated racing line; telemetry alone cannot generate a faithful venue. Reuse Canada's scenery across years only while its layout remains appropriate; retain older layout versions if geometry changes.

## Accuracy and checkpoint

The accepted Canada V4.8 geometry and route algorithm are retained. Timing, speed, throttle, brake state, gear and RPM are measured channels; racing trajectories, steering and load transfer are reconstructed. Brake state is not measured pedal pressure. Corner comparisons use speed samples within fixed track zones.

The approved playback labels are preserved: displayed 0.5× advances at 1 elapsed lap second per wall second; displayed 1× at 1.5; displayed 2× at 2. This is a visual pacing convention, not literal real-time playback. It does not change stored lap times or gap calculations.

Mercedes and Red Bull are paint recreations on one shared open-wheel chassis, not exact constructor chassis models. The registry permits separate model assets later.

The 2026 Ferrari SF-26 paint study is stored in `cars/liveries/2026/ferrari.js` and registered as `ferrari-2026`. Open `src/showroom/index.html` in the built site to inspect it and switch numbers 16 and 44. The number is an input to the paint function, not part of a baked constructor texture. This study has no Ferrari replay session until suitable lap data is added. The supplied photos guide the red/white/black pattern and the sponsor arrangement; the shared model cannot recreate exact SF-26 geometry.

This repository is the source for the Ghost Lab migration draft. A public source release license has not yet been selected. See `docs/ASSETS.md` for asset provenance and `docs/FOLDER-STRUCTURE.md` for the extension workflow.
