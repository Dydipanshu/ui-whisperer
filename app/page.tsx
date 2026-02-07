import { Activity, AlertTriangle, CloudRain, Globe2, RefreshCw, ShieldAlert, Wind, Waves } from "lucide-react";
import { ChatInterface } from "./components/ChatInterface";
import { getLiveRiskData } from "@/lib/live-data";
import { Badge } from "./components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";

const riskPillClass = {
  Low: "bg-emerald-400/15 text-emerald-200 border-emerald-300/30",
  Moderate: "bg-amber-300/15 text-amber-100 border-amber-300/40",
  High: "bg-orange-300/15 text-orange-100 border-orange-300/40",
  Critical: "bg-rose-300/20 text-rose-100 border-rose-300/45",
};

const riskToneClass = {
  Low: "text-emerald-200",
  Moderate: "text-amber-100",
  High: "text-orange-100",
  Critical: "text-rose-100",
};

const fmt = (n: number | null, suffix = "") => (n === null ? "N/A" : `${n}${suffix}`);

const AssistantUnavailable = () => (
  <div className="flex h-full flex-col bg-slate-950/80 text-slate-100">
    <div className="border-b border-cyan-200/20 px-5 py-4">
      <h2 className="text-sm font-semibold text-cyan-50">Atlas Copilot</h2>
      <p className="mt-1 text-xs text-cyan-100/70">Configure API key to enable AI interaction.</p>
    </div>
    <div className="m-4 rounded-xl border border-amber-200/25 bg-amber-300/10 p-4 text-xs text-amber-100">
      Set <code className="font-mono">NEXT_PUBLIC_TAMBO_API_KEY</code> in <code className="font-mono">.env.local</code>.
    </div>
  </div>
);

