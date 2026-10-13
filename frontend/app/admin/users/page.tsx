"use client";
import { useState, useEffect } from "react";
import { Loader } from "@/components/motion/loader";

function truncate(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function deleteUser(user: any) {
    const label = user.login || user.email || user.id;
    if (!window.confirm(`Delete user ${label}? Their wallets, sessions and settings are removed. On-chain tip history is preserved.`)) return;
    setDeleting(user.id);
    try {
      const r = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const j = await r.json();
      if (!j.ok) {
        alert(j.error || "Delete failed");
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch {
      alert("Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.login?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.wallets.some((w: any) => w.address.toLowerCase().includes(q))
    );
  });

  if (loading) return <div className="py-20 flex justify-center"><Loader variant="spinner" size={24} /></div>;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl tracking-tight">Users</h1>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by login, email, or wallet..."
        className="w-full max-w-sm border border-border bg-background rounded-[10px] px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-accent"
      />

      <div className="overflow-x-auto rounded-[10px] border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">User</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Wallet(s)</th>
              <th className="text-right px-4 py-2 font-medium text-muted-foreground">Tips sent</th>
              <th className="text-right px-4 py-2 font-medium text-muted-foreground">Joined</th>
              <th className="text-right px-4 py-2 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2">
                  <div className="text-xs font-medium">{user.login || user.email || "—"}</div>
                </td>
                <td className="px-4 py-2">
                  {user.wallets.length === 0 ? (
                    <span className="text-xs text-muted-foreground">No wallet</span>
                  ) : (
                    user.wallets.map((w: any) => (
                      <div key={w.address} className="font-mono text-xs">{truncate(w.address)}</div>
                    ))
                  )}
                </td>
                <td className="px-4 py-2 text-right stats text-xs">{user.tipsReceived}</td>
                <td className="px-4 py-2 text-right text-xs text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => deleteUser(user)}
                    disabled={deleting === user.id}
                    className="text-xs text-destructive hover:underline disabled:opacity-50"
                  >
                    {deleting === user.id ? "Deleting..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
