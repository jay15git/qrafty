# Security Policy

## Reporting a vulnerability

Do not open a public issue for security reports. Email **security@qrafty.app**
(or use GitHub's private vulnerability reporting) with a description,
reproduction steps, and any relevant request/response samples.

We aim to acknowledge reports within 72 hours and ship a fix or mitigation
note within 14 days depending on severity.

## Scope

QRafty runs client-side rendering plus a small set of API routes. Reports
covering user-content handling, SVG/QR sanitization, auth/session issues on
qrafty.app, and dependency vulnerabilities with a demonstrated exploit path
are in scope. Missing best-practice headers and theoretical scanner output
without impact are out of scope.
