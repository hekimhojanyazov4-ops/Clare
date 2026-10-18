import hashlib
import hmac
import json
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.conf import settings


class StripeCheckoutError(Exception):
    pass


def _request_stripe(path, *, method='GET', data=None, idempotency_key=None):
    secret_key = getattr(settings, 'STRIPE_SECRET_KEY', '')
    if not secret_key.startswith('sk_test_'):
        raise StripeCheckoutError(
            'Stripe test checkout is not configured. Set a test-mode '
            'STRIPE_SECRET_KEY on the backend.'
        )

    headers = {'Authorization': f'Bearer {secret_key}'}
    if data is not None:
        headers['Content-Type'] = 'application/x-www-form-urlencoded'
    if idempotency_key:
        headers['Idempotency-Key'] = idempotency_key

    body = urlencode(data).encode() if data is not None else None
    request = Request(
        f'https://api.stripe.com/v1/{path}',
        data=body,
        headers=headers,
        method=method,
    )

    try:
        with urlopen(request, timeout=15) as response:
            result = json.loads(response.read().decode())
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as error:
        raise StripeCheckoutError(
            'Stripe could not process the checkout request. Please retry.'
        ) from error

    if not isinstance(result, dict):
        raise StripeCheckoutError('Stripe returned an invalid response.')
    return result


def create_checkout_session(order, payment, *, frontend_url):
    data = {
        'mode': 'payment',
        'success_url': f'{frontend_url}/checkout/result/?session_id={{CHECKOUT_SESSION_ID}}',
        'cancel_url': (
            f'{frontend_url}/checkout/?cancelled=1&order_uuid={order.uuid}'
        ),
        'client_reference_id': str(order.uuid),
        'expires_at': str(int(time.time()) + 1800),
        'metadata[order_uuid]': str(order.uuid),
        'payment_intent_data[metadata][order_uuid]': str(order.uuid),
    }

    if order.customer.email:
        data['customer_email'] = order.customer.email

    for index, item in enumerate(order.order_items.all()):
        unit_amount = int(item.unit_price * 100)
        data.update({
            f'line_items[{index}][quantity]': str(item.quantity),
            f'line_items[{index}][price_data][currency]': 'usd',
            f'line_items[{index}][price_data][unit_amount]': str(unit_amount),
            f'line_items[{index}][price_data][product_data][name]': (
                item.product_name or item.product.name
            ),
        })

    session = _request_stripe(
        'checkout/sessions',
        method='POST',
        data=data,
        idempotency_key=f'clare-order-{order.uuid}',
    )
    if not session.get('id') or not session.get('url'):
        raise StripeCheckoutError('Stripe did not return a checkout URL.')
    return session


def retrieve_checkout_session(session_id):
    return _request_stripe(f'checkout/sessions/{session_id}')


def expire_checkout_session(session_id):
    return _request_stripe(
        f'checkout/sessions/{session_id}/expire',
        method='POST',
        data={},
    )


def verify_webhook_signature(payload, signature_header):
    signing_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', '')
    if not signing_secret:
        raise StripeCheckoutError(
            'Stripe webhook verification is not configured. '
            'Set STRIPE_WEBHOOK_SECRET on the backend.'
        )

    if not signature_header:
        raise StripeCheckoutError('Missing Stripe signature.')

    signature_parts = {}
    for part in signature_header.split(','):
        key, separator, value = part.partition('=')
        if separator:
            signature_parts.setdefault(key, []).append(value)

    timestamps = signature_parts.get('t', [])
    signatures = signature_parts.get('v1', [])
    if not timestamps or not signatures:
        raise StripeCheckoutError('Invalid Stripe signature.')

    try:
        timestamp = int(timestamps[0])
    except ValueError as error:
        raise StripeCheckoutError('Invalid Stripe signature timestamp.') from error

    if abs(time.time() - timestamp) > 300:
        raise StripeCheckoutError('Expired Stripe signature.')

    signed_payload = str(timestamp).encode() + b'.' + payload
    expected = hmac.new(
        signing_secret.encode(),
        signed_payload,
        hashlib.sha256,
    ).hexdigest()
    if not any(hmac.compare_digest(expected, signature) for signature in signatures):
        raise StripeCheckoutError('Invalid Stripe signature.')

    try:
        event = json.loads(payload)
    except json.JSONDecodeError as error:
        raise StripeCheckoutError('Invalid Stripe event payload.') from error
    if not isinstance(event, dict):
        raise StripeCheckoutError('Invalid Stripe event payload.')
    return event
