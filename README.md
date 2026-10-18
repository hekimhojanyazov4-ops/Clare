# Clare
Full e-commerce web site example

## Stripe Checkout (test mode)

Checkout redirects customers to Stripe-hosted Checkout and uses USD, matching
the storefront's current currency. Clare never collects or stores card details.
No shipping address is collected; delivery and fulfillment are outside the
current checkout model.

Configure these variables in the backend process environment (do not commit
credentials):

- `STRIPE_SECRET_KEY`: a Stripe **test-mode** secret key (`sk_test_...`).
- `STRIPE_WEBHOOK_SECRET`: the signing secret for the webhook endpoint.
- `FRONTEND_URL`: storefront origin; defaults to `http://localhost:5173`.

In Stripe test mode, configure the webhook endpoint at
`/api/webhooks/stripe/` for `checkout.session.completed`,
`checkout.session.async_payment_succeeded`,
`checkout.session.async_payment_failed`, and `checkout.session.expired`.
For local development, Stripe CLI can forward events to
`http://localhost:8000/api/webhooks/stripe/`. Apply backend migrations before
starting the application. Inventory is reserved while a Checkout Session is
open and released after cancellation or session expiry; webhook delivery is
required for automatic expiry cleanup. The result page also verifies completed
sessions directly with Stripe before showing a confirmed order.
