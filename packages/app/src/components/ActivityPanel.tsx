"use client";

import type { ActivityEntry } from "./Chat";
import type { PetStats } from "@/lib/hedera/stats";
import { formatHbarWithUsd } from "@/lib/format";

interface ActivityPanelProps {
  entries: ActivityEntry[];
  stats?: PetStats;
  serial?: number;
  topicId?: string;
  hbarPrice?: number | null;
}

function StatBar({ label, value, distressed }: { label: string; value: number; distressed?: boolean }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = distressed
    ? "bg-red-600"
    : pct > 60
    ? "bg-emerald-500"
    : pct > 30
    ? "bg-yellow-500"
    : "bg-red-500";

  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      <span className="w-14 text-slate-400 shrink-0">{label}</span>
      <div className="flex-1 bg-slate-700 border border-slate-600 rounded h-3 overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-slate-300">{Math.round(pct)}</span>
    </div>
  );
}

export default function ActivityPanel({
  entries,
  stats,
  serial,
  topicId,
  hbarPrice,
}: ActivityPanelProps) {
  const recent = entries.slice(-3).reverse();
  const hashscanBase = "https://hashscan.io/testnet";

  const distressedReason = stats?.distressed?.reason;
  const graceUntil = stats?.distressed?.grace_until;

  return (
    <div className="h-full flex flex-col gap-3 p-3 font-mono text-xs overflow-y-auto">
      {/* HBAR price */}
      {hbarPrice != null && (
        <div className="text-slate-500 text-xs">
          HBAR: ${hbarPrice.toFixed(4)}
        </div>
      )}

      {/* Costs */}
      <div className="border border-slate-700 rounded p-2 space-y-1 text-slate-500">
        <div>Adopt: {formatHbarWithUsd(1, hbarPrice ?? null)}</div>
        <div>Feed/Play/Groom: {formatHbarWithUsd(0.5, hbarPrice ?? null)}</div>
        <div>Sleep: free</div>
      </div>

      {/* Pet stats */}
      {stats && serial ? (
        <div className="border-2 border-slate-600 rounded p-2 space-y-2">
          <div className="text-emerald-400 text-xs mb-1">
            Pet Rock #{serial} · {stats.alive ? "Alive" : "💀 Dead"}
          </div>
          <StatBar
            label="Hunger"
            value={stats.hunger}
            distressed={distressedReason === "low_hunger"}
          />
          <StatBar
            label="Mood"
            value={stats.mood}
            distressed={distressedReason === "low_mood"}
          />
          <StatBar
            label="Energy"
            value={stats.energy}
            distressed={distressedReason === "low_energy"}
          />
          {distressedReason && graceUntil && (
            <div className="text-red-400 text-xs mt-1">
              ⚠ Grace window until{" "}
              {new Date(graceUntil).toLocaleTimeString()}
            </div>
          )}
          {topicId && (
            <a
              href={`${hashscanBase}/topic/${topicId}`}
              target="_blank"
              rel="noreferrer"
              className="text-slate-500 hover:text-emerald-400 text-xs block truncate mt-1"
            >
              HCS: {topicId} ↗
            </a>
          )}
        </div>
      ) : (
        <div className="border-2 border-slate-700 rounded p-2 text-slate-500">
          No pet adopted yet.
        </div>
      )}

      {/* On-chain activity */}
      <div>
        <div className="text-slate-400 text-xs mb-1">Recent on-chain activity</div>
        {recent.length === 0 ? (
          <div className="text-slate-600 text-xs">No transactions yet.</div>
        ) : (
          <div className="space-y-1">
            {recent.map((entry, i) => (
              <div key={i} className="border border-slate-700 rounded p-1.5">
                <div className="text-slate-400">{entry.label}</div>
                {entry.type === "tx" ? (
                  <a
                    href={`${hashscanBase}/transaction/${encodeURIComponent(entry.id)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-500 hover:text-emerald-300 truncate block text-xs"
                  >
                    {entry.id.slice(0, 32)}... ↗
                  </a>
                ) : (
                  <span className="text-blue-400 truncate block text-xs">{entry.id}</span>
                )}
                <div className="text-slate-600 text-xs">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
