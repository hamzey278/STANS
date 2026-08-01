# OpenBao policy for GitHub Actions - STANS project
# Apply with: bao policy write github-actions-stans policy-github-actions.hcl

# Read-only access to registry credentials
path "secret/data/homelab/registry" {
  capabilities = ["read"]
}

# Read-only access to TLS certificates
path "secret/data/homelab/tls/*" {
  capabilities = ["read"]
}

# Deny everything else
path "*" {
  capabilities = ["deny"]
}
