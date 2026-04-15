# Domain Cutover Checklist

Checklist for pointing a real NyaayWatch domain at the validated AWS deployment.

This assumes the app continues to run on the existing AWS staging or public-alpha stack with an Application Load Balancer.

## Choose The Public Hostname

Decide explicitly before touching DNS:

- root domain, for example `nyaaywatch.in`
- app subdomain, for example `app.nyaaywatch.in`
- alpha subdomain, for example `alpha.nyaaywatch.in`

Recommendation:

- use `alpha.` if you want to keep the product visibly pre-launch
- use `app.` if you expect the root domain to stay marketing or documentation-oriented
- use the root domain only if the app itself is the primary public surface

## Certificate

- [ ] Request an ACM certificate in the same AWS region as the load balancer
- [ ] Include every hostname that will serve or redirect through the app, such as `nyaaywatch.in`, `www.nyaaywatch.in`, `nyaaywatch.com`, and `www.nyaaywatch.com`
- [ ] Complete DNS validation
- [ ] Wait for certificate status `ISSUED`

## Load Balancer

- [ ] Confirm the target ALB is the one serving `nyaaywatch-staging`
- [ ] Add or verify an HTTPS listener on port `443`
- [ ] Attach the ACM certificate to the HTTPS listener
- [ ] Forward HTTPS traffic to the existing application target group
- [ ] Keep or add an HTTP listener that redirects `80 -> 443`
- [ ] Add host-based redirect rules so `nyaaywatch.com` and `www.nyaaywatch.com` return `301` to `https://nyaaywatch.in`

## DNS

If the domain uses Route 53:

- [ ] Create an alias `A` or `AAAA` record to the ALB

If the domain uses another registrar or DNS provider:

- [ ] create the required validation records for ACM
- [ ] create the public record pointing the chosen hostname at the ALB DNS name
- [ ] confirm TTL is low enough for cutover, if you want quick rollback

## Application Verification After Cutover

- [ ] Open the domain in a browser and confirm the homepage loads over HTTPS
- [ ] Confirm the certificate hostname matches the chosen domain
- [ ] Verify `/health` through the domain
- [ ] Verify the public API endpoints through the domain
- [ ] Confirm the public UI still reads from the latest published snapshot
- [ ] Confirm operator endpoints are still unauthorized without the operator token

## Repo Updates After Cutover

- [ ] write the final public URL into `docs/DEPLOYMENT_STATUS.md`
- [ ] note the chosen hostname and environment in the release checklist
- [ ] if the domain changes public positioning, update any affected copy or docs in the same PR

## Rollback Plan

If anything is wrong after cutover:

- [ ] revert DNS to the prior hostname or remove the new record
- [ ] keep the ALB and certificate in place until the issue is understood
- [ ] record the exact failure mode and retry only after verification succeeds on the ALB URL itself
