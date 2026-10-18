from django.db.models import Avg, Count
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import (
    User, Category, Product, Order, OrderItem, Cart, CartItem, Favourite,
    Payment, ProductImage, Review, InboxConversation, InboxMessage,
)


class UUIDRelatedField(serializers.PrimaryKeyRelatedField):
    def to_internal_value(self, data):
        try:
            return self.get_queryset().get(uuid=data)
        except (TypeError, ValueError):
            self.fail('incorrect_type', data_type=type(data).__name__)
        except self.get_queryset().model.DoesNotExist:
            self.fail('does_not_exist', pk_value=data)




class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id',
            'uuid',
            'username',
            'first_name',
            'last_name',
            'email',
            'phone',
            'role',
            'is_staff',
            'is_superuser',
            'password',
        )
        extra_kwargs = {
            'password': {'write_only': True, 'required': True},
            'is_staff': {'read_only': True},
            'is_superuser': {'read_only': True},
        }


    def create(self, validated_data):
        password = validated_data.pop('password', None)
        request = self.context.get('request')
        is_admin_request = request and request.user.is_authenticated and request.user.is_staff

        if not is_admin_request:
            validated_data['role'] = User.Role.CUSTOMER

        user = User(**validated_data)
        if is_admin_request and user.role == User.Role.ADMIN:
            user.is_staff = True
        if password:
            user.set_password(password)
        user.save()
        return user

    def validate_role(self, value):
        """Keep role changes under administrator control."""
        request = self.context.get('request')
        if (
            self.instance is not None
            and request is not None
            and request.user.is_authenticated
            and not request.user.is_staff
            and value != self.instance.role
        ):
            raise serializers.ValidationError(
                'Only administrators can change account roles.'
            )
        return value



    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance





class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'uuid', 'name', 'slug')






class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data







class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ('image', 'product', 'is_primary', 'created_at',)






class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many = True, read_only = True)
    category = CategorySerializer(read_only=True)
    rating_average = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    category_uuid = UUIDRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True
    )
    current_price = serializers.DecimalField(
        source='get_discount_price',
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = Product
        fields = (
            'id',
            'uuid',
            'name',
            'category',
            'category_uuid',
            'price',
            'discount_price',
            'current_price',
            'rating_average',
            'review_count',
            'stock',
            'date_added',
            'description',
            'images',
        )

    def get_rating_average(self, obj):
        if hasattr(obj, 'rating_average'):
            return obj.rating_average
        reviews = getattr(obj, '_prefetched_objects_cache', {}).get('reviews')
        if reviews is not None:
            if not reviews:
                return None
            return sum(review.ratings for review in reviews) / len(reviews)
        return obj.reviews.aggregate(rating_average=Avg('ratings'))['rating_average']

    def get_review_count(self, obj):
        if hasattr(obj, 'review_count'):
            return obj.review_count
        reviews = getattr(obj, '_prefetched_objects_cache', {}).get('reviews')
        if reviews is not None:
            return len(reviews)
        return obj.reviews.count()







class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_uuid = UUIDRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True
    )

    class Meta:
        model = CartItem
        fields = (
            'id',
            'uuid',
            'product',
            'product_uuid',
            'quantity',
        )






class CartItemUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = ('quantity',)

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError('Quantity must be at least 1.')
        if value > self.instance.product.stock:
            raise serializers.ValidationError(
                f'Only {self.instance.product.stock} unit(s) are available.'
            )
        return value






class CartSerializer(serializers.ModelSerializer):
    cart_items = CartItemSerializer(read_only=True, many=True)
    customer = UserSerializer(read_only=True)

    class Meta:
        model = Cart
        fields = (
            'id',
            'uuid',
            'cart_items',
            'created_at',
            'customer',
        )







class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_name = serializers.CharField(read_only=True)
    unit_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )
    product_uuid = UUIDRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True
    )

    class Meta:
        model = OrderItem
        fields = (
            'id',
            'uuid',
            'product',
            'product_name',
            'unit_price',
            'product_uuid',
            'quantity',
        )






