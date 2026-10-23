"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/motion/button";
import { Loader } from "@/components/motion/loader";
import { useToast } from "@/app/providers";

function truncate(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function AdminAdmins() {
  const { showToast, dismissToast } = useToast();
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAddress, setNewAddress] = useState("");
  const [newRole, setNewRole] = useState("admin");
  const [adding, setAdding] = useState(false);
  const [ownerAddress, setOwnerAddress] = useState("");

  const fetchAdmins = () => {
    fetch("/api/admin/admins")
      .then((r) => r.json())
      .then(setAdmins)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAdmins();
    setOwnerAddress(process.env.NEXT_PUBLIC_OWNER_ADDRESS || "");
  }, []);

  const handleAdd = async () => {
    if (!newAddress) return;
    setAdding(true);
    const toastId = showToast({ status: "loading", title: "Adding admin...", duration: 0 });
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: newAddress, role: newRole }),
      });
      const j = await res.json();
      dismissToast(toastId);
      if (j.ok || j.id) {
        showToast({ status: "success", title: "Admin added" });
        setNewAddress("");
        fetchAdmins();
      } else {
        showToast({ status: "error", title: "Failed", description: j.error });
      }
    } catch (e: any) {
      dismissToast(toastId);
      showToast({ status: "error", title: "Failed", description: e.message });
    }
    setAdding(false);
  };

  const handleRemove = async (address: string) => {
    const toastId = showToast({ status: "loading", title: "Removing admin...", duration: 0 });
    try {
      const res = await fetch(`/api/admin/admins/${address}`, { method: "DELETE" });
      const j = await res.json();
      dismissToast(toastId);
      if (j.ok) {
        showToast({ status: "success", title: "Admin removed" });
        fetchAdmins();
      } else {
        showToast({ status: "error", title: "Failed", description: j.error });
      }
    } catch (e: any) {
      dismissToast(toastId);
      showToast({ status: "error", title: "Failed", description: e.message });
    }
  };

  if (loading) return <div className="py-20 flex justify-center"><Loader variant="spinner" size={24} /></div>;

  return (
    <div className="space-y-8 max-w-lg">
      <h1 className="font-display text-3xl tracking-tight">Admins</h1>

      {/* Owner (hardcoded, not in DB) */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Owner</h2>
        <div className="rounded-[10px] border border-border bg-card p-4">
          <div className="font-mono text-sm text-foreground">{ownerAddress || "Set OWNER_ADDRESS in .env"}</div>
          <div className="text-xs text-muted-foreground mt-1">Cannot be removed. Has full access.</div>
        </div>
      </section>

      <div className="border-t border-border" />

      {/* Add admin */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Add admin</h2>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-muted-foreground mb-1">Wallet address</label>
            <input
              type="text"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="0x..."
              className="w-full border border-border bg-background rounded-[10px] px-3 py-1.5 text-sm text-foreground font-mono placeholder:text-muted-foreground outline-none focus:border-accent"
            />
          </div>
          <div className="w-28">
            <label className="block text-xs text-muted-foreground mb-1">Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full border border-border bg-background rounded-[10px] px-3 py-1.5 text-sm text-foreground outline-none"
            >
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <Button onClick={handleAdd} disabled={adding || !newAddress}>
            {adding ? "Adding..." : "Add"}
          </Button>
        </div>
      </section>

      <div className="border-t border-border" />

      {/* Admin list */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Current admins</h2>
        {admins.length === 0 ? (
          <p className="text-sm text-muted-foreground">No admins added yet</p>
        ) : (
          <div className="overflow-hidden rounded-[10px] border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Address</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Role</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Added</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 font-mono text-xs">{truncate(admin.address)}</td>
                    <td className="px-4 py-2 text-xs">{admin.role}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(admin.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleRemove(admin.address)}>
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
