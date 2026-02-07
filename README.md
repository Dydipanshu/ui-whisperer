# Sentinel Copilot (Tambo SDK Demo)

Sentinel Copilot is a **live-data risk intelligence app** built with Next.js + Tambo.
It demonstrates generative UI workflows against real public data instead of a static mock dashboard.

## What this showcases

- Tambo-driven **UI actions** on real dashboard targets:
  - `HighlightOverlay` for focus guidance
  - `HighlightOverlay(mode: "clear")` for unhighlight/reset
  - `StickyNote` anchored to exact sections/rows
  - `UIExplanationCard` for structured insights
  - `RunbookCard` for operational plans
- Live ingestion from free public APIs
- AI assistant that can interpret current conditions and act directly on the UI

## Live data sources

- Open-Meteo Forecast API (weather): https://open-meteo.com/
- Open-Meteo Air Quality API: https://open-meteo.com/en/docs/air-quality-api
- USGS Earthquake GeoJSON feeds: https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php

## Product concept

The app tracks city-level environmental risk and seismic activity in near real time.
A single copilot can:

- Explain the most at-risk city and why
- Highlight specific KPIs/city rows/quake events
- Create mitigation runbooks
- Place actionable notes on exact dashboard targets

## Setup

1. Install dependencies

```bash
npm install
```

2. Configure Tambo key in `.env.local`

```bash
NEXT_PUBLIC_TAMBO_API_KEY=your_key_here
```

3. Run app

```bash
npm run dev
```

4. Open `http://localhost:3000`

## Suggested prompts

- `Summarize current global risk from this live data`
- `Highlight the highest AQI city and strongest earthquake`
- `Create a mitigation runbook for today's top risks`
- `Add a sticky note on Tokyo with monitoring advice`
- `Unhighlight everything`

## Architecture

- `lib/live-data.ts`: Aggregates Open-Meteo + USGS and computes risk signals
- `app/api/live/route.ts`: JSON endpoint for latest data snapshot
- `app/page.tsx`: Live product UI with stable target IDs
- `app/providers.tsx`: Tambo provider + assistant behavior contract
- `app/tambo-registry.tsx`: Generative component registry
- `app/components/tambo/*`: Renderable AI components
