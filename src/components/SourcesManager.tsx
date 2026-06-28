import React, { useState, useEffect } from "react";
import { RefreshCw, Check, Trash2, Plus, Play, Database, AlertCircle, CheckCircle, XCircle } from "lucide-react";

interface SourceItem {
  id: string; name: string; city: string; format: string;
  isActive: boolean; recordCount: number; status: string; lastRun: string | null;
}

export default function SourcesManager() {
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newCity, setNewCity] = useState("Алматы");

  const fetchSources = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/parser/sources");
      const d = await r.json();
      setSources(d.sources || []);
    } catch {}
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
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
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
            <div className="text-center py-10 text-slate-400 text-xs font-bold">Нет источников</div>
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
    </div>
  );
}