export default async function Page() {
  const live = await getLiveRiskData();
  const hasTamboApiKey = Boolean(process.env.NEXT_PUBLIC_TAMBO_API_KEY);
  const fetchedAt = new Date(live.fetchedAtIso).toLocaleString();

  return (
    <div className="aurora-shell h-screen w-screen overflow-hidden text-slate-100">
      <div className="aurora-glow aurora-glow-a" />
      <div className="aurora-glow aurora-glow-b" />
      <div className="aurora-grid" />

      <div className="relative grid h-full grid-cols-1 lg:grid-cols-[1fr_390px]">
        <main className="min-h-0 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-4 md:p-6">
            <header id="header-main" data-target-id className="glass-panel mb-4 rounded-3xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100/75">Global Risk Command</p>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">Nebula Sentinel</h1>
                  <p className="mt-1 text-sm text-cyan-50/80">Live weather stress, air quality pressure, and seismic activity across key cities.</p>
                </div>
                <div className="rounded-xl border border-cyan-200/20 bg-slate-950/50 px-3 py-2 text-right text-xs">
                  <p className="font-medium text-cyan-100">Sources</p>
                  <p className="text-cyan-100/70">Open-Meteo + USGS</p>
                  <p className="mt-1 flex items-center justify-end gap-1 text-cyan-100/70">
                    <RefreshCw size={12} /> {fetchedAt}
                  </p>
                </div>
              </div>
            </header>

            <section className="mb-4 grid gap-4 md:grid-cols-3">
              <Card id="kpi-top-risk" data-target-id className="glass-card">
                <CardHeader>
                  <CardTitle>Top Risk City</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-white">{live.metrics.topRiskCity}</p>
                  <p className={`mt-1 text-sm font-semibold ${live.metrics.topRiskScore >= 70 ? "text-rose-200" : "text-amber-100"}`}>
                    Score {live.metrics.topRiskScore}/100
                  </p>
                </CardContent>
              </Card>
              <Card id="kpi-quakes" data-target-id className="glass-card">
                <CardHeader>
                  <CardTitle>Quake Events (Top 10)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-white">{live.metrics.quakeCount24h}</p>
                  <p className="mt-1 text-sm text-cyan-50/75">Largest {live.metrics.strongestQuakeMag.toFixed(1)} magnitude</p>
                </CardContent>
              </Card>
              <Card id="kpi-strongest-quake" data-target-id className="glass-card">
                <CardHeader>
                  <CardTitle>Data Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-white">{live.sourceStatus.openMeteo === "ok" && live.sourceStatus.usgs === "ok" ? "Live" : "Fallback"}</p>
                  <p className="mt-1 text-sm text-cyan-50/75">Meteo: {live.sourceStatus.openMeteo} · USGS: {live.sourceStatus.usgs}</p>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <Card id="city-board" data-target-id className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle>City Signal Board</CardTitle>
                  <Badge className="border-cyan-200/30 bg-cyan-300/10 text-cyan-100">
                    <Globe2 size={12} className="mr-1" /> Live
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {live.cities.map((city) => (
                      <article
                        id={city.targetId}
                        key={city.id}
                        data-target-id
                        data-scope="city"
                        data-aqi={city.usAqi ?? -1}
                        data-risk={city.riskScore}
                        className="rounded-xl border border-cyan-200/15 bg-slate-950/45 p-3 transition hover:border-cyan-200/35"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-white">{city.name}</p>
                            <p className="text-[11px] text-cyan-100/65">{city.country}</p>
                          </div>
                          <Badge className={riskPillClass[city.riskLabel]}>{city.riskLabel}</Badge>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                          <p className="rounded-lg border border-cyan-200/15 bg-slate-900/75 px-2 py-1">Temp: <b>{fmt(city.tempC, "°C")}</b></p>
                          <p className="rounded-lg border border-cyan-200/15 bg-slate-900/75 px-2 py-1">AQI: <b>{fmt(city.usAqi)}</b></p>
                          <p className="rounded-lg border border-cyan-200/15 bg-slate-900/75 px-2 py-1">Wind: <b>{fmt(city.windKph, " km/h")}</b></p>
                          <p className="rounded-lg border border-cyan-200/15 bg-slate-900/75 px-2 py-1">PM2.5: <b>{fmt(city.pm25)}</b></p>
                        </div>
                        <p className={`mt-2 text-[11px] font-semibold ${riskToneClass[city.riskLabel]}`}>Risk score {city.riskScore}/100</p>
                      </article>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                <Card id="quake-panel" data-target-id className="glass-card">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle>Earthquake Watch</CardTitle>
                    <AlertTriangle size={15} className="text-rose-300" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {live.earthquakes.slice(0, 6).map((quake, idx) => (
                      <a
                        id={idx === 0 ? "quake-top-event" : undefined}
                        key={quake.id}
                        href={quake.url}
                        target="_blank"
                        rel="noreferrer"
                        data-target-id={idx === 0 ? true : undefined}
                        data-scope="quake"
                        data-mag={quake.mag}
                        className="block rounded-xl border border-cyan-200/15 bg-slate-950/45 p-2 transition hover:border-cyan-200/35 hover:bg-slate-900/60"
                      >
                        <p className="text-xs font-semibold text-white">M {quake.mag.toFixed(1)} · {quake.place}</p>
                        <p className="mt-0.5 text-[11px] text-cyan-100/65">Depth {quake.depthKm.toFixed(1)} km · {new Date(quake.time).toLocaleTimeString()}</p>
                      </a>
                    ))}
                  </CardContent>
                </Card>

                <section id="action-panel" data-target-id className="glass-panel rounded-2xl p-4">
                  <h2 className="text-sm font-semibold text-cyan-50">Operational Focus</h2>
                  <ul className="mt-2 space-y-2 text-xs text-cyan-100/85">
                    <li className="flex items-center gap-2"><ShieldAlert size={14} className="text-amber-300" /> Escalate cities with AQI {">"} 120</li>
                    <li className="flex items-center gap-2"><Wind size={14} className="text-sky-300" /> Watch wind + precipitation crossover for flood risk</li>
                    <li className="flex items-center gap-2"><CloudRain size={14} className="text-blue-300" /> Track quake clusters near dense populations</li>
                    <li className="flex items-center gap-2"><Activity size={14} className="text-rose-300" /> Ask Copilot for runbook generation</li>
                    <li className="flex items-center gap-2"><Waves size={14} className="text-cyan-300" /> Ask for scope filters to isolate only one critical signal</li>
                  </ul>
                </section>
              </div>
            </section>
          </div>
        </main>

        <aside className="min-h-0 border-l border-cyan-200/15 bg-slate-950/40 backdrop-blur-xl">
          {hasTamboApiKey ? <ChatInterface /> : <AssistantUnavailable />}
        </aside>
      </div>
    </div>
  );
}
