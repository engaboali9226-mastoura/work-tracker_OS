#!/usr/bin/env bash
# Read-only local preflight. No credentials, project linking, or database access.
set -u
missing=0
for tool in brew supabase docker psql pg_dump; do
  if command -v "$tool" >/dev/null 2>&1; then
    printf '%s: AVAILABLE\n' "$tool"
  else
    printf '%s: MISSING\n' "$tool"
    if [ "$tool" != brew ]; then missing=1; fi
  fi
done
if command -v docker >/dev/null 2>&1; then
  # Don't accidentally contact a remote container engine.
  ctx=$(docker context show 2>/dev/null || true)
  endpoint=$(docker context inspect "$ctx" --format '{{.Endpoints.docker.Host}}' 2>/dev/null || true)
  if [ -n "${DOCKER_HOST:-}" ] || [ -n "${DOCKER_CONTEXT:-}" ]; then
    printf 'container_engine: OVERRIDE_CONFIGURED_REVIEW_LOCALLY\n'; missing=1
  elif [[ "$endpoint" == unix://* ]] && docker info >/dev/null 2>&1; then
    printf 'container_engine: LOCAL_READY\n'
  else
    printf 'container_engine: NOT_VERIFIED_LOCAL\n'; missing=1
  fi
else
  printf 'container_engine: MISSING\n'
fi
if [ "$(uname -s)" = Darwin ] && command -v fdesetup >/dev/null 2>&1; then
  if fdesetup status 2>/dev/null | grep -q '^FileVault is On\.'; then
    printf 'filevault: ON (backup destination still requires verification)\n'
  else
    printf 'filevault: NOT_VERIFIED\n'
  fi
fi
if [ "$missing" -eq 0 ]; then
  printf 'R386_LOCAL_TOOLS_READY (not backup or restore evidence)\n'
else
  printf 'R386_LOCAL_TOOLS_NOT_READY\n'
fi
