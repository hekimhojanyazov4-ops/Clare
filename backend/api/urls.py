from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .serializers import CustomTokenObtainPairSerializer
from .views import (
    UserViewSet, CategoryViewSet, ProductViewSet,
    CartViewSet, CartItemViewSet, OrderViewSet,
    FavouriteViewSet, PaymentViewSet, ReviewViewSet,
    InboxConversationViewSet, stripe_webhook,
)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'products', ProductViewSet)
router.register(r'cart', CartViewSet, basename='cart')
router.register(r'cart-items', CartItemViewSet, basename='cartitem')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'favourites', FavouriteViewSet)
router.register(r'payments', PaymentViewSet)
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'inbox', InboxConversationViewSet, basename='inbox')

urlpatterns = [
    path('webhooks/stripe/', stripe_webhook, name='stripe_webhook'),
    path('', include(router.urls)),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='custom_auth_login'),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]