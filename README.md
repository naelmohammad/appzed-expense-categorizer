# AppZed Expense Categorizer Agent

Reads receipts and assigns bookkeeping categories ahead of month-end close. Low-confidence items land in a review queue. Schema self-initializes.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/naelmohammad/appzed-expense-categorizer)

Click **Deploy to Cloudflare**: it clones this repo to your GitHub account, provisions the bindings below on your Cloudflare account, and wires CI/CD with preview URLs on every PR.

## Bindings (auto-provisioned)

```jsonc
{
  "name": "appzed-expense-categorizer",
  "ai": {
    "binding": "AI"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "appzed-expense-categorizer-meta"
    }
  ]
}
```

## Try it

```bash
curl -X POST https://<your-worker>.workers.dev/expenses \
  -H 'content-type: application/json' \
  -d '{"merchant":"Delta Airlines","amount":412.5,"note":"client onsite"}'

curl https://<your-worker>.workers.dev/uncertain
```

GET /health for a liveness check. Managed by AppZed (https://dev.appzed.com/solutions/expense-categorizer).
