import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MaxValueValidator, MinValueValidator, RegexValidator
from django.db.models.constraints import UniqueConstraint


class UUIDModel(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)

    class Meta:
        abstract = True


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', "Admin"
        CUSTOMER = 'CUSTOMER', "Customer"

    phone_regex = RegexValidator(
        regex=r'^\+993(61|62|63|64|65|71|72)\d{6}$',
        message="Telefon belgisi +993 bilen başlap, 61,62,63,64,65,71,72 operator kodlarynyň birini we 6 sanly abonent nomerini öz içine almaly."
    )
    role = models.CharField(max_length=8, choices=Role.choices, default=Role.CUSTOMER)
    phone = models.CharField(max_length=12, validators=[phone_regex])
    uuid = models.UUIDField(default=uuid.uuid4, unique=True)   # miras däl, özbaşdak

    def __str__(self):
        return self.username

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"


class Category(UUIDModel):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)

    class Meta:
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name


class Product(UUIDModel):
    name = models.CharField(max_length=200)
    date_added = models.DateTimeField(auto_now_add=True)
    stock = models.PositiveIntegerField(default=0)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(decimal_places=2, max_digits=10)
    category = models.ForeignKey(Category, related_name='products', on_delete=models.CASCADE)
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    @property
    def get_discount_price(self):
        if self.discount_price is not None:
            return self.discount_price
        return self.price

    def __str__(self):
        return f"{self.name} x {self.stock}"


class Cart(UUIDModel):
    created_at = models.DateTimeField(auto_now_add=True)
    customer = models.OneToOneField(
        User,
        limit_choices_to={'role': User.Role.CUSTOMER},
        on_delete=models.CASCADE,
        related_name='cart'
    )

    def __str__(self):
        return f"{self.uuid} by {self.customer.username}"


class CartItem(UUIDModel):
    product = models.ForeignKey(Product, related_name='cart_items', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    cart = models.ForeignKey(Cart, related_name='cart_items', on_delete=models.CASCADE)

    class Meta:
        constraints = [
            UniqueConstraint(fields=['cart', 'product'], name='unique_cart_product')
        ]

    def __str__(self):
        return f"{self.cart.uuid} - {self.product.name} x {self.quantity}"


class Order(UUIDModel):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending payment'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    created_at = models.DateTimeField(auto_now_add=True)
    customer = models.ForeignKey(
        User,
        limit_choices_to={'role': User.Role.CUSTOMER},
        on_delete=models.CASCADE,
        related_name='orders'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    idempotency_key = models.UUIDField(blank=True, null=True)

    @property
    def total_price(self):
        return sum(
            (
                item.unit_price
                if item.unit_price is not None
                else item.product.get_discount_price
            ) * item.quantity
            for item in self.order_items.select_related('product').all()
        )

    class Meta:
        constraints = [
            UniqueConstraint(
                fields=['customer', 'idempotency_key'],
                name='unique_customer_checkout_key',
            )
        ]

    def __str__(self):
        return f"{self.uuid} by {self.customer.username}"


class OrderItem(UUIDModel):
    product = models.ForeignKey(Product, related_name='order_items', on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    order = models.ForeignKey(Order, related_name='order_items', on_delete=models.CASCADE)
    product_name = models.CharField(max_length=200, blank=True, null=True)
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
    )

    def save(self, *args, **kwargs):
        if self.product_id:
            if not self.product_name:
                self.product_name = self.product.name
            if self.unit_price is None:
                self.unit_price = self.product.get_discount_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.order.uuid} - {self.product.name} x {self.quantity}"


class Favourite(UUIDModel):
    product = models.ForeignKey(Product, related_name='favourites', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favourites')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'product'], name='unique_user_product_favourite')
        ]

    def __str__(self):
        return f"{self.user.username} - {self.product.name}"


class Payment(UUIDModel):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    user = models.ForeignKey(
        User,
        limit_choices_to={'role': User.Role.CUSTOMER},
        on_delete=models.CASCADE,
        related_name='payments'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)])
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    order = models.OneToOneField(
        Order,
        on_delete=models.CASCADE,
        related_name='payment',
        blank=True,
        null=True
    )
    stripe_session_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        unique=True,
    )
    stripe_payment_intent_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.amount} - {self.user.username}"


class StripeWebhookEvent(models.Model):
    event_id = models.CharField(max_length=255, primary_key=True)
    event_type = models.CharField(max_length=120)
    received_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.event_id


class ProductImage(models.Model):
    image = models.ImageField(upload_to='product_images/')
    product = models.ForeignKey(Product, related_name='images', on_delete=models.CASCADE)
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_primary', "created_at"]

    def __str__(self):
        return f"{self.product.name} image"



class Review(UUIDModel):
    user = models.ForeignKey(User, related_name='reviews', on_delete=models.CASCADE)
    ratings = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    product = models.ForeignKey(Product, related_name='reviews', on_delete=models.CASCADE)
    comment = models.TextField(db_index = True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('product', 'user',)

    def __str__(self):
        return f"{self.ratings} for {self.product.name} by {self.user.get_full_name()}"


class InboxConversation(UUIDModel):
    user = models.ForeignKey(
        User,
        related_name='inbox_conversations',
        on_delete=models.CASCADE,
    )
    subject = models.CharField(max_length=180)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.subject} ({self.user.username})"


class InboxMessage(UUIDModel):
    conversation = models.ForeignKey(
        InboxConversation,
        related_name='messages',
        on_delete=models.CASCADE,
    )
    sender = models.ForeignKey(
        User,
        related_name='inbox_messages',
        on_delete=models.CASCADE,
    )
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Message in {self.conversation.uuid} by {self.sender.username}"