import React, { createContext, useContext, useState } from 'react'

// ─── Translations ────────────────────────────────────────────────────────────
export const translations = {
  EN: {
    // Header / Nav
    menu:            'MENU',
    tagline:         'pick, collect or personal delivery',
    search_ph:       'Search products...',
    no_results:      'No results for',
    clear_search:    'Clear search',

    // Category tab labels
    cat_all:         'All Products',
    cat_bestsellers: 'Best Sellers',
    cat_Perfume:             'Perfume',
    cat_Hand_cream:          'Hand Cream',
    cat_Body_cream:          'Body Cream',
    cat_Diffuser:            'Diffuser',
    cat_Shower_gel:          'Shower Gel',
    cat_Body_scrub:          'Body Scrub',
    cat_Body_oil:            'Body Oil',
    cat_Candle:              'Candle',
    cat_Liquid_soap:         'Liquid Soap',
    cat_Solid_soap:          'Solid Soap',
    cat_Shampoo:             'Shampoo',
    cat_Hair_conditioner:    'Hair Conditioner',
    cat_Keratin_hair_mask:   'Keratin Hair Mask',
    cat_Dead_sea_salt:       'Dead Sea Salt',
    cat_Giftbox:             'Giftbox',

    // Section view
    see_all:         'See all',
    best_sellers_title: 'BEST SELLERS',

    // Banners
    bestsellers_count:  (n) => `${n} BESTSELLER PRODUCTS`,
    free_delivery_banner: (threshold) => `FREE DELIVERY ON ORDERS OVER ${threshold}`,

    // Product card / modal
    add_to_bag:      'ADD TO BAG',
    out_of_stock:    'OUT OF STOCK',
    only_left:       (n) => `ONLY ${n} LEFT`,
    back:            'BACK',
    swipe_browse:    'SWIPE TO BROWSE',
    add_to_cart:     'ADD TO CART',
    add_wishlist:    'Add to Wishlist',
    remove_wishlist: 'Remove from Wishlist',

    // Bottom nav
    shop:     'SHOP',
    wishlist: 'WISHLIST',
    bundle:   'BUNDLE',
    orders:   'ORDERS',
    bag:      'BAG',

    // Footer
    free_delivery_footer: (cur) => cur === 'EUR' ? '€100' : '39 500 Ft',
    contact: 'CONTACT',

    // Cart drawer
    shopping_bag:   (n) => `SHOPPING BAG (${n})`,
    bag_empty:      'YOUR BAG IS EMPTY',
    away_free:      (amt) => `${amt} away from free delivery`,
    free_unlocked:  '✓ Free delivery unlocked',
    subtotal:       'SUBTOTAL',
    delivery:       'DELIVERY',
    free:           'FREE',
    total:          'TOTAL',
    checkout:       'CHECKOUT',
    secure_payment: 'SECURE ONLINE PAYMENT',

    // Filter panel
    filters:        'FILTERS',
    clear_all:      'Clear All',
    collections:    'Collections',
    bestsellers_filter: 'Best Sellers',
    new_arrivals:   'New Arrivals',
    in_stock_only:  'In Stock Only',
    price_range:    'Price Range',
    shop_by:        'Shop By',
    active_filters: 'Active Filters',
    in_stock_badge: 'In Stock',

    // Collection group labels (filter panel)
    col_perfume:    'Perfume',
    col_home_scent: 'Home Scent',
    col_body:       'Body',
    col_hands:      'Hands',
    col_self_care:  'Self Care',
    col_hair:       'Hair',
    col_travel:     'Travel Size',

    // Checkout form
    delivery_details:  'DELIVERY DETAILS',
    delivery_method:   'DELIVERY METHOD *',
    delivery_label:    'DELIVERY',
    delivery_sub:      'To your address',
    pickup_label:      'PICKUP',
    pickup_sub:        'Collect in store',
    pickup_location:   'PICKUP LOCATION',
    budapest_store:    'Budapest Store',
    pickup_note:       "We'll contact you when ready for pickup",
    pickup_date:       'PICKUP DATE *',
    delivery_date:     'DELIVERY DATE *',
    select_date:       'Select date',
    full_name:         'FULL NAME *',
    phone:             'PHONE *',
    email:             'EMAIL',
    notes_opt:         'NOTES (OPTIONAL)',
    delivery_address:  'DELIVERY ADDRESS *',
    city:              'CITY *',
    postal_code:       'POSTAL CODE *',
    items_count:       (n) => `SUBTOTAL (${n} ITEMS)`,
    preparing_payment: 'PREPARING PAYMENT…',
    pay_revolut:       'PAY WITH REVOLUT',
    secure_revolut:    'SECURE PAYMENT VIA REVOLUT PAY',
    revolut_opening:   'REVOLUT PAY OPENING…',
    complete_popup:    'Complete your payment in the Revolut popup.',
    back_to_order:     '← Back to order details',
    thank_you:         'THANK YOU',
    order_confirmed:   'ORDER CONFIRMED',
    payment_received:  'Payment received. We will contact you to confirm delivery.',
    continue_shopping: 'CONTINUE SHOPPING',

    // Wishlist page
    back_to_shop:    'BACK TO SHOP',
    my_wishlist:     'MY WISHLIST',
    saved_items:     (n) => `${n} SAVED ITEMS`,
    loading:         'LOADING...',
    wishlist_empty:  'YOUR WISHLIST IS EMPTY',
    wishlist_hint:   'Save your favourite products to revisit them later',
    view_in_shop:    'VIEW IN SHOP',

    // Orders page
    my_orders:       'MY ORDERS',
    orders_count:    (n) => `${n} ORDERS`,
    order_number:    'ORDER NUMBER',
    items_label:     'ITEMS',
    quantity:        (n) => `Quantity: ${n}`,
    delivery_addr:   'DELIVERY ADDRESS',
    notes_label:     'NOTES',
    no_orders:       'NO ORDERS YET',
    no_orders_hint:  'Start shopping to see your orders here',
    start_shopping:  'START SHOPPING',
    status_pending:   { label: 'Order Received', desc: 'Your order has been received and is being processed' },
    status_confirmed: { label: 'Confirmed',      desc: 'Your order has been confirmed' },
    status_preparing: { label: 'Preparing',      desc: 'We are carefully preparing your order' },
    status_shipped:   { label: 'Shipped',        desc: 'Your order is on its way to you' },
    status_delivered: { label: 'Delivered',      desc: 'Your order has been delivered' },
    status_cancelled: { label: 'Cancelled',      desc: 'This order has been cancelled' },

    // Bundle builder
    back_to_shop_link:     'BACK TO SHOP',
    create_gift:           'CREATE YOUR GIFT SET',
    build_collection:      'BUILD A CUSTOM COLLECTION • 10% OFF 3+ ITEMS',
    search_products_ph:    'Search products...',
    your_gift_set:         'YOUR GIFT SET',
    gift_set_name_ph:      'Gift Set Name (e.g., For Mom)',
    start_adding:          'Start adding products',
    subtotal_items:        (n) => `Subtotal (${n} items)`,
    discount_label:        'Discount (10%)',
    total_label:           'Total',
    discount_badge:        '10% DISCOUNT APPLIED',
    save_gift_set:         'SAVE GIFT SET',
    gift_set_saved_note:   'Saved gift sets can be viewed in your account',
    add_btn:               'ADD',

    // Toast messages
    toast_added_bag:     'Added to bag',
    toast_added_wishlist:'Added to wishlist',
    toast_removed_wishlist:'Removed from wishlist',
    toast_gift_saved:    'Gift set saved!',
  },

  HU: {
    // Header / Nav
    menu:            'MENÜ',
    tagline:         'személyes átvétel és házhozszállítás',
    search_ph:       'Termékek keresése...',
    no_results:      'Nincs találat erre:',
    clear_search:    'Keresés törlése',

    // Category tab labels
    cat_all:         'Összes termék',
    cat_bestsellers: 'Legnépszerűbb',
    cat_Perfume:             'Parfüm',
    cat_Hand_cream:          'Kézkrém',
    cat_Body_cream:          'Testápoló krém',
    cat_Diffuser:            'Diffúzor',
    cat_Shower_gel:          'Tusfürdő',
    cat_Body_scrub:          'Testradír',
    cat_Body_oil:            'Testolaj',
    cat_Candle:              'Gyertya',
    cat_Liquid_soap:         'Folyékony szappan',
    cat_Solid_soap:          'Szappan',
    cat_Shampoo:             'Sampon',
    cat_Hair_conditioner:    'Hajbalzsam',
    cat_Keratin_hair_mask:   'Keratinos hajpakolás',
    cat_Dead_sea_salt:       'Holt-tengeri só',
    cat_Giftbox:             'Ajándékcsomag',

    // Section view
    see_all:         'Összes',
    best_sellers_title: 'LEGNÉPSZERŰBB',

    // Banners
    bestsellers_count:  (n) => `${n} LEGNÉPSZERŰBB TERMÉK`,
    free_delivery_banner: (threshold) => `INGYENES SZÁLLÍTÁS ${threshold} FELETT`,

    // Product card / modal
    add_to_bag:      'KOSÁRBA',
    out_of_stock:    'ELFOGYOTT',
    only_left:       (n) => `CSAK ${n} MARADT`,
    back:            'VISSZA',
    swipe_browse:    'CSÚSZTASS A BÖNGÉSZÉSHEZ',
    add_to_cart:     'KOSÁRBA HELYEZÉS',
    add_wishlist:    'Kívánlistához adás',
    remove_wishlist: 'Eltávolítás a kívánlistából',

    // Bottom nav
    shop:     'BOLT',
    wishlist: 'KÍVÁNLISTA',
    bundle:   'AJÁNDÉK',
    orders:   'RENDELÉSEK',
    bag:      'KOSÁR',

    // Footer
    free_delivery_footer: (cur) => cur === 'EUR' ? '€100' : '39 500 Ft',
    contact: 'KAPCSOLAT',

    // Cart drawer
    shopping_bag:   (n) => `KOSÁR (${n})`,
    bag_empty:      'A KOSARAD ÜRES',
    away_free:      (amt) => `${amt} az ingyenes szállításig`,
    free_unlocked:  '✓ Ingyenes szállítás elérve',
    subtotal:       'RÉSZÖSSZEG',
    delivery:       'SZÁLLÍTÁS',
    free:           'INGYENES',
    total:          'ÖSSZESEN',
    checkout:       'MEGRENDELÉS',
    secure_payment: 'BIZTONSÁGOS ONLINE FIZETÉS',

    // Filter panel
    filters:        'SZŰRŐK',
    clear_all:      'Törlés',
    collections:    'Kollekciók',
    bestsellers_filter: 'Legnépszerűbb',
    new_arrivals:   'Újdonságok',
    in_stock_only:  'Csak készleten',
    price_range:    'Ártartomány',
    shop_by:        'Kategória',
    active_filters: 'Aktív szűrők',
    in_stock_badge: 'Készleten',

    // Collection group labels (filter panel)
    col_perfume:    'Parfüm',
    col_home_scent: 'Otthoni illat',
    col_body:       'Test',
    col_hands:      'Kéz',
    col_self_care:  'Önápolás',
    col_hair:       'Haj',
    col_travel:     'Utazó méret',

    // Checkout form
    delivery_details:  'SZÁLLÍTÁSI ADATOK',
    delivery_method:   'SZÁLLÍTÁSI MÓD *',
    delivery_label:    'KISZÁLLÍTÁS',
    delivery_sub:      'Házhozszállítás',
    pickup_label:      'SZEMÉLYES ÁTVÉTEL',
    pickup_sub:        'Átvétel az üzletben',
    pickup_location:   'ÁTVÉTELI PONT',
    budapest_store:    'Budapest Üzlet',
    pickup_note:       'Értesítjük, amikor a rendelés átvehető',
    pickup_date:       'ÁTVÉTELI IDŐPONT *',
    delivery_date:     'SZÁLLÍTÁSI IDŐPONT *',
    select_date:       'Válasszon dátumot',
    full_name:         'TELJES NÉV *',
    phone:             'TELEFONSZÁM *',
    email:             'EMAIL',
    notes_opt:         'MEGJEGYZÉS (OPCIONÁLIS)',
    delivery_address:  'SZÁLLÍTÁSI CÍM *',
    city:              'VÁROS *',
    postal_code:       'IRÁNYÍTÓSZÁM *',
    items_count:       (n) => `RÉSZÖSSZEG (${n} TERMÉK)`,
    preparing_payment: 'FIZETÉS ELŐKÉSZÍTÉSE…',
    pay_revolut:       'FIZETÉS REVOLUT-TAL',
    secure_revolut:    'BIZTONSÁGOS FIZETÉS REVOLUT PAYEN KERESZTÜL',
    revolut_opening:   'REVOLUT PAY MEGNYÍLIK…',
    complete_popup:    'Fejezze be a fizetést a Revolut ablakban.',
    back_to_order:     '← Vissza a rendelés részleteihez',
    thank_you:         'KÖSZÖNJÜK',
    order_confirmed:   'RENDELÉS MEGERŐSÍTVE',
    payment_received:  'A fizetés megérkezett. Hamarosan felvesszük Önnel a kapcsolatot.',
    continue_shopping: 'VÁSÁRLÁS FOLYTATÁSA',

    // Wishlist page
    back_to_shop:    'VISSZA A BOLTBA',
    my_wishlist:     'KÍVÁNLISTÁM',
    saved_items:     (n) => `${n} MENTETT TERMÉK`,
    loading:         'BETÖLTÉS...',
    wishlist_empty:  'A KÍVÁNLISTÁD ÜRES',
    wishlist_hint:   'Mentse el kedvenc termékeit, hogy később visszatérhessen hozzájuk',
    view_in_shop:    'MEGTEKINTÉS A BOLTBAN',

    // Orders page
    my_orders:       'RENDELÉSEIM',
    orders_count:    (n) => `${n} RENDELÉS`,
    order_number:    'RENDELÉSSZÁM',
    items_label:     'TERMÉKEK',
    quantity:        (n) => `Mennyiség: ${n}`,
    delivery_addr:   'SZÁLLÍTÁSI CÍM',
    notes_label:     'MEGJEGYZÉS',
    no_orders:       'MÉG NINCS RENDELÉS',
    no_orders_hint:  'Vásároljon, hogy itt megjelenjenek a rendelései',
    start_shopping:  'VÁSÁRLÁS MEGKEZDÉSE',
    status_pending:   { label: 'Rendelés fogadva',  desc: 'A rendelését megkaptuk, feldolgozás alatt' },
    status_confirmed: { label: 'Visszaigazolva',    desc: 'A rendelését visszaigazoltuk' },
    status_preparing: { label: 'Előkészítés alatt', desc: 'Gondosan előkészítjük a rendelését' },
    status_shipped:   { label: 'Kiszállítva',       desc: 'A rendelése úton van Önhöz' },
    status_delivered: { label: 'Átadva',            desc: 'A rendelését átadtuk' },
    status_cancelled: { label: 'Törölve',           desc: 'A rendelést törölték' },

    // Bundle builder
    back_to_shop_link:     'VISSZA A BOLTBA',
    create_gift:           'AJÁNDÉKCSOMAG ÖSSZEÁLLÍTÁSA',
    build_collection:      'EGYÉNI KOLLEKCIÓ • 10% KEDVEZMÉNY 3+ TERMÉKNÉL',
    search_products_ph:    'Termékek keresése...',
    your_gift_set:         'AJÁNDÉKCSOMAGJA',
    gift_set_name_ph:      'Ajándékcsomag neve (pl. Anyukának)',
    start_adding:          'Kezdjen el termékeket hozzáadni',
    subtotal_items:        (n) => `Részösszeg (${n} termék)`,
    discount_label:        'Kedvezmény (10%)',
    total_label:           'Összesen',
    discount_badge:        '10% KEDVEZMÉNY ALKALMAZVA',
    save_gift_set:         'AJÁNDÉKCSOMAG MENTÉSE',
    gift_set_saved_note:   'Elmentett ajándékcsomagok a fiókjában megtekinthetők',
    add_btn:               'HOZZÁADÁS',

    // Toast messages
    toast_added_bag:      'Kosárba helyezve',
    toast_added_wishlist: 'Kívánlistához adva',
    toast_removed_wishlist:'Eltávolítva a kívánlistából',
    toast_gift_saved:     'Ajándékcsomag elmentve!',
  },
}

// ─── Context ─────────────────────────────────────────────────────────────────
const LanguageContext = createContext({ lang: 'EN', setLang: () => {} })

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('EN')
  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

// ─── Hooks ───────────────────────────────────────────────────────────────────
export function useLanguage() {
  return useContext(LanguageContext)
}

// t(key) — returns string or calls function with args
export function useT() {
  const { lang } = useLanguage()
  return (key, ...args) => {
    const val = translations[lang]?.[key] ?? translations['EN'][key] ?? key
    return typeof val === 'function' ? val(...args) : val
  }
}

// Helper: get translated category label from its value string
export function useCatLabel() {
  const t = useT()
  return (value) => {
    const key = 'cat_' + value.replace(/ /g, '_')
    return t(key)
  }
}
