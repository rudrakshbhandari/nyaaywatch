# Security Policy

NyaayWatch publishes reviewed, snapshot-based court data. Security reports should protect users, contributors, source data, infrastructure, credentials, and the integrity of published snapshots.

## Supported Scope

Security reports are in scope when they affect:

- the public site or JSON APIs
- operator routes, publication, replay, or rollback flows
- repository automation, GitHub Actions, preview deploys, or release tooling
- dependency vulnerabilities with a practical impact on NyaayWatch
- secret handling, token exposure, or private infrastructure details
- raw artifact access rules, provenance integrity, or published snapshot integrity

Main branch and the currently deployed public service are the supported versions.

## Out Of Scope

These are normally not security vulnerabilities by themselves:

- disagreement with methodology or public copy
- upstream court-site availability, scraping limits, or data freshness delays
- reports that require access to private credentials or privileged infrastructure
- automated scanner output without a concrete NyaayWatch impact

Open a normal issue for bugs, methodology concerns, or data quality problems that do not expose sensitive information.

## Reporting A Vulnerability

Do not open a public issue with exploit details, secrets, tokens, private data, or infrastructure identifiers.

Use GitHub's private vulnerability reporting flow:

https://github.com/rudrakshbhandari/nyaaywatch/security/advisories/new

Include:

- affected route, script, workflow, or file
- steps to reproduce
- expected impact
- whether any data, credential, or operator capability may have been exposed
- a minimal proof of concept, if safe to share privately

## Response Targets

Maintainers will aim to:

- acknowledge reports within 3 business days
- triage severity and scope within 7 business days
- prioritize fixes that protect credentials, operator controls, public-data integrity, and user safety
- credit reporters when requested and appropriate

If public disclosure is needed, wait until a fix or mitigation is available unless active exploitation requires a faster public warning.
