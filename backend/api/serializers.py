from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, Category, Product, Order, OrderItem, Cart, CartItem, Favourite, Payment, ProductImage, Review


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
            'stock',
            'date_added',
            'description',
            'images',
        )







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
            'customer',
            'order_items',
            'total_price',
        )






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






class PaymentCreateSerializer(serializers.ModelSerializer):
    order_uuid = UUIDRelatedField(
        queryset=Order.objects.all(),
        source='order',
        write_only=True,
        required=False
    )

    class Meta:
        model = Payment
        fields = (
            'order_uuid',
            'amount',
        )




class CreateReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = (
            'uuid',
            'user',
            'created_at',
            'updated_at',
            'ratings',
            'comment',
        )
        read_only_fields = fields


class ReviewViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = (
            'user',
            'ratings',
            'comment',
        )
        read_only_fields = fields