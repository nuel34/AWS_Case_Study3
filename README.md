# PulseGrid — static site (Case Study 3: Innovartus)

A static monitoring-dashboard SaaS demo: live pulse graph, rolling uptime/latency metrics, a monitor grid, an "add monitor" form (persists via localStorage), and an incident log. No backend, no build step — pure HTML/CSS/JS.

## Files
- `index.html`
- `style.css`
- `script.js`

## Deploying on AWS with CI/CD (recommended: AWS Amplify Hosting)

This gives you the "connect GitHub → auto-deploy on push" flow the case study asks for, on AWS's free tier.

1. Push this folder to your GitHub repo (root, or note the subfolder if not root).
2. AWS Console → **Amplify** → **Host a web app** → **GitHub** → authorize and pick your repo/branch.
3. Since there's no build step, set the build settings to skip building and just publish the root:
   ```yaml
   version: 1
   frontend:
     phases:
       build:
         commands: []
     artifacts:
       baseDirectory: /
       files:
         - '**/*'
   ```
4. Save and deploy. Amplify gives you a live HTTPS URL and redeploys automatically on every push to the branch — that's your CI/CD.
5. For the "Monitoring" step: Amplify's console has a built-in **Hosting → Monitoring** tab with request counts and error rates — screenshot that for your deliverables.

## Alternative: S3 static website hosting (no CI/CD, simpler)

1. Create an S3 bucket → enable **Static website hosting** → set `index.html` as the index document.
2. Upload the three files, set bucket policy/ACL for public read (or front it with CloudFront for HTTPS).
3. This works for the "deployment" step but you'd need to add GitHub Actions yourself to get auto-deploy on push — Amplify is less setup for the CI/CD requirement.

## For your results table
- **Deployment time**: time from `git push` to the new version being live (Amplify shows this per-deploy in its console).
- **Downtime during updates**: Amplify does atomic deploys, so this is typically ~0s — worth noting as an observation.
- **Scaling ease**: static assets served via CloudFront under the hood, so it scales from 10 → 10,000 users with no manual intervention — good talking point for your Part B Step 5 write-up.
