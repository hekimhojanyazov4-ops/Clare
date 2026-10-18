import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEYS = {
    language: "clare-language",
    theme: "clare-theme",
};

const translations = {
    "Free Express Shipping on orders $200!": ["Free Express Shipping on orders $200!", "Бесплатная экспресс-доставка при заказе от $200!", "200$-dan ýokary sargytlarda mugt ekspres eltip berme!", "$200 üzeri siparişlerde ücretsiz ekspres kargo!", "订单满$200享免费快速配送！"],
    "Click and Shop Now.": ["Click and Shop Now.", "Нажмите и покупайте.", "Basyň we häzir satyn alyň.", "Tıklayın ve hemen alışveriş yapın.", "点击立即购物。"],
    "My Orders": ["My Orders", "Мои заказы", "Sargytlarym", "Siparişlerim", "我的订单"],
    "Search your favorite product...": ["Search your favorite product...", "Найдите любимый товар...", "Halaýan önümiňizi gözläň...", "En sevdiğiniz ürünü arayın...", "搜索您喜欢的商品..."],
    "Search products": ["Search products", "Поиск товаров", "Önümleri gözle", "Ürünleri ara", "搜索商品"],
    "Account": ["Account", "Аккаунт", "Hasap", "Hesap", "账户"],
    "Favourites": ["Favourites", "Избранное", "Halanlarym", "Favoriler", "收藏夹"],
    "All Categories": ["All Categories", "Все категории", "Ähli kategoriýalar", "Tüm kategoriler", "所有分类"],
    "All products": ["All products", "Все товары", "Ähli önümler", "Tüm ürünler", "全部商品"],
    "Close navigation": ["Close navigation", "Закрыть навигацию", "Nawigasiýany ýap", "Gezinmeyi kapat", "关闭导航"],
    "Open navigation": ["Open navigation", "Открыть навигацию", "Nawigasiýany aç", "Gezinmeyi aç", "打开导航"],
    "Menu": ["Menu", "Меню", "Menýu", "Menü", "菜单"],
    "Home": ["Home", "Главная", "Baş sahypa", "Ana sayfa", "首页"],
    "Shop": ["Shop", "Магазин", "Dükan", "Mağaza", "商店"],
    "Pages": ["Pages", "Страницы", "Sahypalar", "Sayfalar", "页面"],
    "Orders": ["Orders", "Заказы", "Sargytlar", "Siparişler", "订单"],
    "Payments": ["Payments", "Платежи", "Tölegler", "Ödemeler", "付款"],
    "Admin": ["Admin", "Администратор", "Dolandyryjy", "Yönetici", "管理员"],
    "Shop now": ["Shop now", "Купить сейчас", "Häzir satyn al", "Hemen alışveriş yap", "立即选购"],
    "OUR COLLECTION": ["OUR COLLECTION", "НАША КОЛЛЕКЦИЯ", "BIZIŇ KOLLEKSIÝAMYZ", "KOLEKSİYONUMUZ", "我们的系列"],
    "Products": ["Products", "Товары", "Önümler", "Ürünler", "商品"],
    "Discover our products and find something perfect for you.": ["Discover our products and find something perfect for you.", "Откройте для себя наши товары и найдите то, что подходит именно вам.", "Önümlerimizi öwreniň we özüňize laýyk zady tapyň.", "Ürünlerimizi keşfedin ve size uygun olanı bulun.", "探索我们的商品，找到适合您的选择。"],
    "Categories": ["Categories", "Категории", "Kategoriýalar", "Kategoriler", "分类"],
    "Sort by": ["Sort by", "Сортировка", "Tertiple", "Sıralama", "排序方式"],
    "Price: Low to High": ["Price: Low to High", "Цена: по возрастанию", "Bahasy: arzandan gymmada", "Fiyat: artan", "价格：从低到高"],
    "Price: High to Low": ["Price: High to Low", "Цена: по убыванию", "Bahasy: gymmatdan arzana", "Fiyat: azalan", "价格：从高到低"],
    "Name: A–Z": ["Name: A–Z", "Название: А–Я", "Ady: A–Z", "Ad: A–Z", "名称：A–Z"],
    "Stock: High to Low": ["Stock: High to Low", "Запас: по убыванию", "Ätiýaçlyk: köpdenden azda", "Stok: çoktan aza", "库存：从高到低"],
    "Loading products...": ["Loading products...", "Загрузка товаров...", "Önümler ýüklenýär...", "Ürünler yükleniyor...", "正在加载商品..."],
    "Unable to load products": ["Unable to load products", "Не удалось загрузить товары", "Önümleri ýükläp bolmady", "Ürünler yüklenemedi", "无法加载商品"],
    "Try Again": ["Try Again", "Повторить", "Gaýtadan synanyş", "Tekrar dene", "重试"],
    "No products available": ["No products available", "Нет доступных товаров", "Elýeterli önüm ýok", "Mevcut ürün yok", "暂无商品"],
    "There are currently no products to display.": ["There are currently no products to display.", "Сейчас нет товаров для отображения.", "Häzir görkezmek üçin önüm ýok.", "Şu anda gösterilecek ürün yok.", "目前没有可显示的商品。"],
    "Add to cart": ["Add to cart", "В корзину", "Sebede goş", "Sepete ekle", "加入购物车"],
    "Out of stock": ["Out of stock", "Нет в наличии", "Haryt ýok", "Stokta yok", "缺货"],
    "Adding": ["Adding", "Добавление", "Goşulýar", "Ekleniyor", "正在添加"],
    "Added to cart": ["Added to cart", "Добавлено в корзину", "Sebede goşuldy", "Sepete eklendi", "已加入购物车"],
    "View Product": ["View Product", "Посмотреть товар", "Önümi gör", "Ürünü görüntüle", "查看商品"],
    "Uncategorized": ["Uncategorized", "Без категории", "Kategoriýasyz", "Kategorisiz", "未分类"],
    "review": ["review", "отзыв", "syn", "yorum", "条评价"],
    "reviews": ["reviews", "отзывов", "syn", "yorum", "条评价"],
    "Decrease quantity": ["Decrease quantity", "Уменьшить количество", "Mukdary azalt", "Adedi azalt", "减少数量"],
    "Increase quantity": ["Increase quantity", "Увеличить количество", "Mukdary köpelt", "Adedi artır", "增加数量"],
    "Quantity": ["Quantity", "Количество", "Mukdar", "Adet", "数量"],
    "Add to favourites": ["Add to favourites", "Добавить в избранное", "Halanlaryma goş", "Favorilere ekle", "加入收藏"],
    "Remove from favourites": ["Remove from favourites", "Удалить из избранного", "Halanlarymdan aýyr", "Favorilerden kaldır", "取消收藏"],
    "Related Products": ["Related Products", "Похожие товары", "Meňzeş önümler", "Benzer ürünler", "相关商品"],
    "Recently Viewed": ["Recently Viewed", "Недавно просмотренные", "Ýakynda görülenler", "Son görüntülenenler", "最近浏览"],
    "Previous product": ["Previous product", "Предыдущий товар", "Öňki önüm", "Önceki ürün", "上一个商品"],
    "Next product": ["Next product", "Следующий товар", "Indiki önüm", "Sonraki ürün", "下一个商品"],
    "Login": ["Login", "Войти", "Giriş", "Giriş yap", "登录"],
    "Register": ["Register", "Регистрация", "Hasaba al", "Kayıt ol", "注册"],
    "Logout": ["Logout", "Выйти", "Çykyş", "Çıkış yap", "退出"],
    "Administration": ["Administration", "Администрирование", "Dolandyryş", "Yönetim", "管理"],
    "Manage your online store": ["Manage your online store", "Управляйте своим интернет-магазином", "Onlaýn dükanyňyzy dolandyryň", "Çevrimiçi mağazanızı yönetin", "管理您的在线商店"],
    "Dashboard": ["Dashboard", "Панель управления", "Dolandyryş paneli", "Kontrol paneli", "仪表盘"],
    "Users": ["Users", "Пользователи", "Ulanyjylar", "Kullanıcılar", "用户"],
    "Carts": ["Carts", "Корзины", "Sebetler", "Sepetler", "购物车"],
    "MANAGEMENT": ["MANAGEMENT", "УПРАВЛЕНИЕ", "DOLANDYRYŞ", "YÖNETİM", "管理"],
    "Administrator": ["Administrator", "Администратор", "Dolandyryjy", "Yönetici", "管理员"],
    "Log out": ["Log out", "Выйти", "Ulgamdan çyk", "Çıkış yap", "退出登录"],
    "Switch to dark mode": ["Switch to dark mode", "Включить темную тему", "Garaňky mowzuga geç", "Koyu temaya geç", "切换到深色模式"],
    "Switch to light mode": ["Switch to light mode", "Включить светлую тему", "Açyk mowzuga geç", "Açık temaya geç", "切换到浅色模式"],
    "Language": ["Language", "Язык", "Dil", "Dil", "语言"],
    "Free Shipping": ["Free Shipping", "Бесплатная доставка", "Mugt eltip berme", "Ücretsiz kargo", "免费配送"],
    "Easy Returns": ["Easy Returns", "Легкий возврат", "Aňsat gaýtaryş", "Kolay iade", "轻松退货"],
    "Secure Payment": ["Secure Payment", "Безопасная оплата", "Howpsuz töleg", "Güvenli ödeme", "安全支付"],
    "Shopping Cart": ["Shopping Cart", "Корзина", "Söwda sebedi", "Alışveriş Sepeti", "购物车"],
    "Your Account": ["Your Account", "Ваш аккаунт", "Hasabyňyz", "Hesabınız", "您的账户"],
    "Sign in": ["Sign in", "Войти", "Ulgama gir", "Giriş yap", "登录"],
    "Considered fashion pieces to bring a little more character to your everyday wardrobe.": ["Considered fashion pieces to bring a little more character to your everyday wardrobe.", "Продуманные модели, которые добавят индивидуальности вашему повседневному гардеробу.", "Gündelik geýimleriňize aýratynlyk goşýan oýlanyşykly egin-eşikler.", "Günlük gardırobunuza karakter katan özenle seçilmiş moda parçaları.", "为日常衣橱增添个性的精心设计时尚单品。"],
    "Back to top": ["Back to top", "Наверх", "Ýokary geç", "Başa dön", "返回顶部"],
    "Your shopping bag": ["Your shopping bag", "Ваша корзина", "Söwda sebediňiz", "Alışveriş çantanız", "您的购物袋"],
    "YOUR SHOPPING BAG": ["YOUR SHOPPING BAG", "ВАША КОРЗИНА", "SÖWDA SEBEDIŇIZ", "ALIŞVERİŞ ÇANTANIZ", "您的购物袋"],
    "Review your products before checkout.": ["Review your products before checkout.", "Проверьте товары перед оформлением заказа.", "Sargydy tassyklamazdan öň önümleri gözden geçiriň.", "Ödeme öncesi ürünlerinizi inceleyin.", "结账前请检查您的商品。"],
    "Your cart is empty": ["Your cart is empty", "Ваша корзина пуста", "Sebediňiz boş", "Sepetiniz boş", "购物车为空"],
    "Add products to your cart to see them here.": ["Add products to your cart to see them here.", "Добавьте товары в корзину, чтобы увидеть их здесь.", "Önümleri şu ýerde görmek üçin sebede goşuň.", "Ürünleri burada görmek için sepetinize ekleyin.", "将商品加入购物车后即可在此查看。"],
    "Browse products": ["Browse products", "Смотреть товары", "Önümlere göz aýla", "Ürünlere göz at", "浏览商品"],
    "Continue shopping": ["Continue shopping", "Продолжить покупки", "Söwda etmegi dowam et", "Alışverişe devam et", "继续购物"],
    "Loading your cart...": ["Loading your cart...", "Загрузка корзины...", "Sebet ýüklenýär...", "Sepetiniz yükleniyor...", "正在加载购物车..."],
    "Shopping cart": ["Shopping cart", "Корзина", "Söwda sebedi", "Alışveriş sepeti", "购物车"],
    "Checkout": ["Checkout", "Оформить заказ", "Sargydy tassyklamak", "Ödemeye geç", "结账"],
    "SECURE CHECKOUT": ["SECURE CHECKOUT", "БЕЗОПАСНОЕ ОФОРМЛЕНИЕ", "HOWPSUZ TÖLEG", "GÜVENLİ ÖDEME", "安全结账"],
    "Review your order before continuing to Stripe.": ["Review your order before continuing to Stripe.", "Проверьте заказ перед переходом в Stripe.", "Stripe-a geçmezden öň sargydyňyzy barlaň.", "Stripe'a geçmeden önce siparişinizi inceleyin.", "前往 Stripe 前请检查订单。"],
    "Back to cart": ["Back to cart", "Вернуться в корзину", "Sebede dolan", "Sepete dön", "返回购物车"],
    "Order summary": ["Order summary", "Состав заказа", "Sargyt jemi", "Sipariş özeti", "订单摘要"],
    "Final price and stock are verified securely before payment.": ["Final price and stock are verified securely before payment.", "Перед оплатой сервер проверит итоговую цену и наличие.", "Tölegden öň jemleýji baha we ätiýaçlyk serwerden barlanýar.", "Ödeme öncesinde toplam fiyat ve stok sunucuda doğrulanır.", "付款前将由服务器核验最终价格和库存。"],
    "Sign in to checkout": ["Sign in to checkout", "Войдите для оформления заказа", "Sargyt üçin ulgama giriň", "Ödeme için giriş yapın", "登录后结账"],
    "Opening secure checkout...": ["Opening secure checkout...", "Открываем безопасную оплату...", "Howpsuz töleg açylýar...", "Güvenli ödeme açılıyor...", "正在打开安全结账..."],
    "Continue to secure payment": ["Continue to secure payment", "Перейти к безопасной оплате", "Howpsuz tölege geç", "Güvenli ödemeye devam et", "继续安全付款"],
    "Payment details are handled securely by Stripe.": ["Payment details are handled securely by Stripe.", "Данные оплаты безопасно обрабатываются Stripe.", "Töleg maglumatlary Stripe tarapyndan howpsuz işlenýär.", "Ödeme bilgileri Stripe tarafından güvenle işlenir.", "付款信息由 Stripe 安全处理。"],
    "Payment confirmed": ["Payment confirmed", "Оплата подтверждена", "Töleg tassyklanyldy", "Ödeme onaylandı", "付款已确认"],
    "Checkout cancelled": ["Checkout cancelled", "Оформление отменено", "Sargyt ýatyryldy", "Ödeme iptal edildi", "结账已取消"],
    "Verifying payment": ["Verifying payment", "Проверяем оплату", "Töleg barlanýar", "Ödeme doğrulanıyor", "正在验证付款"],
    "Payment status unavailable": ["Payment status unavailable", "Статус оплаты недоступен", "Töleg ýagdaýy elýeterli däl", "Ödeme durumu kullanılamıyor", "付款状态不可用"],
    "Your order has been confirmed.": ["Your order has been confirmed.", "Ваш заказ подтверждён.", "Sargydyňyz tassyklanyldy.", "Siparişiniz onaylandı.", "您的订单已确认。"],
    "No payment was confirmed. You can return to your cart.": ["No payment was confirmed. You can return to your cart.", "Оплата не подтверждена. Вы можете вернуться в корзину.", "Töleg tassyklanmady. Sebede dolanyp bilersiňiz.", "Ödeme onaylanmadı. Sepetinize dönebilirsiniz.", "付款尚未确认。您可以返回购物车。"],
    "Stripe is processing your payment. This page will update when it is verified.": ["Stripe is processing your payment. This page will update when it is verified.", "Stripe обрабатывает платёж. Страница обновится после подтверждения.", "Stripe tölegiňizi işleýär. Tassyklanandan soň sahypa täzelener.", "Stripe ödemenizi işliyor. Doğrulandığında sayfa güncellenecek.", "Stripe 正在处理付款，验证后此页面将更新。"],
    "Order reference": ["Order reference", "Номер заказа", "Sargyt belgisi", "Sipariş numarası", "订单编号"],
    "View orders": ["View orders", "Посмотреть заказы", "Sargytlary gör", "Siparişleri görüntüle", "查看订单"],
    "Return to cart": ["Return to cart", "Вернуться в корзину", "Sebede dolan", "Sepete dön", "返回购物车"],
    "Order": ["Order", "Заказ", "Sargyt", "Sipariş", "订单"],
    "PENDING": ["Pending payment", "Ожидает оплаты", "Tölege garaşýar", "Ödeme bekleniyor", "待付款"],
    "CONFIRMED": ["Confirmed", "Подтверждён", "Tassyklanyldy", "Onaylandı", "已确认"],
    "CANCELLED": ["Cancelled", "Отменён", "Ýatyryldy", "İptal edildi", "已取消"],
    "Subtotal": ["Subtotal", "Промежуточный итог", "Ara jemi", "Ara toplam", "小计"],
    "Total": ["Total", "Итого", "Jemi", "Toplam", "总计"],
    "WELCOME BACK": ["WELCOME BACK", "С ВОЗВРАЩЕНИЕМ", "HOŞ GELDIŇIZ", "TEKRAR HOŞ GELDİNİZ", "欢迎回来"],
    "Login to your account.": ["Login to your account.", "Войдите в свой аккаунт.", "Hasabyňyza giriň.", "Hesabınıza giriş yapın.", "登录您的账户。"],
    "Username": ["Username", "Имя пользователя", "Ulanyjy ady", "Kullanıcı adı", "用户名"],
    "Enter your username": ["Enter your username", "Введите имя пользователя", "Ulanyjy adyňyzy giriziň", "Kullanıcı adınızı girin", "输入用户名"],
    "Password": ["Password", "Пароль", "Açar söz", "Şifre", "密码"],
    "Enter your password": ["Enter your password", "Введите пароль", "Açar sözüňizi giriziň", "Şifrenizi girin", "输入密码"],
    "Hide password": ["Hide password", "Скрыть пароль", "Açar sözi gizle", "Şifreyi gizle", "隐藏密码"],
    "Show password": ["Show password", "Показать пароль", "Açar sözi görkez", "Şifreyi göster", "显示密码"],
    "Logging in...": ["Logging in...", "Вход...", "Girilýär...", "Giriş yapılıyor...", "正在登录..."],
    "Don't have an account?": ["Don't have an account?", "Нет аккаунта?", "Hasabyňyz ýokmy?", "Hesabınız yok mu?", "还没有账户？"],
    "No ratings yet": ["No ratings yet", "Пока нет оценок", "Entäk baha ýok", "Henüz puan yok", "暂无评分"],
    "Refresh": ["Refresh", "Обновить", "Täzele", "Yenile", "刷新"],
    "Search": ["Search", "Поиск", "Gözle", "Ara", "搜索"],
    "records": ["records", "записей", "ýazgy", "kayıt", "条记录"],
    "Delete this record?": ["Delete this record?", "Удалить эту запись?", "Bu ýazgy pozulsynmy?", "Bu kayıt silinsin mi?", "删除此记录？"],
    "Unable to load data.": ["Unable to load data.", "Не удалось загрузить данные.", "Maglumatlary ýükläp bolmady.", "Veriler yüklenemedi.", "无法加载数据。"],
    "No users found": ["No users found", "Пользователи не найдены", "Ulanyjy tapylmady", "Kullanıcı bulunamadı", "未找到用户"],
    "No products found": ["No products found", "Товары не найдены", "Önüm tapylmady", "Ürün bulunamadı", "未找到商品"],
    "No orders found": ["No orders found", "Заказы не найдены", "Sargyt tapylmady", "Sipariş bulunamadı", "未找到订单"],
    "Open admin menu": ["Open admin menu", "Открыть меню администратора", "Dolandyryjy menýusyny aç", "Yönetici menüsünü aç", "打开管理菜单"],
    "All rights reserved.": ["All rights reserved.", "Все права защищены.", "Ähli hukuklar goralan.", "Tüm hakları saklıdır.", "版权所有。"],
    "Footer navigation": ["Footer navigation", "Навигация в подвале", "Aşaky menýu", "Alt bilgi gezinmesi", "页脚导航"],
    "Delete": ["Delete", "Удалить", "Poz", "Sil", "删除"],
    "Actions": ["Actions", "Действия", "Hereketler", "İşlemler", "操作"],
    "Select all records": ["Select all records", "Выбрать все записи", "Ähli ýazgylary saýla", "Tüm kayıtları seç", "选择所有记录"],
    "All categories": ["All categories", "Все категории", "Ähli kategoriýalar", "Tüm kategoriler", "所有分类"],
    "All statuses": ["All statuses", "Все статусы", "Ähli ýagdaýlar", "Tüm durumlar", "所有状态"],
    "Pending": ["Pending", "В ожидании", "Garaşylýar", "Beklemede", "待处理"],
    "Confirmed": ["Confirmed", "Подтверждено", "Tassyklandy", "Onaylandı", "已确认"],
    "Cancelled": ["Cancelled", "Отменено", "Ýatyryldy", "İptal edildi", "已取消"],
    "Customer": ["Customer", "Покупатель", "Müşderi", "Müşteri", "客户"],
    "Product": ["Product", "Товар", "Önüm", "Ürün", "商品"],
    "Items": ["Items", "Товары", "Önümler", "Ürünler", "商品"],
    "Created": ["Created", "Создано", "Döredildi", "Oluşturuldu", "创建时间"],
    "Added": ["Added", "Добавлено", "Goşuldy", "Eklendi", "添加时间"],
    "Amount": ["Amount", "Сумма", "Mukdar", "Tutar", "金额"],
    "Status": ["Status", "Статус", "Ýagdaý", "Durum", "状态"],
    "Category": ["Category", "Категория", "Kategoriýa", "Kategori", "分类"],
    "Price": ["Price", "Цена", "Baha", "Fiyat", "价格"],
    "Stock": ["Stock", "Запас", "Ätiýaçlyk", "Stok", "库存"],
    "Product name": ["Product name", "Название товара", "Önümiň ady", "Ürün adı", "商品名称"],
    "Discount price": ["Discount price", "Цена со скидкой", "Arzanladyş bahasy", "İndirimli fiyat", "折扣价"],
    "Description": ["Description", "Описание", "Düşündiriş", "Açıklama", "描述"],
    "Product images": ["Product images", "Изображения товара", "Önümiň suratlary", "Ürün görselleri", "商品图片"],
    "First name": ["First name", "Имя", "Ady", "Ad", "名"],
    "Last name": ["Last name", "Фамилия", "Familiýasy", "Soyadı", "姓"],
    "Email": ["Email", "Эл. почта", "E-poçta", "E-posta", "电子邮箱"],
    "Phone": ["Phone", "Телефон", "Telefon", "Telefon", "电话"],
    "Role": ["Role", "Роль", "Wezipe", "Rol", "角色"],
    "All Products": ["All Products", "Все товары", "Ähli önümler", "Tüm ürünler", "全部商品"],
    "Back to Products": ["Back to Products", "Назад к товарам", "Önümlere dolan", "Ürünlere dön", "返回商品列表"],
    "Product not found": ["Product not found", "Товар не найден", "Önüm tapylmady", "Ürün bulunamadı", "未找到商品"],
    "This product could not be found.": ["This product could not be found.", "Не удалось найти этот товар.", "Bu önümi tapyp bolmady.", "Bu ürün bulunamadı.", "找不到此商品。"],
    "Show previous product image": ["Show previous product image", "Показать предыдущее изображение товара", "Önümiň öňki suratyny görkez", "Önceki ürün görselini göster", "显示上一张商品图片"],
    "Show next product image": ["Show next product image", "Показать следующее изображение товара", "Önümiň indiki suratyny görkez", "Sonraki ürün görselini göster", "显示下一张商品图片"],
    "PRODUCT DETAILS": ["PRODUCT DETAILS", "ИНФОРМАЦИЯ О ТОВАРЕ", "ÖNÜM BARADA MAGLUMAT", "ÜRÜN DETAYLARI", "商品详情"],
    "PRODUCT CODE": ["PRODUCT CODE", "КОД ТОВАРА", "ÖNÜM KODY", "ÜRÜN KODU", "商品编号"],
    "SAVE": ["SAVE", "СКИДКА", "TASLAMA", "İNDİRİM", "优惠"],
    "No description available.": ["No description available.", "Описание отсутствует.", "Düşündiriş ýok.", "Açıklama mevcut değil.", "暂无商品描述。"],
    "In stock": ["In stock", "В наличии", "Haryt bar", "Stokta", "有货"],
    "item": ["item", "единица", "sany", "adet", "件"],
    "items": ["items", "единицы", "sany", "adet", "件"],
    "Stock information unavailable": ["Stock information unavailable", "Информация о наличии недоступна", "Haryt ätiýaçlygy barada maglumat elýeterli däl", "Stok bilgisi mevcut değil", "库存信息不可用"],
    "Min. 1 · Max.": ["Min. 1 · Max.", "Мин. 1 · Макс.", "Iň az 1 · Iň köp", "En az 1 · En çok", "最少 1 · 最多"],
    "Working...": ["Working...", "Обработка...", "Işlenýär...", "İşleniyor...", "正在处理..."],
    "Add to Cart": ["Add to Cart", "Добавить в корзину", "Sebede goş", "Sepete ekle", "加入购物车"],
    "BROWSE THE COLLECTION": ["BROWSE THE COLLECTION", "СМОТРИТЕ КОЛЛЕКЦИЮ", "KOLLEKSIÝANY GÖRÜŇ", "KOLEKSİYONU KEŞFEDİN", "浏览系列"],
    "Loading all products...": ["Loading all products...", "Загрузка всех товаров...", "Ähli önümler ýüklenýär...", "Tüm ürünler yükleniyor...", "正在加载所有商品..."],
    "No products are available right now.": ["No products are available right now.", "Сейчас товары недоступны.", "Häzir önüm elýeterli däl.", "Şu anda ürün mevcut değil.", "目前暂无商品。"],
    "MORE TO EXPLORE": ["MORE TO EXPLORE", "БОЛЬШЕ ТОВАРОВ", "ÝENE-DE KÖP ÖNÜMLER", "KEŞFEDECEK DAHA FAZLASI", "探索更多"],
    "Related products": ["Related products", "Похожие товары", "Meňzeş önümler", "Benzer ürünler", "相关商品"],
    "No related products are available right now.": ["No related products are available right now.", "Похожие товары пока недоступны.", "Häzir meňzeş önüm ýok.", "Şu anda benzer ürün yok.", "目前没有相关商品。"],
    "YOUR BROWSING HISTORY": ["YOUR BROWSING HISTORY", "ИСТОРИЯ ПРОСМОТРОВ", "GÖREN ÖNÜMLERIŇIZ", "GEZİNME GEÇMİŞİNİZ", "您的浏览历史"],
    "Recently viewed": ["Recently viewed", "Недавно просмотренные", "Ýakynda görülenler", "Son görüntülenenler", "最近浏览"],
    "Loading recently viewed products...": ["Loading recently viewed products...", "Загрузка недавно просмотренных товаров...", "Ýakynda görülen önümler ýüklenýär...", "Son görüntülenen ürünler yükleniyor...", "正在加载最近浏览的商品..."],
    "Products you view will appear here.": ["Products you view will appear here.", "Просмотренные товары появятся здесь.", "Gören önümleriňiz şu ýerde görkeziler.", "Görüntülediğiniz ürünler burada görünür.", "您浏览过的商品会显示在这里。"],
    "Unable to load this product.": ["Unable to load this product.", "Не удалось загрузить этот товар.", "Bu önümi ýükläp bolmady.", "Bu ürün yüklenemedi.", "无法加载此商品。"],
    "Please enter a quantity.": ["Please enter a quantity.", "Введите количество.", "Mukdary giriziň.", "Lütfen adet girin.", "请输入数量。"],
    "Enter a whole number greater than zero.": ["Enter a whole number greater than zero.", "Введите целое число больше нуля.", "Noldan uly bitin san giriziň.", "Sıfırdan büyük bir tam sayı girin.", "请输入大于零的整数。"],
    "Product information is unavailable.": ["Product information is unavailable.", "Информация о товаре недоступна.", "Önüm barada maglumat elýeterli däl.", "Ürün bilgisi mevcut değil.", "商品信息不可用。"],
    "Max available:": ["Max available:", "Доступно максимум:", "Iň köp elýeterli:", "Maksimum stok:", "最多可购买："],
    "Checkout coming soon": ["Checkout coming soon", "Оформление заказа скоро появится", "Töleg ýakynda elýeterli bolar", "Ödeme yakında kullanıma sunulacak", "结账功能即将推出"],
    "Select": ["Select", "Выбрать", "Saýla", "Seç", "选择"],
    "Edit": ["Edit", "Изменить", "Üýtget", "Düzenle", "编辑"],
    "record": ["record", "запись", "ýazgy", "kayıt", "条记录"],
    "CUSTOMER FEEDBACK": ["CUSTOMER FEEDBACK", "ОТЗЫВЫ ПОКУПАТЕЛЕЙ", "MÜŞDERILERIŇ PIKIRLERI", "MÜŞTERİ GERİ BİLDİRİMİ", "客户反馈"],
    "Reviews": ["Reviews", "Отзывы", "Synlar", "Yorumlar", "评价"],
    "Choose a rating from 1 to 5 stars": ["Choose a rating from 1 to 5 stars", "Выберите оценку от 1 до 5 звезд", "1-den 5-e çenli baha saýlaň", "1 ile 5 yıldız arasında puan verin", "选择 1 到 5 星评分"],
    "star": ["star", "звезда", "ýyldyz", "yıldız", "星"],
    "stars": ["stars", "звезд", "ýyldyz", "yıldız", "星"],
    "out of 5 stars": ["out of 5 stars", "из 5 звезд", "5 ýyldyzdan", "5 yıldız üzerinden", "满分 5 星"],
    "Choose a star rating before submitting.": ["Choose a star rating before submitting.", "Перед отправкой выберите оценку.", "Ibermezden öň baha saýlaň.", "Göndermeden önce bir puan seçin.", "提交前请选择星级。"],
    "Write a comment before submitting.": ["Write a comment before submitting.", "Перед отправкой напишите комментарий.", "Ibermezden öň teswir ýazyň.", "Göndermeden önce yorum yazın.", "提交前请填写评论。"],
    "Your review was updated.": ["Your review was updated.", "Ваш отзыв обновлен.", "Siziň synyňyz täzelendi.", "Yorumunuz güncellendi.", "您的评价已更新。"],
    "Your review was submitted.": ["Your review was submitted.", "Ваш отзыв отправлен.", "Siziň synyňyz iberildi.", "Yorumunuz gönderildi.", "您的评价已提交。"],
    "You’ve already reviewed this product.": ["You’ve already reviewed this product.", "Вы уже оставили отзыв об этом товаре.", "Bu önüm barada eýýäm syn ýazdyňyz.", "Bu ürünü zaten değerlendirdiniz.", "您已评价此商品。"],
    "Edit your review": ["Edit your review", "Изменить отзыв", "Synyňyzy üýtgediň", "Yorumunuzu düzenleyin", "编辑评价"],
    "Update your review": ["Update your review", "Обновить отзыв", "Synyňyzy täzeläň", "Yorumunuzu güncelleyin", "更新评价"],
    "Write a review": ["Write a review", "Написать отзыв", "Syn ýazyň", "Yorum yazın", "撰写评价"],
    "Your rating": ["Your rating", "Ваша оценка", "Siziň bahaňyz", "Puanınız", "您的评分"],
    "Your comment": ["Your comment", "Ваш комментарий", "Siziň teswiriňiz", "Yorumunuz", "您的评论"],
    "What did you think about this product?": ["What did you think about this product?", "Что вы думаете об этом товаре?", "Bu önüm barada näme pikir edýärsiňiz?", "Bu ürün hakkında ne düşündünüz?", "您对这件商品有什么看法？"],
    "Submit review": ["Submit review", "Отправить отзыв", "Syn iber", "Yorumu gönder", "提交评价"],
    "Saving...": ["Saving...", "Сохранение...", "Ýatda saklanylýar...", "Kaydediliyor...", "正在保存..."],
    "Cancel": ["Cancel", "Отмена", "Ýatyr", "İptal", "取消"],
    "Save changes": ["Save changes", "Сохранить изменения", "Üýtgeşmeleri ýatda sakla", "Değişiklikleri kaydet", "保存更改"],
    "Revenue": ["Revenue", "Доход", "Girdejiler", "Gelir", "收入"],
    "Products in carts": ["Products in carts", "Товары в корзинах", "Sebetlerdäki önümler", "Sepetlerdeki ürünler", "购物车中的商品"],
    "Customers by completed purchase value": ["Customers by completed purchase value", "Покупатели по сумме завершенных покупок", "Tamamlanan satyn almalaryň jemi boýunça müşderiler", "Tamamlanan alışveriş tutarına göre müşteriler", "按已完成购买金额排列的客户"],
    "Review active customer carts.": ["Review active customer carts.", "Просматривайте активные корзины покупателей.", "Müşderileriň işjeň sebetlerine göz aýlaň.", "Aktif müşteri sepetlerini inceleyin.", "查看客户的活跃购物车。"],
    "Review products saved by customers.": ["Review products saved by customers.", "Просматривайте товары, сохраненные покупателями.", "Müşderileriň halan önümlerine göz aýlaň.", "Müşterilerin kaydettiği ürünleri inceleyin.", "查看客户收藏的商品。"],
    "Review and manage customer orders.": ["Review and manage customer orders.", "Просматривайте и управляйте заказами покупателей.", "Müşderi sargytlaryna göz aýlaň we dolandyryň.", "Müşteri siparişlerini inceleyin ve yönetin.", "查看和管理客户订单。"],
    "Manage the products available in your store.": ["Manage the products available in your store.", "Управляйте товарами вашего магазина.", "Dükanyňyzdaky önümleri dolandyryň.", "Mağazanızdaki ürünleri yönetin.", "管理商店中的商品。"],
    "Monitor payment records and statuses.": ["Monitor payment records and statuses.", "Отслеживайте платежи и их статусы.", "Töleg ýazgylaryna we ýagdaýlaryna gözegçilik ediň.", "Ödeme kayıtlarını ve durumlarını takip edin.", "监控付款记录和状态。"],
    "Manage registered customers and administrators.": ["Manage registered customers and administrators.", "Управляйте зарегистрированными покупателями и администраторами.", "Hasaba alnan müşderileri we dolandyryjylary dolandyryň.", "Kayıtlı müşterileri ve yöneticileri yönetin.", "管理已注册客户和管理员。"],
    "YOUR ACCOUNT": ["YOUR ACCOUNT", "ВАШ АККАУНТ", "SIZIŇ HASABYŇYZ", "HESABINIZ", "您的账户"],
    "View and manage your orders.": ["View and manage your orders.", "Просматривайте и управляйте заказами.", "Sargytlaryňyza göz aýlaň we dolandyryň.", "Siparişlerinizi görüntüleyin ve yönetin.", "查看和管理您的订单。"],
    "No orders yet": ["No orders yet", "Заказов пока нет", "Entäk sargyt ýok", "Henüz sipariş yok", "暂无订单"],
    "Your orders will appear here.": ["Your orders will appear here.", "Ваши заказы появятся здесь.", "Sargytlaryňyz şu ýerde görkeziler.", "Siparişleriniz burada görünecek.", "您的订单会显示在这里。"],
    "Explore the collection": ["Explore the collection", "Посмотреть коллекцию", "Kolleksiýa göz aýla", "Koleksiyonu keşfet", "浏览系列"],
    "View your payment history.": ["View your payment history.", "Просматривайте историю платежей.", "Töleg taryhyňyza göz aýlaň.", "Ödeme geçmişinizi görüntüleyin.", "查看您的付款记录。"],
    "No payments yet": ["No payments yet", "Платежей пока нет", "Entäk töleg ýok", "Henüz ödeme yok", "暂无付款记录"],
    "Your payments will appear here.": ["Your payments will appear here.", "Ваши платежи появятся здесь.", "Tölegleriňiz şu ýerde görkeziler.", "Ödemeleriniz burada görünecek.", "您的付款记录会显示在这里。"],
    "Page Not Found": ["Page Not Found", "Страница не найдена", "Sahypa tapylmady", "Sayfa bulunamadı", "页面未找到"],
    "The page you are looking for does not exist.": ["The page you are looking for does not exist.", "Страница, которую вы ищете, не существует.", "Gözleýän sahypaňyz ýok.", "Aradığınız sayfa mevcut değil.", "您访问的页面不存在。"],
    "Back to Clare": ["Back to Clare", "Вернуться в Clare", "Clare-e dolan", "Clare'e dön", "返回 Clare"],
    "SAVED FOR LATER": ["SAVED FOR LATER", "СОХРАНЕНО НА ПОТОМ", "SOŇ ÜÇIN ÝATDA SAKLANDY", "SONRA İÇİN KAYDEDİLDİ", "稍后查看"],
    "Keep the products you love close by.": ["Keep the products you love close by.", "Сохраните любимые товары под рукой.", "Halaýan önümleriňizi ýanyňyzda saklaň.", "Sevdiğiniz ürünleri elinizin altında tutun.", "将喜欢的商品收藏起来。"],
    "No favourites yet": ["No favourites yet", "В избранном пока пусто", "Entäk halaýan önüm ýok", "Henüz favori yok", "暂无收藏"],
    "Save products you like and they will appear here.": ["Save products you like and they will appear here.", "Сохраните понравившиеся товары, и они появятся здесь.", "Halan önümleriňizi ýatda saklaň, olar şu ýerde görkeziler.", "Beğendiğiniz ürünleri kaydedin, burada görünsünler.", "收藏喜欢的商品后，它们会显示在这里。"],
    "Find products": ["Find products", "Найти товары", "Önümleri tap", "Ürünleri bul", "查找商品"],
    "Loading your favourites...": ["Loading your favourites...", "Загрузка избранного...", "Halanlarym ýüklenýär...", "Favoriler yükleniyor...", "正在加载收藏..."],
    "Product filters": ["Product filters", "Фильтры товаров", "Önüm süzgüçleri", "Ürün filtreleri", "商品筛选"],
    "Sort products": ["Sort products", "Сортировать товары", "Önümleri tertiple", "Ürünleri sırala", "排序商品"],
    "Add user": ["Add user", "Добавить пользователя", "Ulanyjy goş", "Kullanıcı ekle", "添加用户"],
    "Search users...": ["Search users...", "Поиск пользователей...", "Ulanyjylary gözle...", "Kullanıcıları ara...", "搜索用户..."],
    "No users match your search.": ["No users match your search.", "По вашему запросу пользователи не найдены.", "Gözlegiňize laýyk ulanyjy ýok.", "Aramanızla eşleşen kullanıcı yok.", "没有找到匹配的用户。"],
    "Delete users?": ["Delete users?", "Удалить пользователей?", "Ulanyjylar pozulsynmy?", "Kullanıcılar silinsin mi?", "删除用户？"],
    "of": ["of", "из", "/", "/", "/"],
    "users": ["users", "пользователей", "ulanyjy", "kullanıcı", "位用户"],
    "Edit user": ["Edit user", "Изменить пользователя", "Ulanyjyny üýtget", "Kullanıcıyı düzenle", "编辑用户"],
    "Close edit form": ["Close edit form", "Закрыть форму редактирования", "Üýtgetme görnüşini ýap", "Düzenleme formunu kapat", "关闭编辑表单"],
    "Add": ["Add", "Добавить", "Goş", "Ekle", "添加"],
    "Add a new": ["Add a new", "Добавить новый", "Täze goş", "Yeni ekle", "添加新的"],
    "to your store.": ["to your store.", "в ваш магазин.", "dükanyňyza.", "mağazanıza.", "到您的商店。"],
    "Update the selected record and save your changes.": ["Update the selected record and save your changes.", "Обновите выбранную запись и сохраните изменения.", "Saýlanan ýazgyny täzeläp, üýtgeşmeleri ýatda saklaň.", "Seçilen kaydı güncelleyip değişiklikleri kaydedin.", "更新所选记录并保存更改。"],
    "Clear": ["Clear", "Очистить", "Arassala", "Temizle", "清除"],
    "selected": ["selected", "выбрано", "saýlandy", "seçildi", "已选"],
    "New season collection": ["New season collection", "Новая сезонная коллекция", "Täze möwsüm kolleksiýasy", "Yeni sezon koleksiyonu", "新季系列"],
    "The Purl Coat": ["The Purl Coat", "Пальто Purl", "Purl palto", "Purl kaban", "Purl 大衣"],
    "Cardigan": ["Cardigan", "Кардиган", "Kardigan", "Hırka", "开衫"],
    "Discover timeless style and effortless comfort with our latest fashion collection.": ["Discover timeless style and effortless comfort with our latest fashion collection.", "Откройте для себя неподвластный времени стиль и комфорт в нашей новой коллекции.", "Täze moda kolleksiýamyz bilen nusgawy stili we rahatlygy açyň.", "Yeni koleksiyonumuzla zamansız stili ve zahmetsiz konforu keşfedin.", "探索最新系列，感受经典风格与轻松舒适。"],
    "The autumn edit": ["The autumn edit", "Осенняя подборка", "Güýz saýlamasy", "Sonbahar seçkisi", "秋日精选"],
    "Dress the": ["Dress the", "Одевайтесь", "Geýniň", "Giyinin", "穿出"],
    "part.": ["part.", "соответственно.", "laýyk.", "tarzınızı.", "风格。"],
    "Layered textures, warm neutrals and silhouettes that move from desk to dinner.": ["Layered textures, warm neutrals and silhouettes that move from desk to dinner.", "Многослойные фактуры, теплые нейтральные оттенки и образы для дня и вечера.", "Gatlakly dokumalar, ýyly bitarap reňkler we gündizden agşama laýyk keşpler.", "Katmanlı dokular, sıcak nötr tonlar ve gün boyu kullanabileceğiniz silüetler.", "层次质感、温暖中性色与适合全天场景的廓形。"],
    "Explore the edit": ["Explore the edit", "Смотреть подборку", "Saýlamany gör", "Seçkiyi keşfet", "探索精选"],
    "Limited time": ["Limited time", "Ограниченное предложение", "Çäkli wagt", "Sınırlı süre", "限时优惠"],
    "Up to 40% off": ["Up to 40% off", "Скидки до 40%", "40%-e çenli arzanladyş", "%40'a varan indirim", "低至 6 折"],
    "your essentials": ["your essentials", "на базовые вещи", "esasy önümleriňize", "temel ürünlerinizde", "精选必备单品"],
    "Our most-loved basics at their best prices. Offer ends when stock runs out.": ["Our most-loved basics at their best prices. Offer ends when stock runs out.", "Любимые базовые модели по лучшим ценам. Акция действует до окончания запасов.", "Iň halaýan esasy önümlerimiz iň gowy bahadan. Haryt gutarýança.", "En sevilen temel ürünlerimiz en iyi fiyatlarla. Stoklarla sınırlıdır.", "人气基础款优惠价，售完即止。"],
    "Shop the sale": ["Shop the sale", "Покупки со скидкой", "Arzanladyşlary gör", "İndirimli ürünleri keşfet", "选购折扣商品"],
    "Free shipping over $100": ["Free shipping over $100", "Бесплатная доставка от $100", "$100-dan ýokary mugt eltip berme", "$100 üzeri ücretsiz kargo", "满$100免运费"],
    "New arrivals every week": ["New arrivals every week", "Новые поступления каждую неделю", "Her hepde täze önümler", "Her hafta yeni ürünler", "每周上新"],
    "30-day easy returns": ["30-day easy returns", "Легкий возврат в течение 30 дней", "30 günüň içinde aňsat gaýtaryş", "30 gün kolay iade", "30 天轻松退货"],
    "Made to last": ["Made to last", "Создано надолго", "Uzak wagt üçin döredildi", "Uzun ömürlü tasarım", "经久耐用"],
    "When ordering over $100": ["When ordering over $100", "При заказе от $100", "$100-dan ýokary sargyt edilende", "$100 üzeri siparişlerde", "订单满$100时"],
    "Get a return within 30 days": ["Get a return within 30 days", "Оформите возврат в течение 30 дней", "30 günüň içinde gaýtaryp bilersiňiz", "30 gün içinde iade edin", "30 天内可退货"],
    "100% secure online payment": ["100% secure online payment", "100% безопасная онлайн-оплата", "100% howpsuz onlaýn töleg", "%100 güvenli çevrimiçi ödeme", "100% 安全在线支付"],
    "Women": ["Women", "Женщинам", "Aýallar", "Kadın", "女装"],
    "New season knitwear and outerwear": ["New season knitwear and outerwear", "Трикотаж и верхняя одежда нового сезона", "Täze möwsümiň trikotažy we daşky eşikleri", "Yeni sezon trikoları ve dış giyim", "新季针织与外套"],
    "Men": ["Men", "Мужчинам", "Erkekler", "Erkek", "男装"],
    "Tailored everyday basics": ["Tailored everyday basics", "Продуманные базовые вещи на каждый день", "Gündelik geýim üçin tikilen esasy önümler", "Günlük kullanıma uygun temel parçalar", "精裁日常基础款"],
    "Accessories": ["Accessories", "Аксессуары", "Garniturlar", "Aksesuarlar", "配饰"],
    "The finishing touches": ["The finishing touches", "Завершающие детали", "Soňky bezegler", "Tamamlayıcı dokunuşlar", "点睛之笔"],
    "Sale": ["Sale", "Распродажа", "Arzanladyş", "İndirim", "促销"],
    "Up to 40% off selected styles": ["Up to 40% off selected styles", "Скидки до 40% на избранные модели", "Saýlanan önümlere 40%-e çenli arzanladyş", "Seçili ürünlerde %40'a varan indirim", "精选款低至 6 折"],
    "Customers dressed since 2019": ["Customers dressed since 2019", "Одеваем покупателей с 2019 года", "2019-njy ýyldan bäri müşderileri geýindirýäris", "2019'dan beri müşterilerimizi giydiriyoruz", "自 2019 年以来服务的客户"],
    "Say they would order again": ["Say they would order again", "Говорят, что закажут снова", "Ýene sargyt etjekdiklerini aýdýarlar", "Yeniden sipariş vereceklerini söylüyorlar", "表示愿意再次下单"],
    "Countries we ship to": ["Countries we ship to", "Страны, куда мы доставляем", "Eltip berýän ýurtlarymyz", "Teslimat yaptığımız ülkeler", "配送国家和地区"],
    "Shop by category": ["Shop by category", "Покупки по категориям", "Kategoriýa boýunça söwda", "Kategoriye göre alışveriş", "按分类选购"],
    "View all products": ["View all products", "Смотреть все товары", "Ähli önümleri gör", "Tüm ürünleri görüntüle", "查看全部商品"],
    "New arrivals": ["New arrivals", "Новинки", "Täze gelenler", "Yeni gelenler", "新品上市"],
    "Scroll products left": ["Scroll products left", "Прокрутить товары влево", "Önümleri çepe geçir", "Ürünleri sola kaydır", "向左滚动商品"],
    "Scroll products right": ["Scroll products right", "Прокрутить товары вправо", "Önümleri saga geçir", "Ürünleri sağa kaydır", "向右滚动商品"],
    "New arrivals list": ["New arrivals list", "Список новинок", "Täze gelen önümleriň sanawy", "Yeni ürünler listesi", "新品列表"],
    "Designed": ["Designed", "Создано", "Döredildi", "Tasarlanmış", "匠心设计"],
    "to be": ["to be", "чтобы", "bolmak üçin", "olmak için", "为"],
    "worn.": ["worn.", "носить.", "geýmek üçin.", "giyilmek için.", "穿着。"],
    "Every piece starts with fabric we would want to wear ourselves. Natural fibres, honest construction and cuts that stay in your wardrobe for years, not weeks.": ["Every piece starts with fabric we would want to wear ourselves. Natural fibres, honest construction and cuts that stay in your wardrobe for years, not weeks.", "Каждая вещь начинается с ткани, которую мы выбрали бы для себя: натуральные волокна, качественный пошив и крой на годы.", "Her önüm özümiziň geýmek islejek matamyzdan başlanýar: tebigy süýümler, berk tikin we uzak wagtlyk biçüw.", "Her parça, bizim de giymek isteyeceğimiz kumaşlarla başlar: doğal lifler, sağlam işçilik ve uzun ömürlü kesimler.", "每件单品都从我们自己也愿意穿的面料开始：天然纤维、扎实做工与历久弥新的剪裁。"],
    "Customer reviews": ["Customer reviews", "Отзывы покупателей", "Müşderi synlary", "Müşteri yorumları", "客户评价"],
    "Show review from": ["Show review from", "Показать отзыв от", "Şu adamyň synyny görkez", "Şu kişinin yorumunu göster", "显示来自此用户的评价"],
    "Get 10% off your first order": ["Get 10% off your first order", "Получите скидку 10% на первый заказ", "Ilkinji sargydyňyza 10% arzanladyş alyň", "İlk siparişinizde %10 indirim kazanın", "首单享 9 折优惠"],
    "Join the list for early access to new collections. One email a week, unsubscribe any time.": ["Join the list for early access to new collections. One email a week, unsubscribe any time.", "Подпишитесь, чтобы первыми узнавать о новых коллекциях. Одно письмо в неделю, отписаться можно в любое время.", "Täze kolleksiýalara ilkinji bolup elýeterli bolmak üçin ýazylyň. Hepdede bir hat.", "Yeni koleksiyonlara erken erişim için listeye katılın. Haftada bir e-posta, istediğiniz zaman ayrılın.", "订阅即可优先了解新品系列。每周一封邮件，随时退订。"],
    "Thanks. Check your inbox to confirm your email address.": ["Thanks. Check your inbox to confirm your email address.", "Спасибо. Проверьте почту и подтвердите адрес.", "Sag boluň. E-poçtaňyzy tassyklamak üçin poçtaňyzy barlaň.", "Teşekkürler. E-posta adresinizi doğrulamak için gelen kutunuzu kontrol edin.", "感谢订阅。请查看收件箱并确认邮箱地址。"],
    "Email address": ["Email address", "Адрес электронной почты", "E-poçta salgysy", "E-posta adresi", "电子邮箱地址"],
    "Sign me up": ["Sign me up", "Подписаться", "Ýazyl", "Kaydol", "订阅"],
    "Store benefits": ["Store benefits", "Преимущества магазина", "Dükanyň artykmaçlyklary", "Mağaza avantajları", "商店权益"],
    "Featured collections": ["Featured collections", "Избранные коллекции", "Saýlanan kolleksiýalar", "Öne çıkan koleksiyonlar", "精选系列"],
    "Previous slide": ["Previous slide", "Предыдущий слайд", "Öňki slaýd", "Önceki slayt", "上一张幻灯片"],
    "Next slide": ["Next slide", "Следующий слайд", "Indiki slaýd", "Sonraki slayt", "下一张幻灯片"],
    "Play slideshow": ["Play slideshow", "Запустить слайд-шоу", "Slaýd görkezmesini başlat", "Slayt gösterisini oynat", "播放幻灯片"],
    "Pause slideshow": ["Pause slideshow", "Приостановить слайд-шоу", "Slaýd görkezmesini duruz", "Slayt gösterisini duraklat", "暂停幻灯片"],
    "Store highlights": ["Store highlights", "Преимущества магазина", "Dükanyň artykmaçlyklary", "Mağaza öne çıkanları", "商店亮点"],
    "Show slide": ["Show slide", "Показать слайд", "Slaýdy görkez", "Slaytı göster", "显示幻灯片"],
    "Browse the collection": ["Browse the collection", "Смотреть коллекцию", "Kolleksiýa göz aýla", "Koleksiyonu incele", "浏览系列"],
    "Bought the Purl Coat Cardigan": ["Bought the Purl Coat Cardigan", "Купила кардиган Purl Coat", "Purl palto kardigan satyn aldy", "Purl Coat hırkayı satın aldı", "购买了 Purl Coat 开衫"],
    "The cardigan fits like it was made for me, and the wool still looks new after a full winter.": ["The cardigan fits like it was made for me, and the wool still looks new after a full winter.", "Кардиган сидит идеально, а шерсть выглядит как новая даже после целой зимы.", "Kardigan edil meniň üçin tikilen ýaly, gyşdan soň hem ýüňi täze ýaly görünýär.", "Hırka üzerime tam oldu ve yün kumaşı kış boyunca yeni gibi kaldı.", "这件开衫非常合身，经过整个冬天羊毛看起来仍像新的一样。"],
    "Verified buyer": ["Verified buyer", "Проверенный покупатель", "Barlanan alyjy", "Doğrulanmış alıcı", "已验证买家"],
    "My order arrived in two days and the return process took one email. That is rare.": ["My order arrived in two days and the return process took one email. That is rare.", "Заказ пришел за два дня, а для возврата понадобилось всего одно письмо. Такое редко бывает.", "Sargydym iki günde geldi, yzyna gaýtarmak üçin bolsa bir hat ýeterlik boldy. Bu seýrek.", "Siparişim iki günde geldi ve iade için tek bir e-posta yeterli oldu. Bu çok nadir.", "我的订单两天就到了，退货只发了一封邮件就办好了，真难得。"],
    "Finally a shop where the photos match the real colors. I have reordered three times.": ["Finally a shop where the photos match the real colors. I have reordered three times.", "Наконец-то магазин, где фотографии совпадают с реальными цветами. Я заказывала уже трижды.", "Ahyry suratlary hakyky reňklere gabat gelýän dükan. Üç gezek gaýtadan sargyt etdim.", "Sonunda fotoğrafların gerçek renklerle uyuştuğu bir mağaza. Üç kez yeniden sipariş verdim.", "终于找到一家图片颜色与实物一致的商店。我已经回购三次了。"],
    "Repeat customer": ["Repeat customer", "Постоянный покупатель", "Yzygiderli müşderi", "Tekrar müşteri", "回头客"],
    "to write a review.": ["to write a review.", "чтобы написать отзыв.", "syn ýazmak üçin.", "yorum yazmak için.", "即可撰写评价。"],
    "Loading reviews...": ["Loading reviews...", "Загрузка отзывов...", "Synlar ýüklenýär...", "Yorumlar yükleniyor...", "正在加载评价..."],
    "No reviews yet. Be the first to share your experience.": ["No reviews yet. Be the first to share your experience.", "Отзывов пока нет. Поделитесь впечатлениями первым.", "Entäk syn ýok. Tejribäňizi ilkinji bolup paýlaşyň.", "Henüz yorum yok. Deneyiminizi ilk paylaşan siz olun.", "暂无评价。来分享您的体验吧。"],
    "JOIN CLARE": ["JOIN CLARE", "ПРИСОЕДИНЯЙТЕСЬ К CLARE", "CLARE-E GOŞULYŇ", "CLARE'E KATILIN", "加入 CLARE"],
    "Create Account": ["Create Account", "Создать аккаунт", "Hasap döret", "Hesap oluştur", "创建账户"],
    "Create an account to manage your Clare shopping experience.": ["Create an account to manage your Clare shopping experience.", "Создайте аккаунт, чтобы управлять покупками в Clare.", "Clare-däki söwdanyňyzy dolandyrmak üçin hasap dörediň.", "Clare alışveriş deneyiminizi yönetmek için hesap oluşturun.", "创建账户以管理您在 Clare 的购物体验。"],
    "Choose a username": ["Choose a username", "Придумайте имя пользователя", "Ulanyjy adyny saýlaň", "Bir kullanıcı adı seçin", "选择用户名"],
    "Create a password": ["Create a password", "Придумайте пароль", "Açar söz dörediň", "Bir şifre oluşturun", "创建密码"],
    "Creating...": ["Creating...", "Создание...", "Döredilýär...", "Oluşturuluyor...", "正在创建..."],
    "Your account is ready. Please sign in to continue.": ["Your account is ready. Please sign in to continue.", "Ваш аккаунт готов. Войдите, чтобы продолжить.", "Hasabyňyz taýýar. Dowam etmek üçin giriň.", "Hesabınız hazır. Devam etmek için giriş yapın.", "账户已准备就绪。请登录以继续。"],
    "Already have an account?": ["Already have an account?", "Уже есть аккаунт?", "Hasabyňyz barmy?", "Zaten bir hesabınız var mı?", "已有账户？"],
    "Overview of your store": ["Overview of your store", "Обзор вашего магазина", "Dükanyňyza syn", "Mağazanıza genel bakış", "商店概览"],
    "Best buyers": ["Best buyers", "Лучшие покупатели", "Iň gowy müşderiler", "En iyi müşteriler", "最佳买家"],
    "SHOPIFY ADMIN": ["SHOPIFY ADMIN", "АДМИНИСТРАТОР SHOPIFY", "SHOPIFY DOLANDYRYJYSY", "SHOPIFY YÖNETİMİ", "SHOPIFY 管理"],
    "Model in layered autumn knitwear": ["Model in layered autumn knitwear", "Модель в многослойном осеннем трикотаже", "Gatlakly güýzki trikotaž geýen model", "Katmanlı sonbahar trikoları giyen model", "身穿层叠秋季针织装的模特"],
    "Model wearing a seasonal essential": ["Model wearing a seasonal essential", "Модель в базовой сезонной вещи", "Möwsümleýin esasy eşik geýen model", "Sezonun temel parçalarından birini giyen model", "身穿季节必备单品的模特"],
    "Model wearing the Purl Coat Cardigan": ["Model wearing the Purl Coat Cardigan", "Модель в кардигане Purl Coat", "Purl palto kardigan geýen model", "Purl Coat hırka giyen model", "身穿 Purl Coat 开衫的模特"],
};

