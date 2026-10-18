from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from .models import CartItem, Category, Order, OrderItem, Product, Review, User


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
