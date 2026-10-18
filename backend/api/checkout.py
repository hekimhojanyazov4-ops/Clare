from decimal import Decimal

from django.db import transaction
from django.db.models import F
from rest_framework.exceptions import ValidationError

from .models import (
    Cart,
    Order,
    OrderItem,
    Payment,
    Product,
    StripeWebhookEvent,
)
from .stripe_checkout import (
    StripeCheckoutError,
    expire_checkout_session,
    retrieve_checkout_session,
)


def create_pending_order(user, idempotency_key):
    with transaction.atomic():
        existing = Order.objects.filter(
            customer=user,
            idempotency_key=idempotency_key,
        ).first()
        if existing:
            return existing, Payment.objects.filter(order=existing).first(), False

        cart = Cart.objects.select_for_update().filter(customer=user).first()
        if not cart:
            raise ValidationError({'cart': 'Your cart is empty.'})

        cart_items = list(
            cart.cart_items.select_for_update().select_related('product').all()
        )
        if not cart_items:
            raise ValidationError({'cart': 'Your cart is empty.'})

        order = Order.objects.create(
            customer=user,
            idempotency_key=idempotency_key,
            status=Order.Status.PENDING,
        )
        total = Decimal('0.00')

        for cart_item in cart_items:
            product = Product.objects.select_for_update().get(
                pk=cart_item.product_id
            )
            reserved = Product.objects.filter(
                pk=product.pk,
                stock__gte=cart_item.quantity,
            ).update(stock=F('stock') - cart_item.quantity)
            if not reserved:
                raise ValidationError({
                    'stock': (
                        f'{product.name} no longer has {cart_item.quantity} '
                        'unit(s) available.'
                    )
                })

            unit_price = product.get_discount_price
            if unit_price <= 0:
                raise ValidationError({
                    'cart': 'Products in checkout must have a positive price.'
                })
            OrderItem.objects.create(
                order=order,
                product=product,
                product_name=product.name,
                unit_price=unit_price,
                quantity=cart_item.quantity,
            )
            total += unit_price * cart_item.quantity

        payment = Payment.objects.create(
            user=user,
            order=order,
            amount=total,
            status=Payment.Status.PENDING,
        )
        return order, payment, True


def _validate_session_payment(order, session):
    expected_amount = int(order.total_price * 100)
    if (
        session.get('payment_status') != 'paid'
        or session.get('amount_total') != expected_amount
        or session.get('currency') != 'usd'
    ):
        raise StripeCheckoutError(
            'Stripe payment is not confirmed or its amount does not match the order.'
        )


def confirm_order_from_session(session):
    session_id = session.get('id')
    if not session_id:
        raise StripeCheckoutError('Stripe session ID is missing.')

    with transaction.atomic():
        payment = Payment.objects.select_for_update().select_related(
            'order',
            'user',
        ).filter(stripe_session_id=session_id).first()
        if not payment or not payment.order_id:
            raise StripeCheckoutError('The Stripe session is not linked to an order.')

        order = Order.objects.select_for_update().get(pk=payment.order_id)
        _validate_session_payment(order, session)
        if order.status == Order.Status.CANCELLED:
            raise StripeCheckoutError(
                'A cancelled order received a payment. Contact support before retrying.'
            )

        if order.status != Order.Status.CONFIRMED:
            order.status = Order.Status.CONFIRMED
            order.save(update_fields=['status'])
            payment.status = Payment.Status.CONFIRMED
            intent = session.get('payment_intent')
            payment.stripe_payment_intent_id = (
                intent if isinstance(intent, str) else None
            )
            payment.save(update_fields=[
                'status',
                'stripe_payment_intent_id',
            ])
            _reconcile_cart(order)

        return order


def _reconcile_cart(order):
    cart = Cart.objects.filter(customer=order.customer).first()
    if not cart:
        return

    for item in order.order_items.all():
        cart_item = cart.cart_items.filter(product_id=item.product_id).first()
        if not cart_item:
            continue
        remaining = cart_item.quantity - item.quantity
        if remaining > 0:
            cart_item.quantity = remaining
            cart_item.save(update_fields=['quantity'])
        else:
            cart_item.delete()


def cancel_pending_order(order):
    with transaction.atomic():
        order = Order.objects.select_for_update().get(pk=order.pk)
        if order.status != Order.Status.PENDING:
            return order

        items = list(order.order_items.all())
        for item in items:
            Product.objects.filter(pk=item.product_id).update(
                stock=F('stock') + item.quantity
            )

        order.status = Order.Status.CANCELLED
        order.save(update_fields=['status'])
        Payment.objects.filter(order=order).update(
            status=Payment.Status.CANCELLED
        )
        return order


def process_stripe_event(event):
    event_id = event.get('id')
    event_type = event.get('type')
    session = event.get('data', {}).get('object', {})
    if not isinstance(event_id, str) or not isinstance(event_type, str):
        raise StripeCheckoutError('Stripe event is missing its identity.')
    if not isinstance(session, dict):
        raise StripeCheckoutError('Stripe event contains invalid checkout data.')

    with transaction.atomic():
        _, created = StripeWebhookEvent.objects.get_or_create(
            event_id=event_id,
            defaults={'event_type': event_type},
        )
        if not created:
            return

        if session.get('payment_status') == 'paid' and event_type in {
            'checkout.session.completed',
            'checkout.session.async_payment_succeeded',
            'checkout.session.expired',
            'checkout.session.async_payment_failed',
        }:
            confirm_order_from_session(session)
        elif event_type in {
            'checkout.session.expired',
            'checkout.session.async_payment_failed',
        }:
            payment = Payment.objects.select_related('order').filter(
                stripe_session_id=session.get('id')
            ).first()
            if payment and payment.order_id:
                cancel_pending_order(payment.order)


def cancel_checkout_for_user(order, user):
    payment = Payment.objects.filter(order=order, user=user).first()
    if not payment or not payment.stripe_session_id:
        return order

    session = retrieve_checkout_session(payment.stripe_session_id)
    if session.get('payment_status') == 'paid':
        return confirm_order_from_session(session)
    if session.get('status') == 'open':
        session = expire_checkout_session(payment.stripe_session_id)
    if session.get('status') == 'expired':
        return cancel_pending_order(order)
    return order
