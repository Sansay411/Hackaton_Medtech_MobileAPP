import React, { useState, useEffect, useRef } from "react";
import { RefreshCw, Check, Trash2, Plus, Play, Database, Terminal } from "lucide-react";

interface SourceItem {
  id: string; name: string; city: string; format: string;
  isActive: boolean; recordCount: number; status: string; lastRun: string | null;
}

export default function SourcesManager() {
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningMap, setRunningMap] = useState<Record<string, boolean>>({});
  const [logs, setLogs] = useState<string[]>(["[СИСТЕМА] Менеджер источников загружен. Выберите источник для запуска парсера."]);
  const [error, setError] = useState("");
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newCity, setNewCity] = useState("Алматы");

  const fetchSources = async () => {
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const r = await fetch("/api/parser/sources", { signal: controller.signal });
      clearTimeout(timeout);
      const d = await r.json();
      setSources(d.sources || []);
      setError("");
    } catch (err: any) {
      setError(err.name === 'AbortError' ? 'Таймаут соединения с сервером. Перезагрузите страницу.' : 'Ошибка загрузки: ' + err.message);
      console.error("Sources load error:", err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchSources(); }, []);

  const toggleSource = async (id: string) => {
    await fetch("/api/parser/toggle-source", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceId: id }),
    });
    fetchSources();
  };

  const deleteSource = async (id: string) => {
    if (!confirm(`Удалить источник "${id}"?`)) return;
    await fetch("/api/parser/delete-source", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceId: id }),
    });
    fetchSources();
  };

  const addSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId || !newName) return;
    await fetch("/api/parser/add-source", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: newId, name: newName, url: newUrl, city: newCity }),
    });
    setNewId(""); setNewName(""); setNewUrl("");
    fetchSources();
  };

  const activeCount = sources.filter(s => s.isActive).length;
  const totalCount = sources.length;
  const totalRecords = sources.reduce((a, s) => a + s.recordCount, 0);

  return (
    <div className="space-y-6">
      {/* Stats bar + Run all button */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-blue-50 shadow-xs">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Всего источников</span>
          <p className="text-xl font-black text-slate-800 mt-1">{totalCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-blue-50 shadow-xs">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Активных</span>
          <p className="text-xl font-black text-emerald-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-blue-50 shadow-xs">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Всего записей</span>
          <p className="text-xl font-black text-blue-600 mt-1">{totalRecords.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-blue-50 shadow-xs flex items-center justify-center">
          <button onClick={async () => {
            const activeSrcs = sources.filter(s => s.isActive);
            setLogs([`[СИСТЕМА] Запуск ${activeSrcs.length} активных источников...`]);
            for (const src of activeSrcs) {
              setLogs(prev => [...prev, `[${src.id}] Запуск...`]);
              setRunningMap(prev => ({ ...prev, [src.id]: true }));
              try {
                const r = await fetch("/api/parser/run-source", {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ sourceId: src.id }),
                });
                const d = await r.json();
                if (d.result) {
                  setLogs(prev => [...prev, `[${src.id}] ✅ ${d.result.recordsExtracted} извл, ${d.result.recordsNew} новых (${d.result.durationMs}ms)`]);
                } else {
                  setLogs(prev => [...prev, `[${src.id}] ❌ ${d.error || "Ошибка"}`]);
                }
              } catch (err: any) {
                setLogs(prev => [...prev, `[${src.id}] ❌ ${err.message}`]);
              }
              setRunningMap(prev => ({ ...prev, [src.id]: false }));
            }
            setLogs(prev => [...prev, `[СИСТЕМА] Все источники завершены.`]);
            fetchSources();
          }} className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer shadow-sm flex items-center gap-2">
            <Play className="w-4 h-4" />
            Запустить все
          </button>
        </div>
      </div>

      {/* Source list */}
      <div className="bg-white rounded-3xl border border-blue-50 shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-xs text-slate-900 uppercase tracking-tight">Все источники парсинга</h3>
          <button onClick={fetchSources} disabled={loading} className="p-2 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition cursor-pointer">
            <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {sources.length === 0 && loading && (
            <div className="text-center py-10 text-slate-400 text-xs font-bold">Загрузка...</div>
          )}
          {sources.length === 0 && !loading && (
            <div className="text-center py-10">
              <p className="text-slate-400 text-xs font-bold mb-3">{error || "Нет источников"}</p>
              {error && (
                <button onClick={fetchSources} className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-blue-700 transition cursor-pointer">
                  Повторить загрузку
                </button>
              )}
            </div>
          )}
          {sources.map((src) => (
            <div key={src.id} className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
              src.isActive ? "bg-white border-slate-200 hover:border-blue-200" : "bg-slate-50 border-slate-100/50 opacity-70"
            }`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-3 h-3 rounded-full shrink-0 ${src.isActive ? "bg-emerald-500 shadow-sm" : "bg-slate-300"}`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-[12px] text-slate-800 truncate">{src.name}</span>
                    <span className={`text-[8px] font-black px-1.5 py-0.3 rounded-full uppercase ${
                      src.isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}>{src.isActive ? "Активен" : "Отключён"}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[9px] text-slate-400 font-semibold">
                    <span className="font-mono">{src.id}</span>
                    <span>{src.city}</span>
                    <span className="font-mono font-bold text-slate-500">{src.recordCount.toLocaleString()} зап.</span>
                    <span className={src.isActive ? "text-emerald-600" : "text-slate-400"}>{src.format}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={async () => {
                  setRunningMap(prev => ({ ...prev, [src.id]: true }));
                  setLogs(prev => [...prev, `[ПАРСЕР] Запуск ${src.name}...`]);
                  try {
                    const r = await fetch("/api/parser/run-source", {
                      method: "POST", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ sourceId: src.id }),
                    });
                    const d = await r.json();
                    if (d.result) {
                      setLogs(prev => [...prev, `[УСПЕХ] ${src.name}: ${d.result.recordsExtracted} извлечено, ${d.result.recordsNew} новых, ${d.result.durationMs}ms`]);
                    } else {
                      setLogs(prev => [...prev, `[ОШИБКА] ${src.name}: ${d.error || "Неизвестная ошибка"}`]);
                    }
                  } catch (err: any) {
                    setLogs(prev => [...prev, `[ОШИБКА] ${src.name}: ${err.message}`]);
                  }
                  setRunningMap(prev => ({ ...prev, [src.id]: false }));
                  fetchSources();
                }} disabled={runningMap[src.id]}
                  className="p-2 rounded-lg border border-blue-100 text-blue-500 bg-blue-50/30 hover:bg-blue-50 transition cursor-pointer disabled:opacity-40"
                  title="Запустить парсер">
                  <Play className={`w-3.5 h-3.5 ${runningMap[src.id] ? "animate-spin" : ""}`} />
                </button>
                <button onClick={() => toggleSource(src.id)}
                  className={`p-2 rounded-lg border transition cursor-pointer ${
                    src.isActive ? "bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100" : "bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600"
                  }`}>
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => deleteSource(src.id)}
                  className="p-2 rounded-lg border border-rose-100 text-rose-500 bg-rose-50/30 hover:bg-rose-50 transition cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add source form */}
      <div className="bg-white rounded-3xl border border-blue-50 shadow-xs p-5">
        <h3 className="font-black text-xs text-slate-900 uppercase tracking-tight mb-4">Добавить новый источник</h3>
        <form onSubmit={addSource} className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="text-[7px] text-slate-400 font-black uppercase tracking-wider block mb-1">ID</label>
            <input type="text" placeholder="my-clinic" value={newId} onChange={e => setNewId(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500" required />
          </div>
          <div>
            <label className="text-[7px] text-slate-400 font-black uppercase tracking-wider block mb-1">Название</label>
            <input type="text" placeholder="Моя клиника" value={newName} onChange={e => setNewName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500" required />
          </div>
          <div>
            <label className="text-[7px] text-slate-400 font-black uppercase tracking-wider block mb-1">URL</label>
            <input type="text" placeholder="https://clinic.kz/prices" value={newUrl} onChange={e => setNewUrl(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-[7px] text-slate-400 font-black uppercase tracking-wider block mb-1">Город</label>
            <select value={newCity} onChange={e => setNewCity(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-blue-500 text-slate-700">
              {["Алматы","Астана","Караганда","Шымкент","Актобе","Павлодар"].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Добавить
            </button>
          </div>
        </form>
      </div>

      {/* Parser console */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-inner space-y-1.5 max-h-52 overflow-y-auto font-mono text-[10px] text-emerald-400">
        <div className="flex items-center gap-2 text-slate-500 border-b border-slate-800 pb-2 mb-2 shrink-0 sticky top-0 bg-slate-900">
          <Terminal className="w-4 h-4" />
          <span className="font-black uppercase tracking-wider">Консоль парсера</span>
          <button onClick={() => setLogs(["[СИСТЕМА] Консоль очищена."])} className="ml-auto text-[8px] text-slate-600 hover:text-slate-400 font-bold px-2 py-0.5 rounded border border-slate-700 cursor-pointer">Очистить</button>
        </div>
        {logs.map((log, i) => {
          let color = "text-emerald-400";
          if (log.includes("[СИСТЕМА]")) color = "text-blue-300";
          if (log.includes("[УСПЕХ]")) color = "text-emerald-300 font-bold";
          if (log.includes("[ОШИБКА]")) color = "text-rose-300 font-bold";
          if (log.includes("[ПАРСЕР]")) color = "text-sky-300";
          return <div key={i} className={`${color} leading-relaxed`}>{log}</div>;
        })}
      </div>
    </div>
  );
}
