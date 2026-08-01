# DevSecOps Pipeline — Security Documentation

> This document describes the security controls implemented on top of the
> original STANS project (Bahria University — Data Structures course fork).
> All controls were designed and implemented by [@Ronel16](https://github.com/Ronel16).

---

## Pipeline Architecture
---

## Security Controls

| Control | Tool | Workflow | Trigger | Framework |
|---------|------|----------|---------|-----------|
| SAST | CodeQL | CodeQL (default) | PR + push | CIS 16.1 |
| SCA — dependencies | npm audit | security-audit.yml | PR + push + cron | CIS 7.6 |
| Secrets detection | Gitleaks | secrets-scan.yml | PR + push + cron | CIS 3.11 |
| Container scan | Trivy | deploy.yml | push main | CIS 5.2 |
| IaC scan | Checkov | iac-scan.yml | IaC changes + cron | CIS 4.1 |
| SBOM generation | anchore/sbom-action | sbom.yml | push + release | NIST SSDF PW.4 |
| Image signing | Cosign (Sigstore) | sign-image.yml | push main | SLSA v1.0 |
| Provenance | SLSA Level 2 | sign-image.yml | push main | NIST SP 800-53 SA-12 |
| Supply chain score | OpenSSF Scorecard | scorecard.yml | push + cron | OpenSSF |
| Secrets management | OpenBao OIDC | vault-auth.yml | workflow_call | NIST SP 800-207 |
| Branch protection | GitHub Rulesets | — | all pushes | CIS 4.1 |
| Least privilege CI | permissions: {} | all workflows | all runs | NIST SP 800-207 |

---

## Frameworks Applied

| Framework | Version | Application |
|-----------|---------|-------------|
| NIST CSF | 2.0 | Govern → Protect → Detect controls |
| CIS Controls | v8 | IG1/IG2 implementation groups |
| NIST SP 800-207 | Zero Trust | Least privilege CI, OIDC auth |
| NIST SP 800-53 | Rev 5 | CM-3, SA-12, AC-6 |
| NIST SSDF | 1.1 | PW.4, PO.3 supply chain |
| SLSA | v1.0 | Level 2 build provenance |
| NIS2 | Article 21 | SBOM, supply chain measures |

---

## Vulnerabilities Remediated

Starting state: **28 Dependabot alerts** (10 HIGH, 11 MODERATE, 2 LOW, 5 other)

| Package | CVE / GHSA | Severity | Fix |
|---------|-----------|---------|-----|
| lodash | GHSA-p6mc-m468-83gw | HIGH — Prototype Pollution | 4.17.21 → 4.18.1 |
| minimatch | GHSA-f8q6-p94x-37v3 | HIGH — ReDoS | override ^9.0.0 |
| glob | GHSA-38fc-wpqx-33j7 | HIGH — ReDoS | override ^11.0.0 |
| picomatch | GHSA-gcx4-mw62-g8wm | HIGH — ReDoS | override ^4.0.0 |
| flatted | GHSA-… | HIGH | 3.3.1 → 3.4.2 |
| brace-expansion | GHSA-… | HIGH | Dependabot PR |
| yaml | GHSA-… | HIGH | 2.6.0 → 2.8.3 |
| postcss | GHSA-… | HIGH | 8.5.6 → 8.5.12 |
| react-router | GHSA-… | MODERATE | retained — dev only |
| vite/esbuild | GHSA-67mh-4wv8-2f99 | MODERATE | retained — dev server only |

**Final state: 0 HIGH, 2 MODERATE (accepted risk — dev-only)**

STRIDE analysis and NIST CSF 2.0 mapping: [Notion report](https://www.notion.so/34fad8601b588178a4d0c91a6ae89690)

---

## CI/CD Gate Policy

| Gate | Condition | Action |
|------|-----------|--------|
| npm audit | HIGH or CRITICAL found | ❌ Block merge |
| CodeQL | New alerts | ❌ Block merge |
| Trivy | CRITICAL CVE in image | ❌ Block push to registry |
| Trivy | HIGH CVE in image | ⚠️ Log, continue |
| Gitleaks | Secret detected | ❌ Block merge |
| Checkov | IaC misconfiguration | ⚠️ Report to Security tab |
| Cosign | Image not signed | ⚠️ Warn on verify |
| Branch protection | Direct push to main | ❌ Rejected |
| Signed commits | Unverified commit | ❌ Rejected (Phase 2) |

---

## Workflows Schedule
---

## Repository Structure
