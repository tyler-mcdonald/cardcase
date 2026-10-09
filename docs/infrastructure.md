# Infrastructure

- Services and database hosted on [Render](https://render.com/), defined via [render.yaml](../render.yaml)
- Email Service via [Resend](https://resend.com/)

## Domains

- Root domain is `cardcase.jtm-dev.com`, DNS managed via [Cloudflare](https://www.cloudflare.com/)
- Backend hosted at `api.cardcase.jtm-dev.com`

## Superuser

- The backend's build command runs `ensure_superuser`, which creates a passwordless superuser for `DJANGO_SUPERUSER_EMAIL` if one doesn't exist. It's a no-op when the variable is unset or the superuser already exists, and fails the build if the email belongs to a regular user.
- Set `DJANGO_SUPERUSER_EMAIL` on the `cardcase-backend` service in the Render dashboard, then deploy. Log in through the app's normal email-code flow; this works even while signup is closed.
- It runs in the build command (alongside `migrate`) because the free instance type has no Render Shell or [pre-deploy command](https://render.com/docs/deploys#pre-deploy-command). Move both to `preDeployCommand` if the service moves to a paid instance type.
