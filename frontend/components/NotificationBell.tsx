"use client";
import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function NotificationBell() {
  const { data: session } = useSession();
  const [count, setCount] = useState(0);
  const userId = (session?.user as any)?.id;

  useEffect(() => {
    if (!userId) return;
    fetch("/api/notifications/history")
      .then((r) => r.json())
      .then((j) => {
        const unread = j.notifications?.filter((n: any) => !n.read).length ?? 0;
        setCount(unread);
      })
      .catch(() => {});
  }, [userId]);

  if (!userId) return null;

  return (
    <Link href="/notifications" className="relative p-1 hover:opacity-80 transition-opacity" aria-label="Notifications">
      <Bell className="w-5 h-5 text-foreground/80" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
