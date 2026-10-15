import assert from "node:assert/strict";
import test from "node:test";
import { directoryItemForSort, resolveRepoIcon, type DirectorySort } from "./repo-icon.ts";

const shield = {
  repo_id: "acme/shield",
  payout_address: "0x2222222222222222222222222222222222222222",
  registered_at: "2026-10-01T00:00:00.000Z",
  icon: " https://cdn.example/shield.png ",
};

const sorts: DirectorySort[] = ["recent", "tipped", "tips"];

test("the icon is the same across sorts and search", () => {
  const stats = { total_tipped: "25000000", tip_count: 1, tipped_usd: 25 };
  const icons = sorts.map((sort) => directoryItemForSort(shield, sort, stats).icon);
  assert.deepEqual(icons, [
    "https://cdn.example/shield.png",
    "https://cdn.example/shield.png",
    "https://cdn.example/shield.png",
  ]);

  const searched = directoryItemForSort(shield, "recent", { total_tipped: "0", tip_count: 0 });
  assert.equal(searched.icon, icons[0]);

  const plain = { ...shield, icon: null as string | null };
  const plainIcons = sorts.map((sort) => directoryItemForSort(plain, sort, stats).icon);
  assert.deepEqual(plainIcons, [null, null, null]);
});

test("resolveRepoIcon prefers a custom logo, then the developer picture, then a letter", () => {
  const pfp = "https://avatars.githubusercontent.com/u/1";
  assert.deepEqual(resolveRepoIcon({ logo: "/Opentip.png", developerPfp: pfp, name: "shield" }), {
    kind: "image",
    src: "/Opentip.png",
  });
  assert.deepEqual(resolveRepoIcon({ logo: "  ", developerPfp: pfp, name: "shield" }), {
    kind: "image",
    src: pfp,
  });
  assert.deepEqual(resolveRepoIcon({ logo: null, developerPfp: null, name: "shield" }), {
    kind: "letter",
    letter: "S",
  });
});
