# Domain Cutover Checklist

Recorded cutover state for pointing the real NyaayWatch domain at the validated AWS deployment.

This assumes the app continues to run on the existing AWS staging or public-alpha stack with an Application Load Balancer.

## Current Status

- Chosen public hostname: `https://nyaaywatch.in`
- Cutover status: completed on `2026-04-15`
- Backing stack: `nyaaywatch-staging` in `ap-south-1`
- Evidence source: `docs/DEPLOYMENT_STATUS.md` and `docs/ALPHA_RELEASE_CHECKLIST.md`

Treat the checked items below as the completed `nyaaywatch.in` cutover record. Reuse this document only if the hostname, certificate coverage, or DNS target changes again. Treat the legacy `.com` hostnames as a separate optional follow-up unless they are actively routed in DNS with matching ACM coverage.

## Reuse This Checklist If The Public Hostname Changes

Decide explicitly before touching DNS:

- root domain, for example `nyaaywatch.in`
- app subdomain, for example `app.nyaaywatch.in`
- alpha subdomain, for example `alpha.nyaaywatch.in`

Recommendation:

- use `alpha.` if you want to keep the product visibly pre-launch
- use `app.` if you expect the root domain to stay marketing or documentation-oriented
- use the root domain only if the app itself is the primary public surface

## Recorded Certificate State

- [x] Request an ACM certificate in the same AWS region as the load balancer
- [x] Include the active public hostname `nyaaywatch.in`
- [x] Complete DNS validation
- [x] Wait for certificate status `ISSUED`
- [ ] Optional future follow-up: if `nyaaywatch.com`, `www.nyaaywatch.com`, or `www.nyaaywatch.in` will be served publicly, confirm they are all covered by ACM before routing traffic to them

## Recorded Load Balancer State

- [x] Confirm the target ALB is the one serving `nyaaywatch-staging`
- [x] Add or verify an HTTPS listener on port `443`
- [x] Attach the ACM certificate to the HTTPS listener
- [x] Forward HTTPS traffic to the existing application target group
- [x] Keep or add an HTTP listener that redirects `80 -> 443`
- [x] Application-level redirect behavior sends legacy `.com` host headers to `https://nyaaywatch.in`
- [ ] Optional future follow-up: if the `.com` hostnames are pointed at the ALB publicly, re-verify browser-visible `301` redirects with certificate coverage for those hosts

## Recorded DNS State

- [x] Create the ACM validation records for `nyaaywatch.in`
- [x] Create the public DNS record pointing `nyaaywatch.in` at the ALB
- [x] Keep the TTL low enough to support rollback during cutover

## Recorded Application Verification

- [x] Open the domain in a browser and confirm the homepage loads over HTTPS
- [x] Confirm the certificate hostname matches the chosen domain
- [x] Verify `/health` through the domain
- [x] Verify the public API endpoints through the domain
- [x] Confirm the public UI still reads from the latest published snapshot
- [x] Confirm operator endpoints are still unauthorized without the operator token

## Recorded Repo Updates

- [x] write the final public URL into `docs/DEPLOYMENT_STATUS.md`
- [x] note the chosen hostname and environment in the release checklist
- [x] if the domain changes public positioning, update any affected copy or docs in the same PR

## Future Incident Rollback Actions

If a future DNS or certificate change causes regressions:

- revert DNS to the prior hostname or remove the changed record
- keep the ALB and certificate in place until the issue is understood
- record the exact failure mode and retry only after verification succeeds on the ALB URL itself

## Recorded Cutover Evidence

- Public hostname serving traffic: `https://nyaaywatch.in`
- ALB DNS name: `nyaaywatch-staging-964594065.ap-south-1.elb.amazonaws.com`
- ACM certificate ARN: `arn:aws:acm:ap-south-1:723951822728:certificate/c55eb076-1c4c-4d94-a29b-454100e3ebc7`
- Latest confirmed public verification date: `2026-04-15`
- Latest confirmed operator rejection check: unauthenticated `GET /operator/publications` returned `401`

## Detailed Rollback Procedure

If the public hostname regresses after a future DNS or certificate change:

1. Point `nyaaywatch.in` back to the prior known-good target or remove the changed record.
2. Keep the ALB, HTTPS listener, and ACM certificate in place while investigating.
3. Verify the raw ALB hostname and `https://nyaaywatch.in/health` separately before retrying the cutover.
4. Record the exact failure mode in `docs/DEPLOYMENT_STATUS.md` or the release checklist before reattempting.
