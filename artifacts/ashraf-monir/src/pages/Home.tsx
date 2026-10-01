import { useState } from "react";
import { SeoHead } from "@/lib/seo-head";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Star, Shield, Eye, ChevronDown, Quote } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { DEFAULT_SITE_ORIGIN, absoluteUrl } from "@/lib/seo";

const REVIEWS = [
  { name: "Ahmed M.", nameAr: "أحمد م.", rating: 5, date: "May 2025", dateAr: "مايو ٢٠٢٥",
    text: "Exceptional quality and fast delivery. The Italy frames I ordered are incredibly lightweight — exactly as described.",
    textAr: "جودة استثنائية وتوصيل سريع. الإطارات الإيطالية التي طلبتها خفيفة بشكل لا يصدق — تماماً كما هو موصوف." },
  { name: "Sara K.", nameAr: "سارة خ.", rating: 5, date: "Apr 2025", dateAr: "أبريل ٢٠٢٥",
    text: "Ordered sunglasses for my husband and he loves them. The bilingual site made it so easy to browse in Arabic.",
    textAr: "طلبت نظارات شمسية لزوجي وهو يحبها. الموقع ثنائي اللغة جعل التصفح باللغة العربية سهلاً جداً." },
  { name: "Mohamed H.", nameAr: "محمد ح.", rating: 4, date: "Mar 2025", dateAr: "مارس ٢٠٢٥",
    text: "Great selection of prescription frames at fair prices. Customer service was very responsive and helpful.",
    textAr: "تشكيلة رائعة من الإطارات الطبية بأسعار عادلة. خدمة العملاء كانت متجاوبة جداً ومفيدة." },
  { name: "Nour A.", nameAr: "نور أ.", rating: 5, date: "Feb 2025", dateAr: "فبراير ٢٠٢٥",
    text: "The darkening note on the checkout page was really helpful. Chose blue cut grey — love how it works outdoors.",
    textAr: "الملاحظة الخاصة بتغيير اللون في صفحة الدفع كانت مفيدة جداً. اخترت بلو كت رمادي — أحب كيف يعمل في الخارج." },
];

const FAQ_KEYS = ["faq.q1", "faq.q2", "faq.q4", "faq.q5"] as const;

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn("h-4 w-4", i < count ? "fill-primary text-primary" : "text-muted-foreground/30")} />
      ))}
    </div>
  );
}

const STRUCTURED_DATA_FAQ_KEYS = ["faq.q1", "faq.q2", "faq.q4", "faq.q5"] as const;

