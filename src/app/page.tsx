'use client';

import React, { useMemo, useState, useEffect } from "react";

/*************************
 * Types
 *************************/
export type Asset = {
  id: string;
  code: string;
  name: string;
  assetType: string;
  vin?: string | null;
  plate?: string | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  status: "ACTIVE" | "IN_SHOP" | "OUT_OF_SERVICE" | "RETIRED";
  meterUnit: "MILES" | "HOURS";
  currentMeter?: number | null;
  createdAt: string;
};

/*************************
 * Small UI Primitives
 *************************/
function Badge({ children, tone = "zinc" }: { children: React.ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    zinc: "bg-zinc-800 text-zinc-100 border-zinc-700",
    green: "bg-emerald-900/50 text-emerald-200 border-emerald-700/70",
    red: "bg-rose-900/50 text-rose-200 border-rose-700/70",
    yellow: "bg-amber-900/50 text-amber-200 border-amber-700/70",
    blue: "bg-sky-900/50 text-sky-200 border-sky-700/70",
    gray: "bg-neutral-800 text-neutral-200 border-neutral-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
      tones[tone] || tones["zinc"]
    }`}>{children}</span>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
      <h3 className="mb-2 text-sm font-semibold text-zinc-300">{title}</h3>
      {children}
    </div>
  );
}

/*************************
 * VIN Decoder Modal (NHTSA VPIC)
 *************************/
type AssetForm = {
  code: string;
  name: string;
  assetType: "Truck" | "Loader" | "Skid" | "Attachment" | "Trailer" | "Salter";
  vin: string;
  plate: string;
  year: string;
  make: string;
  model: string;
  meterUnit: "MILES" | "HOURS";
};

function AddAssetModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [vin, setVin] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<AssetForm>({
    code: "",
    name: "",
    assetType: "Truck",
    vin: "",
    plate: "",
    year: "",
    make: "",
    model: "",
    meterUnit: "MILES",
  });

  async function decodeVIN() {
    setError(null);
    if (!vin || vin.length < 11) { setError("Enter a valid VIN (11–17 chars)"); return; }
    try {
      setLoading(true);
      const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${encodeURIComponent(vin)}?format=json`);
      const data: { Results?: Array<Record<string, string>> } = await res.json();
      const row = data?.Results?.[0] || {};
      const year = row.ModelYear || "";
      const make = row.Make || "";
      const model = row.Model || "";
      setForm((f) => ({ ...f, vin, year, make, model, name: f.name || `${make} ${model}` }));
    } catch {
      setError("VIN decode failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function onChange<K extends keyof AssetForm>(key: K, value: AssetForm[K]) {
    setForm((f) => ({ ...f, [key]: value } as AssetForm));
  }

  async function save() {
    const payload = {
      code: form.code,
      name: form.name || `${form.make} ${form.model}`.trim(),
      assetType: form.assetType,
      vin: form.vin || null,
      plate: form.plate || null,
      year: form.year ? Number(form.year) : null,
      make: form.make || null,
      model: form.model || null,
      meterUnit: form.meterUnit,
    };
    try {
      const r = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        alert("Save failed");
        return;
      }
      onClose();
      if (typeof window !== "undefined") window.location.reload();
    } catch {
      alert("Network error while saving");
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-4">
        <h2 className="text-lg font-semibold text-zinc-100">Add New Asset</h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* VIN + inputs restored */}
          <div className="md:col-span-2">
            <label className="text-xs text-zinc-400">VIN</label>
            <div className="mt-1 flex gap-2">
              <input value={vin} onChange={(e) => setVin(e.target.value.trim().toUpperCase())} placeholder="1FT..." className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none" />
              <button onClick={decodeVIN} disabled={loading} className="whitespace-nowrap rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-50">{loading ? "Decoding…" : "Decode VIN"}</button>
            </div>
            {error && <div className="mt-1 text-xs text-rose-400">{error}</div>}
          </div>

          <div><label className="text-xs text-zinc-400">Unit Code</label><input value={form.code} onChange={(e) => onChange("code", e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none" /></div>
          <div><label className="text-xs text-zinc-400">Name</label><input value={form.name} onChange={(e) => onChange("name", e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none" /></div>
          <div><label className="text-xs text-zinc-400">Type</label><select value={form.assetType} onChange={(e) => onChange("assetType", e.target.value as AssetForm["assetType"])} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none"> {["Truck","Loader","Skid","Attachment","Trailer","Salter"].map(t => <option key={t}>{t}</option>)} </select></div>
          <div><label className="text-xs text-zinc-400">Plate</label><input value={form.plate} onChange={(e) => onChange("plate", e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none" /></div>
          <div><label className="text-xs text-zinc-400">Year</label><input value={form.year} onChange={(e) => onChange("year", e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none" /></div>
          <div><label className="text-xs text-zinc-400">Make</label><input value={form.make} onChange={(e) => onChange("make", e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none" /></div>
          <div><label className="text-xs text-zinc-400">Model</label><input value={form.model} onChange={(e) => onChange("model", e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none" /></div>
          <div><label className="text-xs text-zinc-400">Meter Unit</label><select value={form.meterUnit} onChange={(e) => onChange("meterUnit", e.target.value as AssetForm["meterUnit"])} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none"> {["MILES","HOURS"].map(t => <option key={t}>{t}</option>)} </select></div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800">Cancel</button>
          <button onClick={save} className="rounded-lg border border-emerald-700 bg-emerald-900/40 px-3 py-2 text-sm text-emerald-200 hover:bg-emerald-900/60">Save Asset</button>
        </div>
      </div>
    </div>
  );
}

/*************************
 * Assets View wired to API
 *************************/
function AssetsView({ search }: { search: string }) {
  const [openAdd, setOpenAdd] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    fetch("/api/assets")
      .then((r) => r.json())
      .then((rows: Asset[]) => setAssets(rows))
      .catch(() => setAssets([]));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return assets.filter((a) => [a.code, a.name, a.assetType, a.make ?? "", a.model ?? "", a.status].join(" ").toLowerCase().includes(q));
  }, [search, assets]);

  const isHours = (t: string) => /loader|skid/i.test(t);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Assets</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setOpenAdd(true)} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800">+ New Asset</button>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-zinc-800">
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-zinc-900/60">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-zinc-400">Unit</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-zinc-400">Name</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-zinc-400">Type</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-zinc-400">Status</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-zinc-400">Meter</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-zinc-400">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filtered.map((a) => (
              <tr key={a.id} className="hover:bg-zinc-900/40">
                <td className="px-4 py-2 text-sm text-zinc-300">{a.code}</td>
                <td className="px-4 py-2 text-sm text-zinc-100">{a.name}</td>
                <td className="px-4 py-2 text-sm text-zinc-300">{a.assetType}</td>
                <td className="px-4 py-2"><Badge tone="green">{a.status}</Badge></td>
                <td className="px-4 py-2 text-sm text-zinc-300">{typeof a.currentMeter === 'number' ? a.currentMeter.toLocaleString() : '—'} {isHours(a.assetType) ? "hrs" : "mi"}</td>
                <td className="px-4 py-2 text-sm text-zinc-300">—</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AddAssetModal open={openAdd} onClose={() => setOpenAdd(false)} />
    </div>
  );
}

/*************************
 * Additional Views
 *************************/
function DashboardView() { return <SectionCard title="Dashboard"><div className="text-zinc-400">Coming soon…</div></SectionCard>; }
function InspectionsView() { return <SectionCard title="Inspections"><div className="text-zinc-400">Coming soon…</div></SectionCard>; }
function PMView() { return <SectionCard title="Preventive Maintenance"><div className="text-zinc-400">Coming soon…</div></SectionCard>; }
function WorkOrdersView() { return <SectionCard title="Work Orders"><div className="text-zinc-400">Coming soon…</div></SectionCard>; }
function SettingsView() { return <SectionCard title="Settings"><div className="text-zinc-400">Coming soon…</div></SectionCard>; }

/*************************
 * App Shell
 *************************/
export default function FleetManagerUIMock() {
  const [route, setRoute] = useState("assets");
  const [search, setSearch] = useState("");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <aside className="fixed inset-y-0 left-0 w-48 border-r border-zinc-800 bg-zinc-950 p-4 space-y-2">
        {[
          ["Dashboard", "dashboard"],
          ["Assets", "assets"],
          ["Inspections", "inspections"],
          ["PM", "pm"],
          ["Work Orders", "workorders"],
          ["Settings", "settings"],
        ].map(([label, key]) => (
          <button
            key={key}
            onClick={() => setRoute(key)}
            className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${route === key ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:bg-zinc-900"}`}
          >
            {label}
          </button>
        ))}
      </aside>
      <main className="ml-52 p-4 space-y-4">
        {route === "dashboard" && <DashboardView />}
        {route === "assets" && <AssetsView search={search} />}
        {route === "inspections" && <InspectionsView />}
        {route === "pm" && <PMView />}
        {route === "workorders" && <WorkOrdersView />}
        {route === "settings" && <SettingsView />}
      </main>
    </div>
  );
}
