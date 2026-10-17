from django.db import IntegrityError
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.db.models import Prefetch

from .models import (
    User, Category, Product, ProductImage, Cart, CartItem,
    Order, OrderItem, Favourite, Payment, Review
)
from .serializers import (
    UserSerializer, CategorySerializer, ProductSerializer,
    CartSerializer, CartItemSerializer, CartItemUpdateSerializer,
    OrderSerializer, FavouriteSerializer, FavouriteCreateSerializer,
    PaymentSerializer, PaymentCreateSerializer, ReviewViewSerializer, CreateReviewSerializer
)


# ================= USER =================
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    lookup_field = 'uuid'

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return User.objects.all()
        return User.objects.filter(id=user.id)






# ================= CATEGORY =================
class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'uuid'

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]






# ================= PRODUCT =================
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category').all()
    serializer_class = ProductSerializer
    lookup_field = 'uuid'

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        product = serializer.save()
        for index, image in enumerate(self.request.FILES.getlist('images')):
            ProductImage.objects.create(
                product=product,
                image=image,
                is_primary=index == 0,
            )





# ================= CART =================
class CartViewSet(viewsets.GenericViewSet):
    serializer_class = CartSerializer
    # permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Cart.objects.prefetch_related(
            Prefetch(
                'cart_items',
                queryset=CartItem.objects.select_related('product__category')
            )
        )
        if self.request.user.is_staff:
            return queryset
        return queryset.filter(customer=self.request.user)

    def get_cart(self):
        cart, _ = Cart.objects.get_or_create(customer=self.request.user)
        return cart

    def list(self, request):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, uuid=None):
        cart = get_object_or_404(self.get_queryset(), uuid=uuid)
        serializer = self.get_serializer(cart)
        return Response(serializer.data)

    def partial_update(self, request, uuid=None):
        if not request.user.is_staff:
            return Response(
                {"detail": "Only administrators can edit carts."},
                status=status.HTTP_403_FORBIDDEN,
            )

        cart = get_object_or_404(self.get_queryset(), uuid=uuid)
        for item_data in request.data.get('cart_items', []):
            item = get_object_or_404(
                cart.cart_items,
                uuid=item_data.get('uuid'),
            )
            item.quantity = item_data.get('quantity', item.quantity)
            item.save(update_fields=['quantity'])

        return Response(self.get_serializer(cart).data)

    def destroy(self, request, uuid=None):
        if not request.user.is_staff:
            return Response(
                {"detail": "Only administrators can delete carts."},
                status=status.HTTP_403_FORBIDDEN,
            )
        cart = get_object_or_404(self.get_queryset(), uuid=uuid)
        cart.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['post'])
    def add_item(self, request):
        cart = self.get_cart()
        serializer = CartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product = serializer.validated_data['product']
        quantity = serializer.validated_data['quantity']

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': quantity}
        )
        if not created:
            cart_item.quantity += quantity
            cart_item.save()

        output = CartItemSerializer(cart_item)
        return Response(output.data, status=status.HTTP_201_CREATED)







# ================= CART ITEM (ayratyn) =================
class CartItemViewSet(viewsets.ModelViewSet):
    serializer_class = CartItemSerializer
    # permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'uuid'
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        return CartItem.objects.filter(
            cart__customer=self.request.user
        ).select_related('product__category')

    def get_serializer_class(self):
        if self.action == 'partial_update':
            return CartItemUpdateSerializer
        return CartItemSerializer

    def perform_update(self, serializer):
        serializer.save()


# ================= ORDER =================
class OrderViewSet(viewsets.GenericViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'uuid'

    def get_queryset(self):
        queryset = Order.objects.all()
        if not self.request.user.is_staff:
            queryset = queryset.filter(customer=self.request.user)
        return queryset.prefetch_related(
            Prefetch(
                'order_items',
                queryset=OrderItem.objects.select_related('product__category')
            )
        )

    def list(self, request):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, uuid=None):
        order = get_object_or_404(self.get_queryset(), uuid=uuid)
        serializer = self.get_serializer(order)
        return Response(serializer.data)

    def partial_update(self, request, uuid=None):
        if not request.user.is_staff:
            return Response(
                {"detail": "Only administrators can edit orders."},
                status=status.HTTP_403_FORBIDDEN,
            )

        order = get_object_or_404(self.get_queryset(), uuid=uuid)
        for item_data in request.data.get('order_items', []):
            item = get_object_or_404(
                order.order_items,
                uuid=item_data.get('uuid'),
            )
            item.quantity = item_data.get('quantity', item.quantity)
            item.save(update_fields=['quantity'])

        return Response(self.get_serializer(order).data)

    @action(detail=False, methods=['post'])
    def create_from_cart(self, request):
        cart = Cart.objects.filter(customer=request.user).first()
        if not cart or not cart.cart_items.exists():
            return Response({"detail": "Sebet boş."}, status=status.HTTP_400_BAD_REQUEST)

        order = Order.objects.create(customer=request.user)
        for item in cart.cart_items.all():
            OrderItem.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity
            )
        cart.cart_items.all().delete()

        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)



# ================= FAVOURITE =================
class FavouriteViewSet(viewsets.ModelViewSet):
    queryset = Favourite.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'uuid'

    def get_queryset(self):
        queryset = Favourite.objects.select_related('product__category', 'user')
        if self.request.user.is_staff:
            return queryset
        return queryset.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return FavouriteCreateSerializer
        return FavouriteSerializer

    def perform_create(self, serializer):
        try:
            serializer.save(user=self.request.user)
        except IntegrityError:
            raise ValidationError({"detail": "Bu önüm eýýäm halanýanlarda."})



# ================= PAYMENT =================
class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'uuid'

    def get_queryset(self):
        qs = Payment.objects.select_related('user', 'order')
        if self.request.user.is_staff:
            return qs.all()
        return qs.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return PaymentCreateSerializer
        return PaymentSerializer

    def get_permissions(self):
        if self.action in ['create', 'list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)



class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.select_related('user', 'product').all()
    serializer_class = ReviewViewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'uuid'

    def get_serializer_class(self):
        if self.request.method in ['POST', 'DELETE', 'PUT', 'PATCH']:
            return CreateReviewSerializer
        else:
            return ReviewViewSerializer
        