class OrderSerializer(serializers.ModelSerializer):
    order_items = OrderItemSerializer(many=True, read_only=True)
    customer = UserSerializer(read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Order
        fields = (
            'id',
            'uuid',
            'created_at',
            'status',
            'customer',
            'order_items',
            'total_price',
        )
        read_only_fields = fields






class FavouriteSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = Favourite
        fields = (
            'id',
            'uuid',
            'product',
            'user',
            'created_at',
        )




class FavouriteCreateSerializer(serializers.ModelSerializer):
    product_uuid = UUIDRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True
    )

    class Meta:
        model = Favourite
        fields = ('product_uuid',)






class PaymentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    status = serializers.ChoiceField(choices=Payment.Status.choices)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    order_uuid = serializers.UUIDField(source='order.uuid', read_only=True)

    class Meta:
        model = Payment
        fields = (
            'id',
            'uuid',
            'user',
            'amount',
            'status',
            'status_display',
            'order_uuid',
            'created_at',
        )






class ReviewWriteSerializer(serializers.ModelSerializer):
    product_uuid = UUIDRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True,
        required=False,
    )
    user_name = serializers.SerializerMethodField()
    user_uuid = serializers.UUIDField(source='user.uuid', read_only=True)

    class Meta:
        model = Review
        fields = (
            'uuid',
            'product_uuid',
            'user_name',
            'user_uuid',
            'created_at',
            'updated_at',
            'ratings',
            'comment',
        )
        read_only_fields = ('uuid', 'user_name', 'created_at', 'updated_at')

    def get_user_name(self, obj):
        return obj.user.get_full_name().strip() or obj.user.username

    def validate(self, attrs):
        product = attrs.get('product')
        if product is None and self.instance is not None:
            product = self.instance.product
        if product is None:
            raise serializers.ValidationError(
                {'product_uuid': 'A product is required for a review.'}
            )

        request = self.context.get('request')
        if request and request.user.is_authenticated:
            existing = Review.objects.filter(product=product, user=request.user)
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            if existing.exists():
                raise serializers.ValidationError(
                    {'product_uuid': 'You have already reviewed this product.'}
                )

        return attrs


class ReviewViewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_uuid = serializers.UUIDField(source='user.uuid', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = Review
        fields = (
            'uuid',
            'product',
            'product_name',
            'user_name',
            'user_uuid',
            'ratings',
            'comment',
            'created_at',
            'updated_at',
        )
        read_only_fields = fields

    def get_user_name(self, obj):
        return obj.user.get_full_name().strip() or obj.user.username


class InboxMessageSerializer(serializers.ModelSerializer):
    sender_uuid = serializers.UUIDField(source='sender.uuid', read_only=True)
    sender_name = serializers.SerializerMethodField()
    sender_is_staff = serializers.BooleanField(source='sender.is_staff', read_only=True)

    class Meta:
        model = InboxMessage
        fields = (
            'uuid',
            'sender_uuid',
            'sender_name',
            'sender_is_staff',
            'body',
            'created_at',
            'read_at',
        )
        read_only_fields = fields

    def get_sender_name(self, obj):
        return obj.sender.get_full_name().strip() or obj.sender.username


class InboxConversationSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    messages = InboxMessageSerializer(many=True, read_only=True)
    unread_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = InboxConversation
        fields = (
            'uuid',
            'subject',
            'customer_name',
            'created_at',
            'updated_at',
            'unread_count',
            'messages',
        )
        read_only_fields = fields

    def get_customer_name(self, obj):
        return obj.user.get_full_name().strip() or obj.user.username


class InboxConversationCreateSerializer(serializers.Serializer):
    subject = serializers.CharField(max_length=180, trim_whitespace=True)
    message = serializers.CharField(trim_whitespace=True)

    def validate_message(self, value):
        if not value.strip():
            raise serializers.ValidationError('Write a message before sending.')
        return value

    def create(self, validated_data):
        user = self.context['request'].user
        conversation = InboxConversation.objects.create(
            user=user,
            subject=validated_data['subject'],
        )
        InboxMessage.objects.create(
            conversation=conversation,
            sender=user,
            body=validated_data['message'],
        )
        conversation.unread_count = 0
        return conversation


class InboxReplySerializer(serializers.Serializer):
    body = serializers.CharField(trim_whitespace=True)

    def validate_body(self, value):
        if not value.strip():
            raise serializers.ValidationError('Write a message before sending.')
        return value
