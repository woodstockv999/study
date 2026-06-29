"use client";

import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, Area, AreaChart,
} from "recharts";
import type { FinancialSnapshot } from "@/lib/types";

interface Props { data: FinancialSnapshot[] }

function toOku(v: number) { return Math.round(v / 100) / 10; }

const C = { sales: "#0D1B2A", opIncome: "#C62828", netIncome: "#4A6FA5", assets: "#78716C", equity: "#15803D" };

function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-navy text-white text-xs rounded-lg shadow-xl p-3 border border-navy-mid min-w-[160px]">
      <p className="font-bold mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-3">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-mono">{Number(p.value).toLocaleString()}億円</span>
        </div>
      ))}
    </div>
  );
}

export function PLChart({ data }: Props) {
  const d = data.map((s) => ({ name: s.fiscalYear, "売上高": toOku(s.netSales), "営業利益": toOku(s.operatingIncome), "純利益": toOku(s.netIncome) }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={d} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E7E2D8" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#78716C" }} />
        <YAxis tick={{ fontSize: 10, fill: "#78716C" }} tickFormatter={(v) => `${v}億`} />
        <Tooltip content={<Tip />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="売上高" fill={C.sales} radius={[2,2,0,0]} opacity={0.85} />
        <Line dataKey="営業利益" stroke={C.opIncome} strokeWidth={2.5} dot={{ r: 3 }} />
        <Line dataKey="純利益" stroke={C.netIncome} strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function BSChart({ data }: Props) {
  const d = data.map((s) => ({ name: s.fiscalYear, "総資産": toOku(s.totalAssets), "純資産": toOku(s.equity) }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={d} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="gAssets" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={C.assets} stopOpacity={0.3} /><stop offset="95%" stopColor={C.assets} stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="gEquity" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={C.equity} stopOpacity={0.4} /><stop offset="95%" stopColor={C.equity} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E7E2D8" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#78716C" }} />
        <YAxis tick={{ fontSize: 10, fill: "#78716C" }} tickFormatter={(v) => `${v}億`} />
        <Tooltip content={<Tip />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Area type="monotone" dataKey="総資産" stroke={C.assets} fill="url(#gAssets)" strokeWidth={2} />
        <Area type="monotone" dataKey="純資産" stroke={C.equity} fill="url(#gEquity)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MarginChart({ data }: Props) {
  const d = data.map((s) => ({ name: s.fiscalYear, "営業利益率(%)": s.operatingMargin ?? 0, "ROE(%)": s.roe ?? 0 }));
  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={d} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E7E2D8" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#78716C" }} />
        <YAxis tick={{ fontSize: 10, fill: "#78716C" }} tickFormatter={(v) => `${v}%`} />
        <Tooltip formatter={(v: any) => `${Number(v).toFixed(1)}%`} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Line dataKey="営業利益率(%)" stroke={C.opIncome} strokeWidth={2.5} dot={{ r: 3 }} />
        <Line dataKey="ROE(%)" stroke={C.netIncome} strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
