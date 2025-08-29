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

/*************************
 * VIN Decoder Add Modal
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

function AddAssetModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (a: Asset) => void;
}) {
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
      setForm((f) => ({
        ...f,
        vin,
        year: row.ModelYear || "",
        make: row.Make || "",
        model: row.Model || "",
        name: f.name || `${row.Make || ""} ${row.Model || ""}`.trim(),
      }));
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
      if (!r.ok) { alert("Save failed"); return; }
      const created: Asset = await r.json();
      onCreated(created);
      onClose();
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
          <div className="md:col-span-2">
            <label className="text-xs text-zinc-400">VIN</label>
            <div className="mt-1 flex gap-2">
              <input
                value={vin}
                onChange={(e) => setVin(e.target.value.trim().toUpperCase())}
                placeholder="1FT..."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none"
              />
              <button
                onClick={decodeVIN}
                disabled={loading}
                className="whitespace-nowrap rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
              >
                {loading ? "Decoding…" : "Decode VIN"}
              </button>
            </div>
            {error && <div className="mt-1 text-xs text-rose-400">{error}</div>}
          </div>

          <div>
            <label className="text-xs text-zinc-400">Unit Code</label>
            <input
              value={form.code}
              onChange={(e) => onChange("code", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400">Name</label>
            <input
              value={form.name}
              onChange={(e) => onChange("name", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400">Type</label>
            <select
              value={form.assetType}
              onChange={(e) => onChange("assetType", e.target.value as AssetForm["assetType"])}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none"
            >
              {["Truck", "Loader", "Skid", "Attachment", "Trailer", "Salter"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-zinc-400">Plate</label>
            <input
              value={form.plate}
              onChange={(e) => onChange("plate", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400">Year</label>
            <input
              value={form.year}
              onChange={(e) => onChange("year", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400">Make</label>
            <input
              value={form.make}
              onChange={(e) => onChange("make", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400">Model</label>
            <input
              value={form.model}
              onChange={(e) => onChange("model", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400">Meter Unit</label>
            <select
              value={form.meterUnit}
              onChange={(e) => onChange("meterUnit", e.target.value as AssetForm["meterUnit"])}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none"
            >
              {["MILES", "HOURS"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
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
 * Edit Asset Modal
 *************************/
