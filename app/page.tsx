import { Activity, AlertTriangle, CloudRain, Globe2, RefreshCw, ShieldAlert, Wind } from "lucide-react";
import { ChatInterface } from "./components/ChatInterface";
import { getLiveRiskData } from "@/lib/live-data";
import { Badge } from "./components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { TamboCanvas } from "./components/TamboCanvas";

const riskPillClass = {
  Low: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Moderate: "bg-amber-100 text-amber-900 border-amber-200",
  High: "bg-orange-100 text-orange-900 border-orange-200",
  Critical: "bg-rose-100 text-rose-900 border-rose-200",
};

const riskToneClass = {
  Low: "text-emerald-700",
  Moderate: "text-amber-700",
  High: "text-orange-700",
  Critical: "text-rose-700",
};

const fmt = (n: number | null, suffix = "") => (n === null ? "N/A" : `${n}${suffix}`);

const AssistantUnavailable = () => (
  <div className="flex h-full flex-col bg-white">
    <div className="border-b border-slate-200 px-5 py-4">
      <h2 className="text-sm font-semibold text-slate-900">Operations Copilot</h2>
      <p className="mt-1 text-xs text-slate-500">Configure API key to enable AI interaction.</p>
    </div>
    <div className="m-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
      Set <code className="font-mono">NEXT_PUBLIC_TAMBO_API_KEY</code> in <code className="font-mono">.env.local</code>.
    </div>
  </div>
);

export default async function Page() {
  const live = await getLiveRiskData();
  const hasTamboApiKey = Boolean(process.env.NEXT_PUBLIC_TAMBO_API_KEY);
  const fetchedAt = new Date(live.fetchedAtIso).toLocaleString();

  return (
    <div className="h-screen w-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#dbeafe_0%,#f8fafc_45%,#f1f5f9_100%)] text-slate-900">
      <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_400px]">
        <main className="min-h-0 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-4 md:p-6">
            <header id="header-main" data-target-id className="mb-4 rounded-3xl border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Global Risk Command</p>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Aurora Atlas</h1>
                  <p className="mt-1 text-sm text-slate-600">Live weather stress, air quality pressure, and seismic activity across key cities.</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-right text-xs">
                  <p className="font-medium text-slate-700">Sources</p>
                  <p className="text-slate-500">Open-Meteo + USGS</p>
                  <p className="mt-1 flex items-center justify-end gap-1 text-slate-500"><RefreshCw size={12} /> {fetchedAt}</p>
                </div>
              </div>
            </header>

            <section className="mb-4 grid gap-4 md:grid-cols-3">
              <Card id="kpi-top-risk" data-target-id>
                <CardHeader><CardTitle>Top Risk City</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-slate-900">{live.metrics.topRiskCity}</p>
                  <p className={`mt-1 text-sm font-semibold ${live.metrics.topRiskScore >= 70 ? "text-rose-700" : "text-amber-700"}`}>Score {live.metrics.topRiskScore}/100</p>
                </CardContent>
              </Card>
              <Card id="kpi-quakes" data-target-id>
                <CardHeader><CardTitle>Quake Events (Top 10)</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-slate-900">{live.metrics.quakeCount24h}</p>
                  <p className="mt-1 text-sm text-slate-600">Largest {live.metrics.strongestQuakeMag.toFixed(1)} magnitude</p>
                </CardContent>
              </Card>
              <Card id="kpi-strongest-quake" data-target-id>
                <CardHeader><CardTitle>Data Health</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-slate-900">{live.sourceStatus.openMeteo === "ok" && live.sourceStatus.usgs === "ok" ? "Live" : "Fallback"}</p>
                  <p className="mt-1 text-sm text-slate-600">Meteo: {live.sourceStatus.openMeteo} · USGS: {live.sourceStatus.usgs}</p>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <Card id="city-board" data-target-id>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle>City Signal Board</CardTitle>
                  <Badge className="border-slate-200 bg-slate-50 text-slate-700"><Globe2 size={12} className="mr-1" /> Live</Badge>
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
                        className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{city.name}</p>
                            <p className="text-[11px] text-slate-500">{city.country}</p>
                          </div>
                          <Badge className={riskPillClass[city.riskLabel]}>{city.riskLabel}</Badge>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                          <p className="rounded-lg border border-slate-200 bg-white px-2 py-1">Temp: <b>{fmt(city.tempC, "°C")}</b></p>
                          <p className="rounded-lg border border-slate-200 bg-white px-2 py-1">AQI: <b>{fmt(city.usAqi)}</b></p>
                          <p className="rounded-lg border border-slate-200 bg-white px-2 py-1">Wind: <b>{fmt(city.windKph, " km/h")}</b></p>
                          <p className="rounded-lg border border-slate-200 bg-white px-2 py-1">PM2.5: <b>{fmt(city.pm25)}</b></p>
                        </div>
                        <p className={`mt-2 text-[11px] font-semibold ${riskToneClass[city.riskLabel]}`}>Risk score {city.riskScore}/100</p>
                      </article>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                <Card id="quake-panel" data-target-id>
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle>Earthquake Watch</CardTitle>
                    <AlertTriangle size={15} className="text-rose-600" />
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
                        className="block rounded-xl border border-slate-200 bg-slate-50 p-2 hover:bg-slate-100"
                      >
                        <p className="text-xs font-semibold text-slate-900">M {quake.mag.toFixed(1)} · {quake.place}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">Depth {quake.depthKm.toFixed(1)} km · {new Date(quake.time).toLocaleTimeString()}</p>
                      </a>
                    ))}
                  </CardContent>
                </Card>

                <section id="action-panel" data-target-id className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-700 p-4 text-slate-100 shadow-sm">
                  <h2 className="text-sm font-semibold">Operational Focus</h2>
                  <ul className="mt-2 space-y-2 text-xs">
                    <li className="flex items-center gap-2"><ShieldAlert size={14} className="text-amber-300" /> Escalate cities with AQI {">"} 120</li>
                    <li className="flex items-center gap-2"><Wind size={14} className="text-sky-300" /> Watch wind + precipitation crossover for flood risk</li>
                    <li className="flex items-center gap-2"><CloudRain size={14} className="text-blue-300" /> Track quake clusters near dense populations</li>
                    <li className="flex items-center gap-2"><Activity size={14} className="text-rose-300" /> Ask Copilot for targeted runbooks</li>
                  </ul>
                </section>
              </div>
            </section>
          </div>
          {hasTamboApiKey ? <TamboCanvas /> : null}
        </main>

        <aside className="min-h-0 border-l border-slate-200 bg-white/90 backdrop-blur">
          {hasTamboApiKey ? <ChatInterface /> : <AssistantUnavailable />}
        </aside>
      </div>
    </div>
  );
}
