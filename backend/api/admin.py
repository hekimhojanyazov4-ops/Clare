from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import (
    User, Category, Product, Cart, CartItem,
    Order, OrderItem, Favourite, Payment, ProductImage, Review,
    InboxConversation, InboxMessage,
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'phone', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('username', 'first_name', 'last_name', 'email', 'phone', 'uuid')
    ordering = ('username',)

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Goşmaça maglumatlar', {'fields': ('role', 'phone', 'uuid')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Goşmaça maglumatlar', {'fields': ('role', 'phone')}),
    )
    readonly_fields = ('uuid',)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'uuid')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('uuid',)


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    max_num = 5
    fields = (
        'is_primary',
        'image',
    )


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'discount_price', 'stock', 'date_added')
    list_filter = ('category', 'date_added')
    search_fields = ('name', 'description', 'uuid')
    ordering = ('-date_added',)
    readonly_fields = ('date_added', 'uuid')
    inlines = [ProductImageInline]
    fieldsets = (
        (None, {
            'fields': ('name', 'category', 'description')
        }),
        ('Bahalar we ätiýaçlyk', {
            'fields': ('price', 'discount_price', 'stock')
        }),
        ('Goşmaça', {
            'fields': ('uuid', 'date_added')
        }),
    )


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ('product', 'quantity', 'uuid')
    can_delete = False


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('uuid', 'customer', 'created_at')
    search_fields = ('uuid', 'customer__username', 'customer__first_name')
    readonly_fields = ('created_at', 'uuid')
    inlines = [CartItemInline]


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'quantity', 'uuid')
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('uuid', 'customer', 'created_at', 'total_price')
    search_fields = ('uuid', 'customer__username', 'customer__first_name')
    readonly_fields = ('created_at', 'total_price', 'uuid')
    inlines = [OrderItemInline]

    def total_price(self, obj):
        return obj.total_price
    total_price.short_description = 'Jemi baha'


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('order', 'product', 'quantity', 'uuid')
    search_fields = ('order__uuid', 'product__name', 'uuid')
    list_filter = ('order__created_at',)
    readonly_fields = ('uuid',)


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('cart', 'product', 'quantity', 'uuid')
    search_fields = ('cart__uuid', 'product__name', 'uuid')
    readonly_fields = ('uuid',)


@admin.register(Favourite)
class FavouriteAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'created_at', 'uuid')
    search_fields = ('user__username', 'product__name', 'uuid')
    list_filter = ('created_at',)
    readonly_fields = ('uuid', 'created_at')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'amount', 'status', 'order', 'created_at', 'uuid')
    list_filter = ('status', 'created_at')
    search_fields = ('user__username', 'order__uuid', 'uuid')
    readonly_fields = ('created_at', 'uuid')
    ordering = ('-created_at',)



@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('uuid', 'user', 'product', 'ratings', 'created_at', 'updated_at', 'comment',)
    list_filter = ('user', 'ratings',)
    list_editable = ('ratings',)
    ordering = ('-created_at',)


class InboxMessageInline(admin.TabularInline):
    model = InboxMessage
    extra = 0
    readonly_fields = ('uuid', 'sender', 'body', 'created_at', 'read_at')
    can_delete = False


@admin.register(InboxConversation)
class InboxConversationAdmin(admin.ModelAdmin):
    list_display = ('subject', 'user', 'created_at', 'updated_at')
    list_filter = ('created_at',)
    search_fields = ('subject', 'user__username', 'user__email')
    readonly_fields = ('uuid', 'created_at', 'updated_at')
    inlines = [InboxMessageInline]


@admin.register(InboxMessage)
class InboxMessageAdmin(admin.ModelAdmin):
    list_display = ('uuid', 'conversation', 'sender', 'created_at', 'read_at')
    search_fields = ('conversation__subject', 'sender__username', 'body')
    readonly_fields = ('uuid', 'created_at', 'read_at')