function EditAssetModal({
  open,
  onClose,
  asset,
  onUpdated,
}: {
  open: boolean;
  onClose: () => void;
  asset: Asset | null;
  onUpdated: (updated: Asset) => void;
}) {
  const [form, setForm] = useState({
    code: asset?.code ?? "",
    name: asset?.name ?? "",
    assetType: (asset?.assetType as AssetForm["assetType"]) ?? "Truck",
    vin: asset?.vin ?? "",
    plate: asset?.plate ?? "",
    year: asset?.year ? String(asset.year) : "",
    make: asset?.make ?? "",
    model: asset?.model ?? "",
    meterUnit: asset?.meterUnit ?? "MILES",
    status: asset?.status ?? "ACTIVE",
    currentMeter: asset?.currentMeter ?? null,
  });

  useEffect(() => {
    if (!asset) return;
    setForm({
      code: asset.code,
      name: asset.name,
      assetType: asset.assetType as AssetForm["assetType"],
      vin: asset.vin ?? "",
      plate: asset.plate ?? "",
      year: asset.year ? String(asset.year) : "",
      make: asset.make ?? "",
      model: asset.model ?? "",
      meterUnit: asset.meterUnit,
      status: asset.status,
      currentMeter: asset.currentMeter ?? null,
    });
  }, [asset]);

  function onChange<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    if (!asset) return;
    const payload = {
      code: form.code,
      name: form.name,
      assetType: form.assetType,
      vin: form.vin || null,
      plate: form.plate || null,
      year: form.year ? Number(form.year) : null,
      make: form.make || null,
      model: form.model || null,
      meterUnit: form.meterUnit,
      status: form.status as Asset["status"],
      currentMeter: form.currentMeter as number | null,
    };
    const r = await fetch(`/api/assets/${asset.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) { alert("Update failed"); return; }
    const updated: Asset = await r.json();
    onUpdated(updated);
    onClose();
  }

  if (!open || !asset) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 p-4 space-y-4">
        <h2 className="text-lg font-semibold text-zinc-100">Edit Asset</h2>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="text-xs text-zinc-400">VIN</label>
            <input
              value={form.vin}
              onChange={(e) => onChange("vin", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Unit Code</label>
            <input
              value={form.code}
              onChange={(e) => onChange("code", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Name</label>
            <input
              value={form.name}
              onChange={(e) => onChange("name", e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Status</label>
            <select
              value={form.status}
              onChange={(e) => onChange("status", e.target.value as Asset["status"])}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none"
            >
              {["ACTIVE", "IN_SHOP", "OUT_OF_SERVICE", "RETIRED"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-400">Meter Unit</label>
            <select
              value={form.meterUnit}
              onChange={(e) => onChange("meterUnit", e.target.value as AssetForm["meterUnit"])}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none"
            >
              {["MILES", "HOURS"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-400">Current Meter</label>
            <input
              value={form.currentMeter ?? ""}
              onChange={(e) =>
                onChange("currentMeter", e.target.value === "" ? null : Number(e.target.value))
              }
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800">Cancel</button>
          <button onClick={save} className="rounded-lg border border-emerald-700 bg-emerald-900/40 px-3 py-2 text-sm text-emerald-200 hover:bg-emerald-900/60">Save Changes</button>
        </div>
      </div>
    </div>
  );
}

/*************************
 * Assets View (list + actions)
 *************************/
function AssetsView({ search }: { search: string }) {
  const [openAdd, setOpenAdd] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/assets")
      .then((r) => r.json())
      .then((rows: Asset[]) => setAssets(rows))
      .catch(() => setAssets([]));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return assets.filter((a) =>
      [a.code, a.name, a.assetType, a.make ?? "", a.model ?? "", a.status]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [search, assets]);

  const isHours = (t: string) => /loader|skid/i.test(t);

  async function deleteAsset(id: string) {
    if (!confirm("Delete this asset? This cannot be undone.")) return;
    try {
      setBusyId(id);
      const r = await fetch(`/api/assets/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Delete failed");
      setAssets((prev) => prev.filter((x) => x.id !== id));
    } catch {
      alert("Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  function onCreated(newAsset: Asset) {
    setAssets((prev) => [newAsset, ...prev]);
  }

  function onUpdated(updated: Asset) {
    setAssets((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Assets</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setOpenAdd(true)} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800">
            + New Asset
          </button>
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
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-zinc-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filtered.map((a) => (
              <tr key={a.id} className="hover:bg-zinc-900/40">
                <td className="px-4 py-2 text-sm text-zinc-300">{a.code}</td>
                <td className="px-4 py-2 text-sm text-zinc-100">{a.name}</td>
                <td className="px-4 py-2 text-sm text-zinc-300">{a.assetType}</td>
                <td className="px-4 py-2">
                  <Badge tone={a.status === "ACTIVE" ? "green" : a.status === "IN_SHOP" ? "yellow" : "red"}>
                    {a.status}
                  </Badge>
                </td>
                <td className="px-4 py-2 text-sm text-zinc-300">
                  {typeof a.currentMeter === "number" ? a.currentMeter.toLocaleString() : "—"} {isHours(a.assetType) ? "hrs" : "mi"}
                </td>
                <td className="px-4 py-2 text-sm text-zinc-300">—</td>
                <td className="px-4 py-2 text-sm text-zinc-300">
                  <div className="flex gap-2">
                    <button className="rounded border border-zinc-700 px-2 py-1 hover:bg-zinc-800" onClick={() => setEditing(a)}>
                      Edit
                    </button>
                    <button
                      className="rounded border border-rose-700 text-rose-200 px-2 py-1 hover:bg-rose-900/40 disabled:opacity-50"
                      onClick={() => deleteAsset(a.id)}
                      disabled={busyId === a.id}
                    >
                      {busyId === a.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-sm text-zinc-500" colSpan={7}>
                  No assets match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AddAssetModal open={openAdd} onClose={() => setOpenAdd(false)} onCreated={onCreated} />
      <EditAssetModal open={!!editing} onClose={() => setEditing(null)} asset={editing} onUpdated={onUpdated} />
    </div>
  );
}

/*************************
 * Placeholder Views
 *************************/
function DashboardView() { return <div className="p-4 text-zinc-400">Dashboard (coming soon)</div>; }
function InspectionsView() { return <div className="p-4 text-zinc-400">Inspections (coming soon)</div>; }
function PMView() { return <div className="p-4 text-zinc-400">Preventive Maintenance (coming soon)</div>; }
function WorkOrdersView() { return <div className="p-4 text-zinc-400">Work Orders (coming soon)</div>; }
function SettingsView() { return <div className="p-4 text-zinc-400">Settings (coming soon)</div>; }

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
        <div className="mt-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none"
          />
        </div>
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
