#!/usr/bin/env bash
set -euo pipefail

# Starts local Postgres when Docker or a system install is available.
# Default credentials match .env.example (dev only).

DB_NAME="${POSTGRES_DB:-salon}"
DB_USER="${POSTGRES_USER:-salon}"
DB_PASS="${POSTGRES_PASSWORD:-salon}"
DB_HOST="${POSTGRES_HOST:-127.0.0.1}"
DB_PORT="${POSTGRES_PORT:-5432}"

ready() {
  if command -v pg_isready >/dev/null 2>&1; then
    pg_isready -h "$DB_HOST" -p "$DB_PORT" >/dev/null 2>&1
    return
  fi
  (exec 3<>"/dev/tcp/$DB_HOST/$DB_PORT") >/dev/null 2>&1
}

if ready; then
  echo "Postgres already running on ${DB_HOST}:${DB_PORT}"
  exit 0
fi

if command -v docker >/dev/null 2>&1; then
  echo "Starting Postgres with Docker Compose"
  docker compose up -d postgres
  for _ in $(seq 1 40); do
    if ready; then
      echo "Postgres is ready (docker)"
      exit 0
    fi
    sleep 1
  done
  echo "Docker Postgres did not become ready" >&2
  exit 1
fi

if command -v apt-get >/dev/null 2>&1; then
  echo "Installing system PostgreSQL"
  sudo apt-get update -y
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql postgresql-contrib
  sudo service postgresql start || sudo pg_ctlcluster 16 main start || sudo pg_ctlcluster 14 main start || true
  sleep 2

  sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}';
  ELSE
    ALTER ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASS}';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
SQL

  # Allow password auth from localhost for the app user.
  PG_HBA="$(sudo -u postgres psql -tA -c "SHOW hba_file;")"
  if [ -n "$PG_HBA" ] && ! sudo grep -q "salon salon" "$PG_HBA"; then
    echo "host    ${DB_NAME}    ${DB_USER}    127.0.0.1/32    scram-sha-256" | sudo tee -a "$PG_HBA" >/dev/null
    echo "host    ${DB_NAME}    ${DB_USER}    ::1/128         scram-sha-256" | sudo tee -a "$PG_HBA" >/dev/null
    sudo service postgresql reload || true
  fi

  for _ in $(seq 1 20); do
    if ready; then
      echo "Postgres is ready (system)"
      exit 0
    fi
    sleep 1
  done
  echo "System Postgres did not become ready" >&2
  exit 1
fi

echo "No Docker or apt-get Postgres available" >&2
exit 1
