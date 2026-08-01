#!/bin/bash
# Configure OpenBao JWT auth for GitHub Actions OIDC
# Run once on your OpenBao instance (homelab)
# Usage: ./setup-jwt-auth.sh

set -euo pipefail

OPENBAO_ADDR="${OPENBAO_ADDR:-http://localhost:8200}"
GITHUB_REPO="Ronel16/STANS"
BOUND_AUDIENCE="https://github.com/Ronel16"

echo "Configuring OpenBao JWT auth for GitHub Actions..."

# Enable JWT auth if not already enabled
bao auth enable jwt 2>/dev/null || echo "JWT auth already enabled"

# Configure OIDC with GitHub Actions token
bao write auth/jwt/config \
  oidc_discovery_url="https://token.actions.githubusercontent.com" \
  bound_issuer="https://token.actions.githubusercontent.com"

# Create role scoped to this specific repo
bao write auth/jwt/role/github-actions-stans \
  role_type="jwt" \
  bound_audiences="$BOUND_AUDIENCE" \
  bound_claims_type="glob" \
  bound_claims="{\"repository\":\"$GITHUB_REPO\"}" \
  user_claim="workflow" \
  policies="github-actions-stans" \
  ttl="5m" \
  max_ttl="10m"

# Store registry credentials
bao kv put secret/homelab/registry \
  username="$REGISTRY_USER" \
  password="$REGISTRY_PASSWORD"

echo ""
echo "✅ OpenBao JWT auth configured"
echo "   Role: github-actions-stans"
echo "   Bound repo: $GITHUB_REPO"
echo "   Token TTL: 5 minutes"
echo ""
echo "Set these GitHub variables (not secrets):"
echo "  OPENBAO_URL = $OPENBAO_ADDR"
echo "  OPENBAO_AUDIENCE = $BOUND_AUDIENCE"
