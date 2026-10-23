// Pure layout choices for the per-repo OG card. Satori wraps on spaces and
// hyphens, so a hard cap plus a break in any long unbroken run keeps a name
// inside the 328px card column.

const NAME_CAP = 36;
const URL_SIZES = [26, 22, 18, 16] as const;
const URL_MAX_PX = 480;
const MONO_ADVANCE = 0.6;

export function displayRepoName(repo: string): { text: string; fontSize: number } {
  const capitalized = repo.charAt(0).toUpperCase() + repo.slice(1);
  const visible = capitalized.length > NAME_CAP ? `${capitalized.slice(0, NAME_CAP - 1)}…` : capitalized;
  const fontSize = visible.length <= 12 ? 45 : visible.length <= 18 ? 40 : visible.length <= 26 ? 37 : visible.length <= 32 ? 32 : 28;
  return { text: breakLongRuns(visible), fontSize };
}

export function displayOwner(owner: string): string {
  const name = owner.trim();
  if (name.length <= 28) return name;
  return `${name.slice(0, 27)}…`;
}

export function displayRepoUrl(owner: string, repo: string): { text: string; fontSize: number } {
  const full = `opentip.tech/tip/${owner}/${repo}`;
  for (const fontSize of URL_SIZES) {
    if (full.length * fontSize * MONO_ADVANCE <= URL_MAX_PX) return { text: full, fontSize };
  }
  const fontSize = URL_SIZES[URL_SIZES.length - 1];
  const maxChars = Math.max(8, Math.floor(URL_MAX_PX / (fontSize * MONO_ADVANCE)));
  return { text: `${full.slice(0, maxChars - 1)}…`, fontSize };
}

export function amountFontSize(label: string): number {
  if (label.length <= 8) return 150;
  if (label.length <= 11) return 120;
  return 96;
}

function breakLongRuns(value: string): string {
  return value.replace(/[^\s\-…]+/g, (run) => {
    if (run.length <= 16) return run;
    const parts: string[] = [];
    for (let i = 0; i < run.length; i += 16) parts.push(run.slice(i, i + 16));
    return parts.join("\u200b");
  });
}
