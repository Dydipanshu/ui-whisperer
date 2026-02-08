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

## Tech Stack

- **Framework:** Next.js (React)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Conversational AI:** Tambo

## Tambo Integration

This project heavily utilizes the `@tambo-ai/react` library to create a seamless conversational AI experience. Here's a breakdown of how we've integrated Tambo:

-   **`TamboProvider`**: At the root of our application, we use the `TamboProvider` to set up the Tambo context, which provides the AI assistant's behavior and makes it available throughout the component tree. You can find this in `app/providers.tsx`.
-   **`useTamboThread`**: This hook is the primary way we interact with the conversation thread. We use it to send messages to the AI and to get the latest state of the conversation, including the messages and any UI components the AI has sent.
-   **`ChatInterface`**: This project features a custom `ChatInterface` component that provides a user-friendly chat UI for interacting with the AI.
-   **`TamboCanvas`**: This is a crucial component that acts as a canvas for the AI to render UI components on. It listens for component dispatches from the AI and dynamically renders them on the page.
-   **AI-Driven Components**: The AI can generate several UI components, which are defined in `app/tambo-registry.tsx` and implemented in `app/components/tambo/`. These include:
    -   `HighlightOverlay`: To draw attention to specific elements on the page.
    -   `StickyNote`: To add contextual notes to the dashboard.
    -   `ScopeView`: To focus on a specific part of the UI.
    -   `UIExplanationCard`: To provide detailed explanations of data.
    -   `RunbookCard`: To present a series of actions or steps.

## Learning and Growth

This project serves as a comprehensive example of how to build a modern, AI-powered web application. By exploring the code, you can learn about:
-   **Generative UI:** See how an AI assistant can dynamically generate and manipulate UI components in response to natural language commands.
-   **Frontend Development:** Best practices for building a responsive and interactive UI with Next.js, TypeScript, and Tailwind CSS.
-   **AI Integration:** A practical guide on integrating a conversational AI into a React application using the `@tambo-ai/react` library.
-   **API Integration:** Learn how to fetch and display data from multiple external APIs in a real-time dashboard.
-   **Component-based Architecture:** Understand how to structure an application with reusable components, including AI-driven components in the `app/components/tambo` directory.
