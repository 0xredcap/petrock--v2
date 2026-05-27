"use client";

import { useWallet } from "@/lib/wallet/wallet-connect";

export default function ConnectWallet() {
  const { accountId, network, isConnecting, connect, disconnect } = useWallet();

  if (accountId) {
    return (
      <div className="flex items-center gap-2">
        {network === "mainnet" && (
          <span className="text-xs text-red-400 font-mono">⚠ mainnet</span>
        )}
        <span className="text-xs font-mono text-emerald-400">{accountId}</span>
        <button
          onClick={disconnect}
          className="text-xs font-mono text-slate-500 hover:text-slate-300 transition-colors"
        >
          disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={isConnecting}
      className="text-xs font-mono px-2 py-1 border border-emerald-600 text-emerald-400 hover:bg-emerald-900/30 transition-colors disabled:opacity-50"
    >
      {isConnecting ? "connecting…" : "Connect HashPack"}
    </button>
  );
}
