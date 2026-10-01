import { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "ar";

interface LanguageContextType {
  lang: Language;
  toggleLang: () => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Nav
    "nav.sun": "Sun", "nav.china": "China (Prescription)", "nav.italy": "Italy (Prescription)", "nav.children": "Children", "nav.clipon": "Clip On",
    "nav.cart": "Cart", "nav.search": "Search",
    // Home
    "home.badge": "Premium Optical Experience",
    "home.hero.title1": "Vision meets", "home.hero.title2": "elegance.",
    "home.hero.desc": "Discover our curated collection of luxury eyewear. From statement sunglasses to precision-crafted medical frames, we help you see the world beautifully.",
    "home.hero.shopSun": "Shop Sunglasses", "home.hero.viewRx": "View Prescription",
    "home.collections.title": "Curated Collections",
    "home.collections.desc": "Expertly selected frames for every face, style, and prescription need.",
    "home.cat.collection": "Collection", "home.cat.prescription": "Prescription",
    "home.cat.premiumRx": "Premium Prescription", "home.cat.explore": "Explore styles",
    "home.trust.quality.title": "Authentic Quality",
    "home.trust.quality.desc": "Every frame is 100% authentic, sourced directly from manufacturers with full warranty.",
    "home.trust.lenses.title": "Precision Lenses",
    "home.trust.lenses.desc": "State-of-the-art lens cutting technology ensures your prescription is perfect every time.",
    "home.trust.fitting.title": "Expert Fitting",
    "home.trust.fitting.desc": "Our master opticians ensure your frames sit perfectly and comfortably on your face.",
    // FAQ
    "faq.title": "Frequently Asked Questions", "faq.subtitle": "Everything you need to know before you order.",
    "faq.q1": "What are your delivery times?",
    "faq.a1": "Standard delivery takes 2–5 business days across Egypt. Express options are available in Cairo and Giza.",
    "faq.q2": "Do you fit prescription lenses?",
    "faq.a2": "Yes! Our Italy and China collections are all prescription-ready. Upload your prescription during checkout or bring it in-store.",
    "faq.q4": "Do frames come with a warranty?",
    "faq.a4": "All frames include a 12-month manufacturer warranty covering material and workmanship defects.",
    "faq.q5": "How does free shipping work?",
    "faq.a5": "Any order totalling 2,000 EGP or more qualifies for free delivery anywhere in Egypt. The discount is applied automatically at checkout.",
    // Reviews
    "reviews.title": "What Our Customers Say", "reviews.subtitle": "Trusted by thousands of eyewear lovers across Egypt.",
    // Category
    "cat.back": "Back to Home", "cat.all": "All",
    "cat.sun.title": "Sun Collection", "cat.sun.desc": "Premium sunglasses for every style.",
    "cat.china.title": "China (Prescription)", "cat.china.desc": "Quality prescription frames offering great value.",
    "cat.italy.title": "Italy (Prescription)", "cat.italy.desc": "Luxurious Italian crafted frames for the discerning wearer.",
    "cat.children.title": "Children's Collection", "cat.children.desc": "Lightweight, durable frames designed especially for young wearers.",
    "cat.clipon.title": "Clip On", "cat.clipon.desc": "Magnetic clip-on lenses that attach to your existing frames — sun, blue-cut, and polarised options.",
    "cat.select": "Select Frame", "cat.classic": "Classic",
    "cat.notfound": "Category not found", "cat.returnHome": "Return Home",
    "cat.addToCart": "Add to Cart", "cat.view": "View",
    // Product
    "product.notFound": "Product not found.",
    "product.addToCart": "Add to Cart", "product.added": "Added to Cart",
    "product.quantity": "Quantity", "product.specs": "Frame Specifications",
    "product.view": "View Details",
    // Specs
    "spec.frameType": "Frame Type", "spec.material": "Material",
    "spec.lensWidth": "Lens Width", "spec.bridge": "Bridge",
    "spec.temple": "Temple Length", "spec.color": "Color", "spec.gender": "Gender",
    // Checkout
    "checkout.back": "Back", "checkout.title": "Complete Your Order",
    "checkout.ordering": "Ordering:", "checkout.sunglasses": "Sunglasses", "checkout.prescription": "Prescription",
    "checkout.name": "Full Name", "checkout.name.placeholder": "John Doe",
    "checkout.phone": "Phone Number", "checkout.phone.placeholder": "+20 1XX XXX XXXX",
    "checkout.email": "Email Address", "checkout.email.placeholder": "example@email.com",
    "checkout.address": "Delivery Address", "checkout.address.placeholder": "Enter your full delivery address",
    "checkout.rxSection": "Prescription Details", "checkout.uploadRx": "Upload Prescription",
    "checkout.uploadHint": "Click or drag file to upload", "checkout.uploadFormats": "Supports PDF, JPG, PNG",
    "checkout.lensType": "Select Lens Type",
    "checkout.darkenNote": "(This lens darkens in the sun.)",
    "checkout.summary": "Order Summary", "checkout.itemPrice": "Item Price",
    "checkout.delivery": "Delivery Fee", "checkout.freeShipping": "Free Shipping",
    "checkout.total": "Total", "checkout.submit": "Confirm Order",
    "checkout.terms": "By confirming this order, you agree to our terms of service and return policy.",
    "checkout.success.title": "Order Confirmed",
    "checkout.success.desc": "Thank you for choosing Ashraf Monir. We have received your order for {product} and will contact you shortly.",
    "checkout.success.return": "Return to Boutique",
    "checkout.emptyCart": "Your cart is empty.",
    "checkout.goToCart": "Go to Cart",
    // Cart
    "cart.title": "Your Cart", "cart.empty": "Your cart is empty",
    "cart.emptyDesc": "Browse our collections and add your favourite frames.",
    "cart.continueShopping": "Continue Shopping", "cart.checkout": "Proceed to Checkout",
    "cart.lensOption": "Lens Option",
    "cart.withLenses": "With Lenses",
    "cart.withoutLenses": "Without Lenses",
    "cart.lensNote": "This price does not include lenses. You will be contacted regarding the correct lens price.",
    "cart.selectLensType": "Select Lens Type",
    "cart.uploadRx": "Upload Prescription",
    // Promo
    "promo.label": "Promo Code", "promo.placeholder": "Enter promo code",
    "promo.apply": "Apply", "promo.applied": "Promo applied",
    "promo.invalid": "Invalid or expired promo code.",
    "promo.discount": "Discount",
    // Search
    "search.placeholder": "Search frames, materials, colours…",
    "search.resultsFor": "Search results for",
    "search.resultsCount": "results found",
    "search.noResults": "No results found",
    "search.noResultsDesc": "Try a different keyword — for example, 'metal', 'aviator', or 'Italy'.",
    // Lens types
    "lens.blue_cut": "Blue cut", "lens.anti_reflection": "Anti-reflection",
    "lens.white": "White", "lens.blue_cut_grey": "Blue cut grey",
    "lens.grey": "Grey", "lens.brown": "Brown", "lens.blue_cut_brown": "Blue Cut Brown",
    // Order confirmation
    "order.number": "Order", "order.thankYou": "Thank you for choosing Ashraf Monir. We will contact you shortly to confirm your order.",
    "order.yourDetails": "Your Details", "order.items": "Order Items",
    "order.noData": "No order found.",
    // Footer
    "footer.desc": "Premium optical boutique offering the finest curated selection of sunglasses and prescription eyewear.",
    "footer.categories": "Categories", "footer.cat.sun": "Sun Collection",
    "footer.cat.china": "China (Prescription)", "footer.cat.italy": "Italy (Prescription)",
    "footer.cat.children": "Children's Collection", "footer.cat.clipon": "Clip On",
    "footer.contact": "Contact Us", "footer.phone": "Customer Service",
    "footer.hours": "Daily: 11am – 12pm", "footer.social": "Follow Us",
    "footer.copyright": "© {year} Ashraf Monir. All rights reserved.",
    "footer.privacy": "Privacy Policy", "footer.terms": "Terms of Service",
    // Validation
    "val.name": "Name must be at least 2 characters.", "val.phone": "Valid phone number required.",
    "val.email": "Invalid email address.", "val.address": "Address is required.",
    "val.rx": "Prescription file is required", "val.lens": "Please select a lens type.",
    // Track order
    "footer.trackOrder": "Track My Order",
    "track.title": "Track Your Order", "track.subtitle": "Enter the email or phone number used at checkout to view your order status.",
    "track.byEmail": "By Email", "track.byPhone": "By Phone",
    "track.email": "Email Address", "track.orderNum": "Order Number (optional)",
    "track.phone": "Phone Number",
    "track.phone.placeholder": "+20 1XX XXX XXXX",
    "track.orderNumHint": "Found on your order confirmation page.",
    "track.submit": "Track Order", "track.searching": "Searching…",
    "track.newSearch": "New search",
    "track.found1": "1 order found", "track.foundN": "{n} orders found",
    "track.viewItems": "View items",
    "track.notFound": "No orders found for this email. Make sure you use the same email entered at checkout.",
    "track.notFoundPhone": "No orders found for this phone number. Make sure you use the same number entered at checkout.",
    "track.error": "Something went wrong. Please try again.",
    "track.items": "Items", "track.delivery": "Delivery", "track.discount": "Discount",
    "track.free": "Free", "track.total": "Total",
  },
  ar: {
    // Nav
    "nav.sun": "شمسي", "nav.china": "صيني (طبي)", "nav.italy": "إيطالي (طبي)", "nav.children": "أطفالي", "nav.clipon": "كليب أون",
    "nav.cart": "السلة", "nav.search": "بحث",
    // Home
    "home.badge": "تجربة بصرية متميزة",
    "home.hero.title1": "الرؤية تلتقي", "home.hero.title2": "بالأناقة.",
    "home.hero.desc": "اكتشف مجموعتنا المنتقاة من النظارات الفاخرة. من النظارات الشمسية العصرية إلى الإطارات الطبية المصنوعة بدقة، نساعدك على رؤية العالم بجمال.",
    "home.hero.shopSun": "تسوق النظارات الشمسية", "home.hero.viewRx": "عرض النظارات الطبية",
    "home.collections.title": "مجموعات مختارة",
    "home.collections.desc": "إطارات مختارة بعناية لكل وجه وأسلوب واحتياج طبي.",
    "home.cat.collection": "مجموعة", "home.cat.prescription": "طبي",
    "home.cat.premiumRx": "طبي فاخر", "home.cat.explore": "استكشف الأنماط",
    "home.trust.quality.title": "جودة أصيلة",
    "home.trust.quality.desc": "كل إطار أصلي ١٠٠٪، يتم توريده مباشرة من الشركات المصنعة مع ضمان كامل.",
    "home.trust.lenses.title": "عدسات دقيقة",
    "home.trust.lenses.desc": "تقنية قطع العدسات الحديثة تضمن أن وصفتك الطبية مثالية في كل مرة.",
    "home.trust.fitting.title": "تركيب احترافي",
    "home.trust.fitting.desc": "يضمن خبراؤنا البصريون أن الإطارات تجلس بشكل مثالي ومريح على وجهك.",
    // FAQ
    "faq.title": "الأسئلة الشائعة", "faq.subtitle": "كل ما تحتاج معرفته قبل الطلب.",
    "faq.q1": "ما هي مواعيد التوصيل؟",
    "faq.a1": "يستغرق التوصيل العادي من ٢ إلى ٥ أيام عمل في جميع أنحاء مصر. تتوفر خيارات توصيل سريع في القاهرة والجيزة.",
    "faq.q2": "هل تركّبون عدسات طبية؟",
    "faq.a2": "نعم! مجموعات إيطاليا والصين لدينا كلها مناسبة للعدسات الطبية. ارفع وصفتك الطبية أثناء الطلب أو احضرها إلى المتجر.",
    "faq.q4": "هل تأتي الإطارات بضمان؟",
    "faq.a4": "جميع الإطارات تأتي بضمان صانع لمدة ١٢ شهراً يغطي عيوب المواد والتصنيع.",
    "faq.q5": "كيف يعمل الشحن المجاني؟",
    "faq.a5": "أي طلب بإجمالي ٢٠٠٠ جنيه مصري أو أكثر يحظى بتوصيل مجاني في جميع أنحاء مصر. الخصم يُطبَّق تلقائياً عند الدفع.",
    // Reviews
    "reviews.title": "ماذا يقول عملاؤنا", "reviews.subtitle": "يثق بنا آلاف محبي النظارات في مصر.",
    // Category
    "cat.back": "العودة إلى الرئيسية", "cat.all": "الكل",
    "cat.sun.title": "مجموعة الشمسي", "cat.sun.desc": "نظارات شمسية متميزة لكل أسلوب.",
    "cat.china.title": "صيني (طبي)", "cat.china.desc": "إطارات طبية عالية الجودة بقيمة ممتازة.",
    "cat.italy.title": "إيطالي (طبي)", "cat.italy.desc": "إطارات إيطالية فاخرة للمميزين.",
    "cat.children.title": "مجموعة الأطفال", "cat.children.desc": "إطارات خفيفة الوزن ومتينة مصممة خصيصاً للأطفال.",
    "cat.clipon.title": "كليب أون", "cat.clipon.desc": "عدسات كليب مغناطيسية تُثبَّت على إطاراتك الحالية — خيارات شمسية وبلو كت ومستقطبة.",
    "cat.select": "اختر الإطار", "cat.classic": "كلاسيكي",
    "cat.notfound": "الفئة غير موجودة", "cat.returnHome": "العودة للرئيسية",
    "cat.addToCart": "أضف للسلة", "cat.view": "عرض",
    // Product
    "product.notFound": "المنتج غير موجود.",
    "product.addToCart": "أضف إلى السلة", "product.added": "تمت الإضافة",
    "product.quantity": "الكمية", "product.specs": "مواصفات الإطار",
    "product.view": "عرض التفاصيل",
    // Specs
    "spec.frameType": "نوع الإطار", "spec.material": "المادة",
    "spec.lensWidth": "عرض العدسة", "spec.bridge": "الجسر",
    "spec.temple": "طول الذراع", "spec.color": "اللون", "spec.gender": "الجنس",
    // Checkout
    "checkout.back": "رجوع", "checkout.title": "أكمل طلبك",
    "checkout.ordering": "الطلب:", "checkout.sunglasses": "نظارات شمسية", "checkout.prescription": "طبي",
    "checkout.name": "الاسم الكامل", "checkout.name.placeholder": "أحمد محمد",
    "checkout.phone": "رقم الهاتف", "checkout.phone.placeholder": "01XX XXX XXXX",
    "checkout.email": "البريد الإلكتروني", "checkout.email.placeholder": "مثال@بريد.كوم",
    "checkout.address": "عنوان التوصيل", "checkout.address.placeholder": "أدخل عنوان التوصيل الكامل",
    "checkout.rxSection": "تفاصيل الوصفة الطبية", "checkout.uploadRx": "إرفاق الكشف",
    "checkout.uploadHint": "انقر أو اسحب الملف للرفع", "checkout.uploadFormats": "يدعم PDF و JPG و PNG",
    "checkout.lensType": "اختر نوع العدسة",
    "checkout.darkenNote": "(هذه العدسة يتغير لونها وتصبح غامقة في الشمس.)",
    "checkout.summary": "ملخص الطلب", "checkout.itemPrice": "سعر المنتج",
    "checkout.delivery": "رسوم التوصيل", "checkout.freeShipping": "توصيل مجاني",
    "checkout.total": "الإجمالي", "checkout.submit": "تأكيد الطلب",
    "checkout.terms": "بتأكيد هذا الطلب، فإنك توافق على شروط الخدمة وسياسة الإرجاع.",
    "checkout.success.title": "تم تأكيد الطلب",
    "checkout.success.desc": "شكراً لاختيارك أشرف منير. لقد تلقينا طلبك لـ {product} وسنتواصل معك قريباً.",
    "checkout.success.return": "العودة إلى المتجر",
    "checkout.emptyCart": "سلتك فارغة.",
    "checkout.goToCart": "اذهب إلى السلة",
    // Cart
    "cart.title": "سلة التسوق", "cart.empty": "سلتك فارغة",
    "cart.emptyDesc": "تصفح مجموعاتنا وأضف الإطارات المفضلة لديك.",
    "cart.continueShopping": "مواصلة التسوق", "cart.checkout": "متابعة إلى الدفع",
    "cart.lensOption": "خيار العدسة",
    "cart.withLenses": "بالعدسات",
    "cart.withoutLenses": "بدون عدسات",
    "cart.lensNote": "هذا السعر لا يشمل سعر العدسات. سيتم التواصل معك لتبليغك سعر العدسات الصحيح.",
    "cart.selectLensType": "اختر نوع العدسة",
    "cart.uploadRx": "إرفاق الكشف",
    // Promo
    "promo.label": "كود الخصم", "promo.placeholder": "أدخل كود الخصم",
    "promo.apply": "تطبيق", "promo.applied": "تم تطبيق الخصم",
    "promo.invalid": "كود الخصم غير صحيح أو منتهي الصلاحية.",
    "promo.discount": "الخصم",
    // Search
    "search.placeholder": "ابحث عن إطارات، مواد، ألوان…",
    "search.resultsFor": "نتائج البحث عن",
    "search.resultsCount": "نتيجة",
    "search.noResults": "لا توجد نتائج",
    "search.noResultsDesc": "جرّب كلمة مختلفة — مثلاً 'معدن'، 'أفياتور'، أو 'إيطالي'.",
    // Lens types
    "lens.blue_cut": "بلو كت", "lens.anti_reflection": "مضادة للانعكاس",
    "lens.white": "بيضاء", "lens.blue_cut_grey": "بلو كت رمادي",
    "lens.grey": "رمادي", "lens.brown": "بني", "lens.blue_cut_brown": "بلو كات بني",
    // Order confirmation
    "order.number": "طلب", "order.thankYou": "شكراً لاختيارك أشرف منير. سنتواصل معك قريباً لتأكيد طلبك.",
    "order.yourDetails": "بياناتك", "order.items": "عناصر الطلب",
    "order.noData": "لم يتم العثور على طلب.",
    // Footer
    "footer.desc": "بوتيك بصري متميز يقدم أفضل مجموعة مختارة من النظارات الشمسية والإطارات الطبية.",
    "footer.categories": "الفئات", "footer.cat.sun": "مجموعة الشمسي",
    "footer.cat.china": "صيني (طبي)", "footer.cat.italy": "إيطالي (طبي)",
    "footer.cat.children": "مجموعة الأطفال", "footer.cat.clipon": "كليب أون",
    "footer.contact": "تواصل معنا", "footer.phone": "خدمة العملاء",
    "footer.hours": "يومياً: ١١ص – ١٢م", "footer.social": "تابعنا",
    "footer.copyright": "© {year} أشرف منير. جميع الحقوق محفوظة.",
    "footer.privacy": "سياسة الخصوصية", "footer.terms": "شروط الخدمة",
    // Validation
    "val.name": "يجب أن يكون الاسم أكثر من حرفين.", "val.phone": "رقم هاتف صحيح مطلوب.",
    "val.email": "عنوان البريد الإلكتروني غير صالح.", "val.address": "العنوان مطلوب.",
    "val.rx": "ملف الوصفة الطبية مطلوب", "val.lens": "يرجى اختيار نوع العدسة.",
    // Track order
    "footer.trackOrder": "تتبع طلبي",
    "track.title": "تتبع طلبك", "track.subtitle": "أدخل بريدك الإلكتروني أو رقم هاتفك المستخدم عند الطلب لمعرفة حالة شحنتك.",
    "track.byEmail": "بالبريد الإلكتروني", "track.byPhone": "برقم الهاتف",
    "track.email": "البريد الإلكتروني", "track.orderNum": "رقم الطلب (اختياري)",
    "track.phone": "رقم الهاتف",
    "track.phone.placeholder": "01XX XXX XXXX",
    "track.orderNumHint": "يمكنك إيجاده في صفحة تأكيد الطلب.",
    "track.submit": "تتبع الطلب", "track.searching": "جاري البحث…",
    "track.newSearch": "بحث جديد",
    "track.found1": "تم العثور على طلب واحد", "track.foundN": "تم العثور على {n} طلبات",
    "track.viewItems": "عرض المنتجات",
    "track.notFound": "لم نعثر على أي طلبات بهذا البريد. تأكد من إدخال البريد المستخدم عند الطلب.",
    "track.notFoundPhone": "لم نعثر على أي طلبات بهذا الرقم. تأكد من إدخال الرقم المستخدم عند الطلب.",
    "track.error": "حدث خطأ. يرجى المحاولة مرة أخرى.",
    "track.items": "المنتجات", "track.delivery": "التوصيل", "track.discount": "خصم",
    "track.free": "مجاني", "track.total": "الإجمالي",
  },
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "en", toggleLang: () => {}, t: (key) => key, dir: "ltr",
});

export function LanguageProvider({
  children,
  initialLang,
}: {
  children: React.ReactNode;
  /** Forces the initial language (e.g. derived from a `/ar/...` URL). Takes priority over localStorage. */
  initialLang?: Language;
}) {
  const [lang, setLang] = useState<Language>(() => {
    if (initialLang) return initialLang;
    if (typeof window === "undefined") return "en";
    return (localStorage.getItem("am_lang") as Language) || "en";
  });

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    localStorage.setItem("am_lang", lang);
  }, [lang]);

  const toggleLang = () => setLang((prev) => (prev === "en" ? "ar" : "en"));
  const t = (key: string) => translations[lang][key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t, dir: lang === "ar" ? "rtl" : "ltr" }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
