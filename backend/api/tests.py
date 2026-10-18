from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from .models import CartItem, Category, Order, OrderItem, Payment, Product, Review, User


class ProductPricingTests(TestCase):
    def test_discount_price_keeps_zero_discount_value(self):
        category = Category.objects.create(name='Shoes', slug='shoes')
        product = Product.objects.create(
            name='Sneakers',
            price=Decimal('100.00'),
            discount_price=Decimal('0.00'),
            category=category,
            stock=5,
        )

        self.assertEqual(product.get_discount_price, Decimal('0.00'))

    def test_order_total_price_uses_discounted_price(self):
        category = Category.objects.create(name='Accessories', slug='accessories')
        user = User.objects.create_user(
            username='buyer',
            password='secure-pass-123',
            phone='+99361123456',
        )
        product = Product.objects.create(
            name='Bag',
            price=Decimal('40.00'),
            discount_price=Decimal('30.00'),
            category=category,
            stock=5,
        )
        order = Order.objects.create(customer=user)
        OrderItem.objects.create(order=order, product=product, quantity=2)

        self.assertEqual(order.total_price, Decimal('60.00'))

    def test_review_string_uses_user_full_name(self):
        category = Category.objects.create(name='Wear', slug='wear')
        user = User.objects.create_user(
            username='alice',
            password='secure-pass-123',
            first_name='Alice',
            last_name='Tester',
            phone='+99361123456',
        )
        product = Product.objects.create(
            name='Cap',
            price=Decimal('20.00'),
            category=category,
            stock=4,
        )
        review = Review.objects.create(
            user=user,
            product=product,
            ratings=5,
            comment='Great',
        )

        self.assertEqual(str(review), '5 for Cap by Alice Tester')


class CartStockValidationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='buyer',
            password='secure-pass-123',
            phone='+99361123456',
        )
        category = Category.objects.create(name='Stock test', slug='stock-test')
        self.product = Product.objects.create(
            name='Limited item',
            price=Decimal('12.00'),
            category=category,
            stock=2,
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_add_to_cart_rejects_quantity_above_stock(self):
        response = self.client.post(
            '/api/cart/add_item/',
            {'product_uuid': str(self.product.uuid), 'quantity': 3},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(CartItem.objects.exists())

    def test_add_to_cart_rejects_combined_quantity_above_stock(self):
        self.client.post(
            '/api/cart/add_item/',
            {'product_uuid': str(self.product.uuid), 'quantity': 1},
            format='json',
        )

        response = self.client.post(
            '/api/cart/add_item/',
            {'product_uuid': str(self.product.uuid), 'quantity': 2},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(CartItem.objects.get().quantity, 1)

    def test_cart_update_rejects_quantity_above_stock(self):
        self.client.post(
            '/api/cart/add_item/',
            {'product_uuid': str(self.product.uuid), 'quantity': 1},
            format='json',
        )
        cart_item = CartItem.objects.get()

        response = self.client.patch(
            f'/api/cart-items/{cart_item.uuid}/',
            {'quantity': 3},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        cart_item.refresh_from_db()
        self.assertEqual(cart_item.quantity, 1)


class AdminApiAccessTests(TestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            username='customer',
            password='secure-pass-123',
            phone='+99361123456',
        )
        self.admin = User.objects.create_user(
            username='admin',
            password='secure-pass-123',
            phone='+99362123456',
            role=User.Role.ADMIN,
            is_staff=True,
        )
        self.client = APIClient()

    def test_cart_endpoints_reject_anonymous_requests(self):
        self.assertEqual(self.client.get('/api/cart/').status_code, 401)
        self.assertEqual(self.client.get('/api/cart-items/').status_code, 401)

    def test_customer_cannot_change_their_own_role(self):
        self.client.force_authenticate(self.customer)

        response = self.client.patch(
            f'/api/users/{self.customer.uuid}/',
            {'role': User.Role.ADMIN},
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.role, User.Role.CUSTOMER)

    def test_admin_can_load_orders_and_payments(self):
        order = Order.objects.create(customer=self.customer)
        Payment.objects.create(
            user=self.customer,
            order=order,
            amount=Decimal('25.00'),
        )
        self.client.force_authenticate(self.admin)

        orders = self.client.get('/api/orders/')
        payments = self.client.get('/api/payments/')

        self.assertEqual(orders.status_code, 200)
        self.assertEqual(payments.status_code, 200)
        self.assertEqual(len(orders.data), 1)
        self.assertEqual(len(payments.data), 1)


class CorsPolicyTests(TestCase):
    def test_checkout_preflight_allows_idempotency_key(self):
        response = self.client.options(
            '/api/orders/checkout/',
            HTTP_ORIGIN='http://localhost:5173',
            HTTP_ACCESS_CONTROL_REQUEST_METHOD='POST',
            HTTP_ACCESS_CONTROL_REQUEST_HEADERS=(
                'authorization,content-type,idempotency-key'
            ),
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response['Access-Control-Allow-Origin'],
            'http://localhost:5173',
        )
        self.assertIn(
            'idempotency-key',
            response['Access-Control-Allow-Headers'].lower(),
        )
