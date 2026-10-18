from django.db import IntegrityError, transaction
from django.db.models import Avg, Count, Q, Prefetch
from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.decorators import api_view, permission_classes

from .models import (
    User, Category, Product, ProductImage, Cart, CartItem,
    Order, OrderItem, Favourite, Payment, Review,
    InboxConversation, InboxMessage,
)
from .serializers import (
    UserSerializer, CategorySerializer, ProductSerializer,
    CartSerializer, CartItemSerializer, CartItemUpdateSerializer,
    OrderSerializer, FavouriteSerializer, FavouriteCreateSerializer,
    PaymentSerializer,
    ReviewViewSerializer, ReviewWriteSerializer,
    InboxConversationSerializer, InboxConversationCreateSerializer,
    InboxReplySerializer,
)
from .checkout import (
    cancel_checkout_for_user,
    cancel_pending_order,
    confirm_order_from_session,
    create_pending_order,
    process_stripe_event,
)
from .stripe_checkout import (
    StripeCheckoutError,
    create_checkout_session,
    retrieve_checkout_session,
    verify_webhook_signature,
)
import uuid


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
    queryset = Product.objects.select_related('category').prefetch_related(
        'images'
    ).annotate(
        rating_average=Avg('reviews__ratings'),
        review_count=Count('reviews', distinct=True),
    )
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

        with transaction.atomic():
            product = Product.objects.select_for_update().get(pk=product.pk)
            cart_item = CartItem.objects.select_for_update().filter(
                cart=cart,
                product=product,
            ).first()
            requested_quantity = quantity + (
                cart_item.quantity if cart_item else 0
            )
            if requested_quantity > product.stock:
                raise ValidationError({
                    'quantity': f'Only {product.stock} unit(s) are available.'
                })

            if cart_item:
                cart_item.quantity = requested_quantity
                cart_item.save(update_fields=['quantity'])
            else:
                cart_item = CartItem.objects.create(
                    cart=cart,
                    product=product,
                    quantity=quantity,
                )

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
        product = serializer.instance.product
        quantity = serializer.validated_data.get(
            'quantity',
            serializer.instance.quantity,
        )
        with transaction.atomic():
            product = Product.objects.select_for_update().get(pk=product.pk)
            if quantity > product.stock:
                raise ValidationError({
                    'quantity': f'Only {product.stock} unit(s) are available.'
                })
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
        return Response(
            {
                'detail': (
                    'Direct order creation is disabled. Use Stripe Checkout '
                    'to create and confirm orders.'
                )
            },
            status=status.HTTP_410_GONE,
        )

    @action(detail=False, methods=['post'])
    def checkout(self, request):
        if not settings.STRIPE_SECRET_KEY.startswith('sk_test_'):
            return Response(
                {
                    'detail': (
                        'Stripe test checkout is not configured. '
                        'Set STRIPE_SECRET_KEY on the backend.'
                    )
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        idempotency_header = request.headers.get('Idempotency-Key', '')
        try:
            idempotency_key = uuid.UUID(idempotency_header)
        except (TypeError, ValueError, AttributeError):
            return Response(
                {'detail': 'A valid Idempotency-Key header is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        pending_order = Order.objects.filter(
            customer=request.user,
            status=Order.Status.PENDING,
        ).first()
        if pending_order and pending_order.idempotency_key != idempotency_key:
            payment = Payment.objects.filter(order=pending_order).first()
            if payment and payment.stripe_session_id:
                try:
                    session = retrieve_checkout_session(payment.stripe_session_id)
                    if session.get('payment_status') == 'paid':
                        pending_order = confirm_order_from_session(session)
                        return Response({
                            'order_uuid': str(pending_order.uuid),
                            'status': pending_order.status,
                        })
                    if session.get('status') == 'expired':
                        cancel_pending_order(pending_order)
                    elif session.get('url'):
                        return Response({
                            'order_uuid': str(pending_order.uuid),
                            'checkout_url': session['url'],
                            'status': pending_order.status,
                        })
                    else:
                        return Response(
                            {
                                'order_uuid': str(pending_order.uuid),
                                'status': pending_order.status,
                                'detail': 'Payment is still processing.',
                            },
                            status=status.HTTP_202_ACCEPTED,
                        )
                except StripeCheckoutError as error:
                    return Response(
                        {'detail': str(error)},
                        status=status.HTTP_502_BAD_GATEWAY,
                    )
            elif pending_order.status == Order.Status.PENDING:
                return Response(
                    {'detail': 'Checkout is already being prepared. Retry shortly.'},
                    status=status.HTTP_409_CONFLICT,
                )

        try:
            order, payment, created = create_pending_order(
                request.user,
                idempotency_key,
            )
            if order.status != Order.Status.PENDING:
                return Response(
                    {
                        'order_uuid': str(order.uuid),
                        'status': order.status,
                        'detail': 'This checkout is no longer pending.',
                    },
                    status=status.HTTP_409_CONFLICT,
                )

            if payment and payment.stripe_session_id:
                session = retrieve_checkout_session(payment.stripe_session_id)
            else:
                session = create_checkout_session(
                    order,
                    payment,
                    frontend_url=settings.FRONTEND_URL,
                )
                payment.stripe_session_id = session['id']
                payment.save(update_fields=['stripe_session_id'])

            if session.get('payment_status') == 'paid':
                order = confirm_order_from_session(session)
                return Response({
                    'order_uuid': str(order.uuid),
                    'status': order.status,
                })
            if session.get('status') == 'expired':
                order = cancel_pending_order(order)
                return Response(
                    {
                        'order_uuid': str(order.uuid),
                        'status': order.status,
                        'detail': 'This checkout session expired. Start checkout again.',
                    },
                    status=status.HTTP_409_CONFLICT,
                )
            if session.get('status') == 'complete':
                return Response(
                    {
                        'order_uuid': str(order.uuid),
                        'status': order.status,
                        'detail': 'Payment is still processing.',
                    },
                    status=status.HTTP_202_ACCEPTED,
                )
            if not session.get('url'):
                raise StripeCheckoutError('Stripe did not return a checkout URL.')
        except StripeCheckoutError as error:
            if (
                'order' in locals()
                and order.status == Order.Status.PENDING
                and not payment.stripe_session_id
            ):
                cancel_pending_order(order)
            return Response(
                {'detail': str(error)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response({
            'order_uuid': str(order.uuid),
            'checkout_url': session['url'],
            'status': order.status,
        })

    @action(detail=False, methods=['post'])
    def cancel_checkout(self, request):
        order = get_object_or_404(
            Order.objects.filter(customer=request.user),
            uuid=request.data.get('order_uuid'),
        )
        try:
            order = cancel_checkout_for_user(order, request.user)
        except StripeCheckoutError as error:
            return Response(
                {'detail': str(error)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response({
            'order_uuid': str(order.uuid),
            'status': order.status,
        })

    @action(detail=False, methods=['get'])
    def checkout_status(self, request):
        session_id = request.query_params.get('session_id')
        payment = get_object_or_404(
            Payment.objects.select_related('order'),
            stripe_session_id=session_id,
            user=request.user,
        )
        try:
            session = retrieve_checkout_session(payment.stripe_session_id)
            if session.get('payment_status') == 'paid':
                order = confirm_order_from_session(session)
            elif session.get('status') == 'expired':
                order = cancel_pending_order(payment.order)
            else:
                order = payment.order
        except StripeCheckoutError as error:
            return Response(
                {'detail': str(error)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response({
            'order_uuid': str(order.uuid),
            'status': order.status,
        })



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
    http_method_names = ['get', 'head', 'options']

    def get_queryset(self):
        qs = Payment.objects.select_related('user', 'order')
        if self.request.user.is_staff:
            return qs.all()
        return qs.filter(user=self.request.user)

    def get_serializer_class(self):
        return PaymentSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]



class IsReviewOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return (
            request.method in permissions.SAFE_METHODS
            or request.user.is_staff
            or obj.user_id == request.user.id
        )


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.select_related('user', 'product').all()
    serializer_class = ReviewViewSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
        IsReviewOwnerOrReadOnly,
    ]
    lookup_field = 'uuid'

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ReviewWriteSerializer
        return ReviewViewSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        product_uuid = self.request.query_params.get('product_uuid')
        if product_uuid:
            queryset = queryset.filter(product__uuid=product_uuid)
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class InboxConversationViewSet(viewsets.GenericViewSet):
    queryset = InboxConversation.objects.all()
    serializer_class = InboxConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'uuid'
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        unread_filter = (
            Q(messages__read_at__isnull=True)
            & ~Q(messages__sender=self.request.user)
        )
        queryset = InboxConversation.objects.select_related('user').annotate(
            unread_count=Count('messages', filter=unread_filter, distinct=True)
        ).prefetch_related(
            Prefetch(
                'messages',
                queryset=InboxMessage.objects.select_related('sender'),
            )
        )
        if not self.request.user.is_staff:
            queryset = queryset.filter(user=self.request.user)
        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return InboxConversationCreateSerializer
        if self.action == 'reply':
            return InboxReplySerializer
        return InboxConversationSerializer

    def create(self, request, *args, **kwargs):
        if request.user.is_staff:
            raise PermissionDenied(
                'Support staff should reply to an existing customer conversation.'
            )
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        conversation = serializer.save()
        return Response(
            InboxConversationSerializer(
                conversation,
                context=self.get_serializer_context(),
            ).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['post'])
    def reply(self, request, uuid=None):
        conversation = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        InboxMessage.objects.create(
            conversation=conversation,
            sender=request.user,
            body=serializer.validated_data['body'],
        )
        now = timezone.now()
        conversation.messages.filter(
            read_at__isnull=True,
        ).exclude(sender=request.user).update(read_at=now)
        conversation.updated_at = now
        conversation.save(update_fields=['updated_at'])
        conversation.unread_count = 0
        return Response(InboxConversationSerializer(
            conversation,
            context=self.get_serializer_context(),
        ).data)

    @action(detail=True, methods=['patch'])
    def mark_read(self, request, uuid=None):
        conversation = self.get_object()
        conversation.messages.filter(
            read_at__isnull=True,
        ).exclude(sender=request.user).update(read_at=timezone.now())
        conversation.unread_count = 0
        return Response(InboxConversationSerializer(
            conversation,
            context=self.get_serializer_context(),
        ).data)


@csrf_exempt
def stripe_webhook(request):
    if request.method != 'POST':
        return JsonResponse({'detail': 'Method not allowed.'}, status=405)

    try:
        event = verify_webhook_signature(
            request.body,
            request.headers.get('Stripe-Signature', ''),
        )
        process_stripe_event(event)
    except StripeCheckoutError as error:
        status_code = (
            503
            if 'not configured' in str(error).lower()
            else 400
        )
        return JsonResponse({'detail': str(error)}, status=status_code)

    return JsonResponse({'received': True})