export default function Home() {
  const { t, lang } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const title =
    lang === "ar"
      ? "أشرف منير | نظارات شمسية وطبية فاخرة في مصر"
      : "Ashraf Monir | Luxury Sunglasses & Prescription Eyewear in Egypt";
  const description =
    lang === "ar"
      ? "تسوّق مجموعة أشرف منير المختارة من النظارات الشمسية والإطارات الطبية الإيطالية والصينية والمخصصة للأطفال، بجودة أصلية وضمان كامل."
      : "Shop Ashraf Monir's curated collection of luxury sunglasses and prescription eyewear — Italy, China, sun, and children's frames — with authentic quality and full warranty.";
  const enUrl = absoluteUrl(DEFAULT_SITE_ORIGIN, "/");
  const arUrl = absoluteUrl(DEFAULT_SITE_ORIGIN, "/ar");
  const canonical = lang === "ar" ? arUrl : enUrl;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Ashraf Monir",
        url: enUrl,
        logo: absoluteUrl(DEFAULT_SITE_ORIGIN, "/favicon.svg"),
      },
      {
        "@type": "WebSite",
        name: "Ashraf Monir",
        url: enUrl,
        potentialAction: {
          "@type": "SearchAction",
          target: `${enUrl}search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: STRUCTURED_DATA_FAQ_KEYS.map((qKey) => ({
          "@type": "Question",
          name: t(qKey),
          acceptedAnswer: {
            "@type": "Answer",
            text: t(qKey.replace(".q", ".a")),
          },
        })),
      },
    ],
  };

  return (
    <div className="flex flex-col w-full">
      <SeoHead
        title={title}
        description={description}
        canonical={canonical}
        hreflangs={[
          { hrefLang: "en", href: enUrl },
          { hrefLang: "ar", href: arUrl },
          { hrefLang: "x-default", href: enUrl },
        ]}
        og={{ title, description, url: canonical, locale: lang === "ar" ? "ar_EG" : "en_US" }}
        twitter={{ title, description }}
        jsonLd={structuredData}
      />
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/hero.webp" alt="Ashraf Monir boutique" fetchPriority="high" decoding="async" className="w-full h-full object-cover opacity-40 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/20" />
        </div>
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm text-primary">
              <Star className="h-4 w-4 fill-primary/50" />
              <span>{t("home.badge")}</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-[1.1]">
              {t("home.hero.title1")} <span className="text-primary italic">{t("home.hero.title2")}</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">{t("home.hero.desc")}</p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="h-14 px-8 text-base bg-primary hover:bg-primary/90 text-primary-foreground" asChild>
                <Link href="/category/sun">{t("home.hero.shopSun")} <ArrowRight className="ms-2 h-5 w-5" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-base border-white/40 text-foreground hover:bg-white/10" asChild>
                <Link href="/category/italy">{t("home.hero.viewRx")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      {/* Collections */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
            <div className="space-y-4 max-w-xl">
              <h2 className="text-3xl md:text-4xl font-bold font-serif text-foreground">{t("home.collections.title")}</h2>
              <p className="text-muted-foreground">{t("home.collections.desc")}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
            {[
              { key: "sun",      imgSrc: "/cat-sun.jpg",      labelKey: "home.cat.collection",  titleKey: "nav.sun" },
              { key: "china",    imgSrc: "/cat-china.jpg",    labelKey: "home.cat.prescription", titleKey: "nav.china" },
              { key: "italy",    imgSrc: "/cat-italy.jpg",    labelKey: "home.cat.premiumRx",    titleKey: "nav.italy" },
              { key: "children", imgSrc: "/cat-children.jpg", labelKey: "home.cat.collection",   titleKey: "nav.children" },
              { key: "clip-on",  imgSrc: "/cat-clip-on.jpg",  labelKey: "home.cat.collection",   titleKey: "nav.clipon" },
            ].map((cat) => (
              <Link key={cat.key} href={`/category/${cat.key}`}
                className="group relative rounded-2xl overflow-hidden aspect-[3/4] md:aspect-auto md:h-[600px] bg-secondary flex items-end p-8 border border-white/5 hover:border-primary/50 transition-colors">
                <img src={cat.imgSrc} alt={t(cat.titleKey)} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="relative z-10 w-full">
                  <p className="text-primary font-medium mb-2 tracking-widest uppercase text-sm">{t(cat.labelKey)}</p>
                  <h3 className="text-3xl font-serif font-bold text-white mb-4">{t(cat.titleKey)}</h3>
                  <div className="flex items-center text-sm font-medium text-white group-hover:text-primary transition-colors">
                    {t("home.cat.explore")} <ArrowRight className="ms-2 h-4 w-4 transition-transform group-hover:translate-x-2" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      {/* Trust */}
      <section className="py-24 border-t border-white/5 bg-secondary/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            {[
              { icon: Shield, titleKey: "home.trust.quality.title", descKey: "home.trust.quality.desc" },
              { icon: Eye,    titleKey: "home.trust.lenses.title",  descKey: "home.trust.lenses.desc" },
              { icon: Star,   titleKey: "home.trust.fitting.title", descKey: "home.trust.fitting.desc" },
            ].map(({ icon: Icon, titleKey, descKey }) => (
              <div key={titleKey} className="flex flex-col items-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-serif font-semibold text-foreground">{t(titleKey)}</h3>
                <p className="text-muted-foreground text-sm max-w-xs">{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Customer Reviews */}
      <section className="py-24 bg-background border-t border-white/5">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-serif mb-4 text-foreground">{t("reviews.title")}</h2>
            <p className="text-muted-foreground">{t("reviews.subtitle")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {REVIEWS.map((r, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-secondary/20 p-6 flex flex-col gap-4 hover:border-primary/30 transition-colors">
                <Quote className="h-6 w-6 text-primary/60 shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                  {lang === "ar" ? r.textAr : r.text}
                </p>
                <div className="pt-2 border-t border-white/10">
                  <StarRating count={r.rating} />
                  <p className="font-semibold text-sm mt-2 text-foreground">{lang === "ar" ? r.nameAr : r.name}</p>
                  <p className="text-xs text-muted-foreground">{lang === "ar" ? r.dateAr : r.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* FAQ */}
      <section className="py-24 bg-secondary/30 border-t border-white/5">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-serif mb-4">{t("faq.title")}</h2>
            <p className="text-muted-foreground">{t("faq.subtitle")}</p>
          </div>
          <div className="space-y-3">
            {FAQ_KEYS.map((qKey, i) => {
              const aKey = qKey.replace(".q", ".a") as string;
              const isOpen = openFaq === i;
              return (
                <div key={qKey} className="rounded-2xl border border-white/10 bg-background overflow-hidden">
                  <button
                    data-testid={`faq-toggle-${i}`}
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-start hover:bg-white/5 transition-colors"
                  >
                    <span className="font-medium pe-4 text-foreground">{t(qKey)}</span>
                    <ChevronDown className={cn("h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-white/5 pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      {t(aKey)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
