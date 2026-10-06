#!/usr/bin/env bash
# Start the local verification instance: Postgres, migrations, fixture seed,
# and `next dev` on 127.0.0.1:3000. Records PIDs in /tmp/opentip-verify/state.json.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
STATE_DIR="/tmp/opentip-verify"
STATE="$STATE_DIR/state.json"
LOG="$STATE_DIR/next.log"
ENV_FILE="$ROOT/frontend/.env.local"
PORT=3000
mkdir -p "$STATE_DIR"

if ! command -v pg_isready >/dev/null 2>&1; then
  sudo DEBIAN_FRONTEND=noninteractive apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql postgresql-contrib
fi

started_postgres=0
postgres_pid=""
if [[ -f "$STATE" ]]; then
  started_postgres="$(node -e 'const s=require(process.argv[1]); process.stdout.write(s.startedPostgres?"1":"0")' "$STATE")"
  postgres_pid="$(node -e 'const s=require(process.argv[1]); process.stdout.write(s.postgresPid?String(s.postgresPid):"")' "$STATE")"
fi
if pg_isready -h 127.0.0.1 -p 5432 >/dev/null 2>&1; then
  echo "postgres already accepting connections on 127.0.0.1:5432"
else
  sudo service postgresql start
  for _ in $(seq 1 30); do
    if pg_isready -h 127.0.0.1 -p 5432 >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
  pg_isready -h 127.0.0.1 -p 5432
  started_postgres=1
  pidfile="$(ls /var/lib/postgresql/*/main/postmaster.pid | head -1)"
  postgres_pid="$(head -1 "$pidfile")"
  echo "started postgres postmaster pid $postgres_pid"
fi

sudo -u postgres psql -v ON_ERROR_STOP=1 -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'opentip') THEN CREATE ROLE opentip LOGIN PASSWORD 'opentip'; END IF; END \$\$;"
if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname = 'opentip'" | grep -q 1; then
  sudo -u postgres createdb -O opentip opentip
fi

if [[ -f "$ENV_FILE" ]] && ! head -1 "$ENV_FILE" | grep -q "OPENTIP_VERIFY_SCAFFOLDING"; then
  echo "Refusing to overwrite $ENV_FILE (it is not verification scaffolding)." >&2
  exit 1
fi

cat > "$ENV_FILE" <<'EOF'
# OPENTIP_VERIFY_SCAFFOLDING — local verification only. Not production secrets.
DATABASE_URL=postgresql://opentip:opentip@127.0.0.1:5432/opentip
NEXTAUTH_SECRET=opentip-verify-local-only
NEXTAUTH_URL=http://127.0.0.1:3000
NEXT_PUBLIC_CHAIN=baseSepolia
NEXT_PUBLIC_CDP_PROJECT_ID=00000000-0000-4000-8000-000000000000
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=00000000000000000000000000000000
NEXT_PUBLIC_BASE_SEPOLIA_CONTRACT=0xeD13dB8234d437771e115419BF7498Ddef90Dc8D
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
RPC_URL=https://sepolia.base.org
GITHUB_ID=
GITHUB_SECRET=
RESEND_API_KEY=
GROQ_API_KEY=
EOF

if [[ ! -x "$ROOT/node_modules/.bin/next" ]]; then
  (cd "$ROOT" && npm install)
fi
if [[ ! -d "$ROOT/node_modules/@prisma/client" ]]; then
  (cd "$ROOT/frontend" && npx prisma generate)
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

# migrate deploy cannot build a fresh database: Claim, WalletTx, UserPolicy,
# Notification, NotificationSubscription, and SponsoredTx have no CREATE TABLE
# in frontend/prisma/migrations, and 20261006140000 alters NotificationSubscription.
# db push follows schema.prisma. This URL is the local verification database only.
(cd "$ROOT/frontend" && npx prisma db push --skip-generate --accept-data-loss)
(cd "$ROOT" && node .cursor/skills/verify-opentip/seed.mjs)

reuse=0
if [[ -f "$STATE" ]]; then
  old_pid="$(node -e 'const s=require(process.argv[1]); process.stdout.write(String(s.nextPid||""))' "$STATE")"
  if [[ -n "$old_pid" ]] && kill -0 "$old_pid" 2>/dev/null; then
    reuse=1
    echo "reusing next pid $old_pid"
  fi
fi

if [[ "$reuse" -eq 0 ]]; then
  if node --input-type=module -e "try{await fetch('http://127.0.0.1:${PORT}/'); process.exit(0)}catch{process.exit(1)}"; then
    echo "port ${PORT} is already open and is not the recorded verification server. Stop that process yourself; launch.sh will not kill it." >&2
    exit 1
  fi
  (
    cd "$ROOT/frontend"
    nohup npm run dev -- --hostname 127.0.0.1 --port "$PORT" > "$LOG" 2>&1 &
    echo $! > "$STATE_DIR/next.pid"
  )
  next_pid="$(cat "$STATE_DIR/next.pid")"
else
  next_pid="$old_pid"
  echo "$next_pid" > "$STATE_DIR/next.pid"
fi
node -e 'const fs=require("fs"); fs.writeFileSync(process.argv[1], JSON.stringify({nextPid:Number(process.argv[2]), postgresPid:process.argv[3]?Number(process.argv[3]):null, startedPostgres:process.argv[4]==="1", port:Number(process.argv[5]), log:process.argv[6]}, null, 2)+"\n")' \
  "$STATE" "$next_pid" "$postgres_pid" "$started_postgres" "$PORT" "$LOG"

for _ in $(seq 1 90); do
  if node --input-type=module -e '
    const r = await fetch("http://127.0.0.1:3000/docs");
    const t = await r.text();
    process.exit(r.status === 200 && t.includes("Documentation") ? 0 : 1);
  '; then
    echo "READY http://127.0.0.1:${PORT}"
    exit 0
  fi
  if ! kill -0 "$next_pid" 2>/dev/null; then
    echo "next exited before it was ready. Log:" >&2
    tail -40 "$LOG" >&2 || true
    exit 1
  fi
  sleep 2
done

echo "timed out waiting for /docs. Log:" >&2
tail -40 "$LOG" >&2 || true
exit 1
