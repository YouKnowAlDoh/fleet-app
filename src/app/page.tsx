'use client';

import React, { useMemo, useState } from "react";

/**
 * Fleet Manager UI — Mock (React)
 * Fixes:
 * - Removed a duplicated JSX block that caused "return outside of function" (dangling code after AssetsView)
 * - Added a VIN Decoder modal (NHTSA VPIC) wired to the mock
 * - Replaced random inventory counts to avoid SSR hydration mismatch
 * - Added a lightweight in-app Test Runner so we have concrete test cases
 */

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

function NavButton({ label, active, onClick, emoji }: { label: string; active?: boolean; onClick: () => void; emoji?: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-zinc-800/70 ${
        active ? "bg-zinc-800 text-white" : "text-zinc-300"
      }`}
    >
      <span className="text-lg leading-none">{emoji || "•"}</span>
      <span className="font-medium">{label}</span>
    </button>
  );
}

/*************************
 * Mock Data (deterministic)
 *************************/
const MOCK_ASSETS = [
  { id: "A-101", code: "85", name: "F-550 Truck", type: "Truck", status: "ACTIVE", meter: 128442, pmDue: "750 mi", location: "Yard 3" },
  { id: "A-102", code: "25400", name: "Case 621G", type: " Front End Loader", status: "IN_SHOP", meter: 6402, pmDue: "Due now", location: "Shop" },
  { id: "A-103", code: "25250", name: "Case SV280B", type: "Skid Steer", status: "ACTIVE", meter: 3121, pmDue: "120 hrs", location: "Route 12" },
  { id: "A-104", code: "PL-22", name: "Western Wide-Out Plow", type: "Attachment", status: "ACTIVE", meter: 0, pmDue: "—", location: "Yard 1" },
  { id: "A-105", code: "SLT-9", name: "SaltDogg 2yd", type: "Salter", status: "OUT_OF_SERVICE", meter: 0, pmDue: "—", location: "Shop" },
];

const MOCK_PM = [
  { id: "PM-1", asset: "F-550 Flatbed", template: "Oil & Filter", dueIn: -150, unit: "mi", priority: "HIGH" },
  { id: "PM-2", asset: "Case 621G", template: "Hydraulic Service", dueIn: 12, unit: "hrs", priority: "MEDIUM" },
  { id: "PM-3", asset: "Case SV280B", template: "Grease Points", dueIn: 4, unit: "hrs", priority: "LOW" },
];

const MOCK_WOS = [
  { number: "WO-10045", asset: "F-550 Flatbed", status: "OPEN", priority: "HIGH", tasks: 3, eta: "Aug 20" },
  { number: "WO-10046", asset: "Case 621G", status: "IN_PROGRESS", priority: "CRITICAL", tasks: 5, eta: "Aug 19" },
  { number: "WO-10047", asset: "International 4300", status: "ON_HOLD", priority: "MEDIUM", tasks: 2, eta: "Aug 22" },
];

const MOCK_INSPECTIONS = [
  { id: "DVIR-4412", asset: "F-550 Flatbed", driver: "T. Kuykendall", result: "FAIL", time: "Today 08:14" },
  { id: "DVIR-4413", asset: "Case SV280B", driver: "A. Ruby", result: "PASS", time: "Today 06:55" },
  { id: "DVIR-4410", asset: "Case 621G", driver: "J. Lumb", result: "PASS", time: "Yesterday 18:22" },
];

const MOCK_PARTS = [
  { name: "Oil Filter", onHand: 12 },
  { name: "Top Strobe Light", onHand: 5 },
  { name: "Steer Tires", onHand: 6 },
];

/*************************
 * VIN Decoder Modal (NHTSA VPIC)
 *************************/
function AddAssetModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [vin, setVin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
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
      const data = await res.json();
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

  function onChange<K extends keyof typeof form>(key: K, value: any) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function save() {
    // In the mock we just log; in the real app this will POST to /api/assets
    console.log("Create Asset", form);
    onClose();
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-200">Add Asset</h3>
          <button onClick={onClose} className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800">Close</button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="text-xs text-zinc-400">VIN</label>
            <div className="mt-1 flex gap-2">
              <input value={vin} onChange={(e) => setVin(e.target.value.trim().toUpperCase())} placeholder="1FT..."
                     className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none" />
              <button onClick={decodeVIN} disabled={loading}
                      className="whitespace-nowrap rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-50">
                {loading ? "Decoding…" : "Decode VIN"}
              </button>
            </div>
            {error && <div className="mt-1 text-xs text-rose-400">{error}</div>}
          </div>
          <div>
            <label className="text-xs text-zinc-400">Unit Code</label>
            <input value={form.code} onChange={(e) => onChange("code", e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none" />
          </div>

          <div>
            <label className="text-xs text-zinc-400">Name</label>
            <input value={form.name} onChange={(e) => onChange("name", e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none" />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Type</label>
            <select value={form.assetType} onChange={(e) => onChange("assetType", e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none">
              {["Truck","Loader","Skid","Attachment","Trailer","Salter"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-400">Plate</label>
            <input value={form.plate} onChange={(e) => onChange("plate", e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none" />
          </div>

          <div>
            <label className="text-xs text-zinc-400">Year</label>
            <input value={form.year} onChange={(e) => onChange("year", e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none" />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Make</label>
            <input value={form.make} onChange={(e) => onChange("make", e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none" />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Model</label>
            <input value={form.model} onChange={(e) => onChange("model", e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none" />
          </div>
          <div>
            <label className="text-xs text-zinc-400">Meter Unit</label>
            <select value={form.meterUnit} onChange={(e) => onChange("meterUnit", e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none">
              {["MILES","HOURS"].map(t => <option key={t}>{t}</option>)}
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
 * Cards & Helpers
 *************************/
function StatCard({ title, value, sub, tone = "zinc" }: { title: string; value: string; sub?: string; tone?: string }) {
  const tones: Record<string, string> = {
    zinc: "bg-zinc-900 border-zinc-800",
    green: "bg-emerald-950/50 border-emerald-900/60",
    red: "bg-rose-950/50 border-rose-900/60",
    yellow: "bg-amber-950/50 border-amber-900/60",
    blue: "bg-sky-950/50 border-sky-900/60",
  };
  return (
    <div className={`rounded-2xl border p-4 ${tones[tone] || tones.zinc}`}>
      <div className="text-sm text-zinc-400">{title}</div>
      <div className="mt-1 text-3xl font-semibold text-zinc-100">{value}</div>
      {sub && <div className="mt-1 text-xs text-zinc-500">{sub}</div>}
    </div>
  );
}

function SectionCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide text-zinc-300">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function AssetStatusPill({ status }: { status: string }) {
  switch (status) {
    case "ACTIVE":
      return <Badge tone="green">Active</Badge>;
    case "IN_SHOP":
      return <Badge tone="yellow">In Shop</Badge>;
    case "OUT_OF_SERVICE":
      return <Badge tone="red">Out of Service</Badge>;
    case "RETIRED":
      return <Badge tone="gray">Retired</Badge>;
    default:
      return <Badge>Unknown</Badge>;
  }
}

function Topbar({ onSearch }: { onSearch: (s: string) => void }) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-zinc-800 bg-zinc-950/80 p-3 backdrop-blur">
      <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
        <span className="text-lg">🛠️</span>
        <span className="font-semibold text-zinc-100">Arctic — Fleet</span>
      </div>
      <div className="mx-2 hidden flex-1 items-center rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 md:flex">
        <span>🔎</span>
        <input onChange={(e) => onSearch(e.target.value)} placeholder="Search assets, WOs, drivers…" className="ml-2 w-full bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-500" />
      </div>
      <div className="ml-auto flex items-center gap-3">
        <button className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800">+ New WO</button>
        <button className="rounded-full border border-zinc-800 p-2 text-lg">⚙️</button>
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-500" />
      </div>
    </div>
  );
}

/*************************
 * Views
 *************************/
function DashboardView() {
  const active = MOCK_ASSETS.filter((a) => a.status === "ACTIVE").length;
  const inShop = MOCK_ASSETS.filter((a) => a.status === "IN_SHOP").length;
  const oos = MOCK_ASSETS.filter((a) => a.status === "OUT_OF_SERVICE").length;
  const pmDue = MOCK_PM.filter((p) => p.dueIn <= 0).length;
  const woOpen = MOCK_WOS.filter((w) => w.status !== "CLOSED").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <StatCard title="Active Assets" value={`${active}`} sub={`${inShop} in shop / ${oos} OOS`} tone="green" />
        <StatCard title="PM Due" value={`${pmDue}`} sub="Overdue or due now" tone="yellow" />
        <StatCard title="Open Work Orders" value={`${woOpen}`} tone="blue" />
        <StatCard title="DVIR Pass Rate" value={`92%`} sub="Last 7 days" />
        <StatCard title="Inventory Value" value="$38,240" sub="At average cost" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SectionCard title="PM Due Soon" action={<button className="text-xs text-sky-300 hover:underline">View all</button>}>
          <div className="divide-y divide-zinc-800">
            {MOCK_PM.map((pm) => (
              <div key={pm.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm text-zinc-200">{pm.asset}</div>
                  <div className="text-xs text-zinc-500">{pm.template}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={pm.dueIn <= 0 ? "red" : pm.dueIn < 20 ? "yellow" : "green"}>
                    {pm.dueIn <= 0 ? "Overdue" : `Due in ${pm.dueIn} ${pm.unit}`}
                  </Badge>
                  <button className="rounded-lg border border-zinc-700 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800">Create WO</button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Recent Inspections" action={<button className="text-xs text-sky-300 hover:underline">Open DVIR</button>}>
          <div className="divide-y divide-zinc-800">
            {MOCK_INSPECTIONS.map((i) => (
              <div key={i.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm text-zinc-200">{i.asset}</div>
                  <div className="text-xs text-zinc-500">{i.driver} • {i.time}</div>
                </div>
                <AssetStatusPill status={i.result === "PASS" ? "ACTIVE" : "OUT_OF_SERVICE"} />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Open Work Orders" action={<button className="text-xs text-sky-300 hover:underline">Work Orders</button>}>
          <div className="divide-y divide-zinc-800">
            {MOCK_WOS.map((w) => (
              <div key={w.number} className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm text-zinc-200">{w.number} • {w.asset}</div>
                  <div className="text-xs text-zinc-500">ETA {w.eta}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={w.status === "IN_PROGRESS" ? "blue" : w.status === "ON_HOLD" ? "yellow" : "zinc"}>{w.status.replace("_", " ")}</Badge>
                  <Badge tone={w.priority === "CRITICAL" ? "red" : w.priority === "HIGH" ? "yellow" : "zinc"}>{w.priority}</Badge>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function AssetsView({ search }: { search: string }) {
  const [openAdd, setOpenAdd] = useState(false);
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return MOCK_ASSETS.filter((a) => [a.code, a.name, a.type, a.location].join(" ").toLowerCase().includes(q));
  }, [search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Assets</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setOpenAdd(true)} className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800">+ New Asset</button>
          <button className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800">Scan QR</button>
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
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-zinc-400">PM</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-zinc-400">Location</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filtered.map((a) => (
              <tr key={a.id} className="hover:bg-zinc-900/40">
                <td className="px-4 py-2 text-sm text-zinc-300">{a.code}</td>
                <td className="px-4 py-2 text-sm text-zinc-100">{a.name}</td>
                <td className="px-4 py-2 text-sm text-zinc-300">{a.type}</td>
                <td className="px-4 py-2"><AssetStatusPill status={a.status} /></td>
                <td className="px-4 py-2 text-sm text-zinc-300">{a.meter?.toLocaleString()} {a.type === "Loader" || a.type === "Skid" ? "hrs" : "mi"}</td>
                <td className="px-4 py-2 text-sm text-zinc-300">{a.pmDue}</td>
                <td className="px-4 py-2 text-sm text-zinc-300">{a.location}</td>
                <td className="px-4 py-2 text-right">
                  <button className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800">Open</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AddAssetModal open={openAdd} onClose={() => setOpenAdd(false)} />
    </div>
  );
}

function InspectionsView() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Inspections / DVIR</h2>
        <div className="flex items-center gap-2">
          <button className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800">+ New Form</button>
          <button className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800">Open Driver PWA</button>
        </div>
      </div>

      <SectionCard title="Recent Submissions">
        <div className="divide-y divide-zinc-800">
          {MOCK_INSPECTIONS.map((i) => (
            <div key={i.id} className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm text-zinc-200">{i.id} • {i.asset}</div>
                <div className="text-xs text-zinc-500">{i.driver} • {i.time}</div>
              </div>
              <Badge tone={i.result === "PASS" ? "green" : "red"}>{i.result}</Badge>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Forms">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            { name: "Pre‑Trip (Truck)", items: 28 },
            { name: "Loader Daily", items: 18 },
            { name: "Skid Steer Daily", items: 16 },
          ].map((f) => (
            <div key={f.name} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
              <div className="text-sm font-medium text-zinc-200">{f.name}</div>
              <div className="text-xs text-zinc-500">{f.items} items • requires signature</div>
              <div className="mt-3 flex items-center gap-2">
                <button className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800">Preview</button>
                <button className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800">Duplicate</button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function PMView() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Preventive Maintenance</h2>
        <div className="flex items-center gap-2">
          <button className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800">+ Service Template</button>
          <button className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800">PM Settings</button>
        </div>
      </div>

      <SectionCard title="Due / Overdue">
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-900/60">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-zinc-400">Asset</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-zinc-400">Template</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-zinc-400">Due</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-zinc-400">Priority</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {MOCK_PM.map((pm) => (
                <tr key={pm.id} className="hover:bg-zinc-900/40">
                  <td className="px-4 py-2 text-sm text-zinc-200">{pm.asset}</td>
                  <td className="px-4 py-2 text-sm text-zinc-300">{pm.template}</td>
                  <td className="px-4 py-2 text-sm text-zinc-300">{pm.dueIn <= 0 ? "Overdue" : `In ${pm.dueIn} ${pm.unit}`}</td>
                  <td className="px-4 py-2"><Badge tone={pm.priority === "HIGH" ? "yellow" : pm.priority === "CRITICAL" ? "red" : "zinc"}>{pm.priority}</Badge></td>
                  <td className="px-4 py-2 text-right">
                    <button className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800">Create WO</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

function WorkOrdersView() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Work Orders</h2>
        <button className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800">+ New Work Order</button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-zinc-800">
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-zinc-900/60">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-zinc-400">WO #</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-zinc-400">Asset</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-zinc-400">Status</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-zinc-400">Priority</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-zinc-400">Tasks</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-zinc-400">ETA</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {MOCK_WOS.map((w) => (
              <tr key={w.number} className="hover:bg-zinc-900/40">
                <td className="px-4 py-2 text-sm text-zinc-300">{w.number}</td>
                <td className="px-4 py-2 text-sm text-zinc-200">{w.asset}</td>
                <td className="px-4 py-2"><Badge tone={w.status === "IN_PROGRESS" ? "blue" : w.status === "ON_HOLD" ? "yellow" : "zinc"}>{w.status.replace("_", " ")}</Badge></td>
                <td className="px-4 py-2"><Badge tone={w.priority === "CRITICAL" ? "red" : w.priority === "HIGH" ? "yellow" : "zinc"}>{w.priority}</Badge></td>
                <td className="px-4 py-2 text-sm text-zinc-300">{w.tasks}</td>
                <td className="px-4 py-2 text-sm text-zinc-300">{w.eta}</td>
                <td className="px-4 py-2 text-right"><button className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800">Open</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/*************************
 * Developer Test Runner (in-app tests)
 *************************/
function runTests() {
  const tests: { name: string; pass: boolean; info?: string }[] = [];

  // Test 1: Asset schema fields exist
  const required = ["id","code","name","type","status","meter","pmDue","location"];
  const hasAll = MOCK_ASSETS.every(a => required.every(k => Object.prototype.hasOwnProperty.call(a, k)));
  tests.push({ name: "Assets contain required fields", pass: hasAll });

  // Test 2: Search filter returns correct count for query "F-550"
  const q = "f-550";
  const filtered = MOCK_ASSETS.filter((a) => [a.code, a.name, a.type, a.location].join(" ").toLowerCase().includes(q)).length;
  tests.push({ name: 'Search("F-550") finds 1 asset', pass: filtered === 1, info: `got ${filtered}` });

  // Test 3: PM overdue detection
  const overdueCount = MOCK_PM.filter(p => p.dueIn <= 0).length;
  tests.push({ name: "PM overdue count computed", pass: overdueCount === 1, info: `got ${overdueCount}` });

  // Test 4: VIN decoder function exists (modal)
  tests.push({ name: "VIN decoder modal present", pass: typeof AddAssetModal === "function" });

  return tests;
}

function TestsPanel() {
  const tests = runTests();
  const allPass = tests.every(t => t.pass);
  return (
    <SectionCard title="Developer Tests" action={<Badge tone={allPass ? 'green' : 'red'}>{allPass ? 'ALL PASS' : 'FAIL'}</Badge>}>
      <ul className="space-y-1">
        {tests.map((t) => (
          <li key={t.name} className="flex items-center gap-2 text-sm">
            <Badge tone={t.pass ? 'green' : 'red'}>{t.pass ? 'PASS' : 'FAIL'}</Badge>
            <span className="text-zinc-200">{t.name}</span>
            {t.info && <span className="text-xs text-zinc-500">({t.info})</span>}
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

/*************************
 * App Shell
 *************************/
export default function FleetManagerUIMock() {
  const [route, setRoute] = useState("dashboard");
  const [search, setSearch] = useState("");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Topbar onSearch={setSearch} />
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-3 p-3 md:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="sticky top-16 h-[calc(100vh-5rem)] space-y-2 overflow-auto rounded-2xl border border-zinc-800 bg-zinc-900/40 p-2">
          <NavButton label="Dashboard" emoji="📊" active={route === "dashboard"} onClick={() => setRoute("dashboard")} />
          <NavButton label="Assets" emoji="🚚" active={route === "assets"} onClick={() => setRoute("assets")} />
          <NavButton label="Inspections" emoji="🧾" active={route === "inspections"} onClick={() => setRoute("inspections")} />
          <NavButton label="PM" emoji="⏰" active={route === "pm"} onClick={() => setRoute("pm")} />
          <NavButton label="Work Orders" emoji="🛠️" active={route === "wos"} onClick={() => setRoute("wos")} />
          <NavButton label="Parts/Inventory" emoji="📦" active={route === "parts"} onClick={() => setRoute("parts")} />
          <NavButton label="Drivers" emoji="👷" active={route === "drivers"} onClick={() => setRoute("drivers")} />
          <div className="my-2 border-t border-zinc-800" />
          <NavButton label="Settings" emoji="⚙️" active={route === "settings"} onClick={() => setRoute("settings")} />
        </aside>

        {/* Main */}
        <main className="space-y-4">
          {route === "dashboard" && <DashboardView />}
          {route === "assets" && <AssetsView search={search} />}
          {route === "inspections" && <InspectionsView />}
          {route === "pm" && <PMView />}
          {route === "wos" && <WorkOrdersView />}

          {route === "parts" && (
            <SectionCard title="Parts & Inventory">
              <p className="text-sm text-zinc-400">Static mock. In the real app, you’ll see bins, SKUs, min/max, and a scan‑to‑WO flow.</p>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                {MOCK_PARTS.map((p) => (
                  <div key={p.name} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                    <div className="text-sm text-zinc-200">{p.name}</div>
                    <div className="text-xs text-zinc-500">On hand: {p.onHand}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <button className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800">Issue</button>
                      <button className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-800">Receive</button>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {route === "drivers" && (
            <SectionCard title="Drivers">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {["J. Smith", "M. Lopez", "T. Bennett", "A. Patel"].map((d) => (
                  <div key={d} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                    <div className="text-sm font-medium text-zinc-200">{d}</div>
                    <div className="text-xs text-zinc-500">Status • Active</div>
                    <div className="mt-2">
                      <Badge>0 incidents</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {route === "settings" && (
            <>
              <SectionCard title="Settings">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                    <div className="text-sm font-medium text-zinc-200">Organization</div>
                    <p className="mt-1 text-xs text-zinc-500">Users, roles, and permissions.</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                    <div className="text-sm font-medium text-zinc-200">Integrations</div>
                    <p className="mt-1 text-xs text-zinc-500">Telematics, email, SMS.</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                    <div className="text-sm font-medium text-zinc-200">PM Policies</div>
                    <p className="mt-1 text-xs text-zinc-500">Intervals, buffers, reminders.</p>
                  </div>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                    <div className="text-sm font-medium text-zinc-200">DVIR Settings</div>
                    <p className="mt-1 text-xs text-zinc-500">Forms, signatures, OOS rules.</p>
                  </div>
                </div>
              </SectionCard>

              {/* Developer test panel */}
              <TestsPanel />
            </>
          )}
        </main>
      </div>
    </div>
  );
}
