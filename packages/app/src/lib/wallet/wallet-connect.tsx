"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

export interface WalletState {
  accountId: string | null;
  network: "testnet" | "mainnet" | null;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletState>({
  accountId: null,
  network: null,
  isConnecting: false,
  connect: async () => {},
  disconnect: () => {},
});

export function useWallet(): WalletState {
  return useContext(WalletContext);
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [network, setNetwork] = useState<"testnet" | "mainnet" | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [dAppConnector, setDAppConnector] = useState<unknown>(null);

  // Restore from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("walletAccountId");
    const storedNetwork = localStorage.getItem("walletNetwork") as "testnet" | "mainnet" | null;
    if (stored && storedNetwork) {
      setAccountId(stored);
      setNetwork(storedNetwork);
    }
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const { DAppConnector, HederaSessionEvent, HederaChainId } =
        await import("@hashgraph/hedera-wallet-connect");
      const { LedgerId } = await import("@hashgraph/sdk");

      const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";
      const metadata = {
        name: "Pet Rock",
        description: "On-chain Tamagotchi on Hedera",
        url: process.env.NEXT_PUBLIC_APP_URL ?? "https://petrock.netlify.app",
        icons: [],
      };

      const connector = new DAppConnector(
        metadata,
        LedgerId.TESTNET,
        projectId,
        Object.values(HederaSessionEvent),
        [HederaChainId.Testnet]
      );

      await connector.init({ logger: "error" });
      setDAppConnector(connector);

      const session = await connector.openModal();
      // Extract account ID from the session
      // The session contains namespaces with accounts like "hedera:testnet:0.0.12345"
      const accounts =
        (session as { namespaces?: { hedera?: { accounts?: string[] } } })
          ?.namespaces?.hedera?.accounts ?? [];
      const raw = accounts[0] ?? "";
      const parts = raw.split(":");
      const connectedAccountId = parts[parts.length - 1] ?? null;
      const connectedNetwork = (parts[1] as "testnet" | "mainnet") ?? "testnet";

      if (connectedNetwork === "mainnet") {
        alert(
          "Pet Rock runs on Hedera testnet. Your HashPack appears to be set to mainnet. " +
          "Please switch to testnet in HashPack and try again."
        );
        await connector.disconnectAll().catch(() => {});
        return;
      }

      setAccountId(connectedAccountId);
      setNetwork(connectedNetwork);
      localStorage.setItem("walletAccountId", connectedAccountId ?? "");
      localStorage.setItem("walletNetwork", connectedNetwork);
    } catch (err) {
      console.error("[wallet] Connect failed:", err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (dAppConnector) {
      (dAppConnector as { disconnectAll: () => Promise<void> })
        .disconnectAll()
        .catch(() => {});
    }
    setAccountId(null);
    setNetwork(null);
    localStorage.removeItem("walletAccountId");
    localStorage.removeItem("walletNetwork");
  }, [dAppConnector]);

  return (
    <WalletContext.Provider
      value={{ accountId, network, isConnecting, connect, disconnect }}
    >
      {children}
    </WalletContext.Provider>
  );
}
