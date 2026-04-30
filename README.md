# SARTAC

Static HTML app for over-water Search and Rescue planning calculations.

## What this app does

The app guides a planner through common SAR math steps:

1. Mission datum and elapsed time
2. Uncorrected sweep width with correction factors
3. Search altitude helper
4. Drift vector (current + leeway)
5. Search effort and estimated searchable area
6. Copy-ready mission summary

## Run locally

This project has no build step and no external dependencies.

Open `index.html` directly in a browser, or run a local server from the repo root:

```bash
python3 -m http.server 8000
```

Then browse to `http://localhost:8000`.

## Guidance mapping

Use table/chart values from your SAR guidance deck for the first 27 slides:

- Enter the tabulated uncorrected sweep width into **Wu**
- Enter slide-provided correction multipliers (weather, speed, visibility/fatigue, altitude)
- Enter drift components (set/drift, wind/leeway) from the same guidance flow

The app performs the arithmetic and outputs track spacing, POD estimate, drifted position, and searchable area.
