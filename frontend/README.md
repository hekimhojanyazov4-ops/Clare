# Harbor Shop frontend

A responsive React interface for the Django REST e-commerce API described in the referenced conversation.

## Run it

1. Copy `.env.example` to `.env` if the API is not at `http://127.0.0.1:8000/api`.
2. Install the dependencies with `pnpm install` (or `npm install`).
3. Start the interface with `pnpm dev` (or `npm run dev`).

The Django server must permit the frontend origin through CORS when the two servers use different ports. The API must also serve its uploaded product images using absolute URLs or a browser-accessible media URL.

## Structure

- `src/api/api.js` — the complete JWT-aware API client. Its named exports match the earlier `api.js` contract.
- `src/context/AuthContext.jsx` — session state and staff-role detection.
- `src/components/` — reusable navigation, cards, states, and route guards.
- `src/pages/` — customer-facing pages.
- `src/admin/` — the staff dashboard and catalog manager.
- `src/styles/` — responsive shared, shop, and admin styling.

## Important Django permission note

The supplied API gives staff full user access plus product and payment management, but it intentionally filters orders, carts, cart items, and favourites to the authenticated user. The corresponding admin sections are included and accurately show the records returned by those endpoints. To make them truly shop-wide, change those Django `get_queryset` methods to return all records when `request.user.is_staff` is true.