export const LANGUAGES = [
    { code: "en", label: "English", index: 0 },
    { code: "ru", label: "Русский", index: 1 },
    { code: "tk", label: "Türkmençe", index: 2 },
    { code: "tr", label: "Türkçe", index: 3 },
    { code: "zh", label: "中文", index: 4 },
];

const LanguageContext = createContext(null);

function readPreference(key, fallback) {
    if (typeof window === "undefined") return fallback;
    try {
        return window.localStorage.getItem(key) || fallback;
    } catch {
        return fallback;
    }
}

function getSystemTheme() {
    return typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}

export function SitePreferencesProvider({ children }) {
    const [language, setLanguageState] = useState(() => {
        const saved = readPreference(STORAGE_KEYS.language, "en");
        return LANGUAGES.some(({ code }) => code === saved) ? saved : "en";
    });
    const [themeMode, setThemeModeState] = useState(() => {
        const saved = readPreference(STORAGE_KEYS.theme, "system");
        return ["system", "light", "dark"].includes(saved) ? saved : "system";
    });
    const [systemTheme, setSystemTheme] = useState(getSystemTheme);
    const theme = themeMode === "system" ? systemTheme : themeMode;

    useEffect(() => {
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        const update = (event) => setSystemTheme(event.matches ? "dark" : "light");
        media.addEventListener?.("change", update);
        return () => media.removeEventListener?.("change", update);
    }, []);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        document.documentElement.style.colorScheme = theme;
        document.documentElement.lang = language;
    }, [language, theme]);

    const setLanguage = (nextLanguage) => {
        if (!LANGUAGES.some(({ code }) => code === nextLanguage)) return;
        setLanguageState(nextLanguage);
        try {
            window.localStorage.setItem(STORAGE_KEYS.language, nextLanguage);
        } catch {
            // The selected language still applies for this session.
        }
    };

    const toggleTheme = () => {
        const nextTheme = theme === "dark" ? "light" : "dark";
        setThemeModeState(nextTheme);
        try {
            window.localStorage.setItem(STORAGE_KEYS.theme, nextTheme);
        } catch {
            // The selected theme still applies for this session.
        }
    };

    const value = useMemo(() => ({
        language,
        setLanguage,
        theme,
        toggleTheme,
        t: (text) => {
            const entry = translations[text];
            if (!entry) return text;
            const languageIndex = LANGUAGES.find(({ code }) => code === language)?.index ?? 0;
            return entry[languageIndex] || text;
        },
    }), [language, theme]);

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useSitePreferences() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useSitePreferences must be used within SitePreferencesProvider");
    }
    return context;
}
