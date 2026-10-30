# Infrastructure

- Services and database hosted on [Render](https://render.com/), defined via [render.yaml](../render.yaml)
- Email Service via [Resend](https://resend.com/)
- An uptime monitor pings the backend every 5 minutes so the free Render service doesn't spin down

## Domains

- Root domain is `cardcase.jtm-dev.com`, DNS managed via [Cloudflare](https://www.cloudflare.com/)
- Backend hosted at `api.cardcase.jtm-dev.com`
