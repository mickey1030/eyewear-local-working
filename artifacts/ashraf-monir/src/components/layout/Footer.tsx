import { Glasses, Phone } from "lucide-react";
import { Link } from "wouter";
import { SiFacebook, SiInstagram, SiTiktok, SiWhatsapp } from "react-icons/si";
import { useLanguage } from "@/contexts/LanguageContext";

export function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/5 bg-background text-muted-foreground py-12 md:py-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2 text-primary w-fit">
              <Glasses className="h-5 w-5" />
              <span className="font-serif text-xl font-bold tracking-tight">Ashraf Monir</span>
            </Link>
            <p className="text-sm max-w-xs leading-relaxed">
              {t("footer.desc")}
            </p>

            <div className="pt-2 space-y-3">
              <p className="text-xs uppercase tracking-widest text-muted-foreground/60 font-medium">{t("footer.phone")}</p>
              <a
                href="tel:+201125554727"
                data-testid="link-phone"
                className="inline-flex items-center gap-2 text-foreground font-semibold text-lg hover:text-primary transition-colors"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Phone className="h-4 w-4" />
                </span>
                0112 5554727
              </a>
              <p className="text-xs text-muted-foreground/70">{t("footer.hours")}</p>
            </div>

            <div className="pt-2 space-y-3">
              <p className="text-xs uppercase tracking-widest text-muted-foreground/60 font-medium">{t("footer.social")}</p>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.facebook.com/share/1HLLyJS6P1/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-facebook"
                  aria-label="Facebook"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-muted-foreground hover:border-[#1877F2]/50 hover:bg-[#1877F2]/10 hover:text-[#1877F2] transition-all duration-200"
                >
                  <SiFacebook className="h-5 w-5" />
                </a>
                <a
                  href="https://www.instagram.com/ashraf.monir0?igsh=MW0xaXhwdXRudDY4Ng%3D%3D&utm_source=qr"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-instagram"
                  aria-label="Instagram"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-muted-foreground hover:border-[#E1306C]/50 hover:bg-[#E1306C]/10 hover:text-[#E1306C] transition-all duration-200"
                >
                  <SiInstagram className="h-5 w-5" />
                </a>
                <a
                  href="https://www.tiktok.com/@ashrafmonireyewear?_r=1&_t=ZS-97Y76IgQOo9"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-tiktok"
                  aria-label="TikTok"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-muted-foreground hover:border-white/40 hover:bg-white/10 hover:text-foreground transition-all duration-200"
                >
                  <SiTiktok className="h-5 w-5" />
                </a>
                <a
                  href="https://wa.me/201125554727"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-whatsapp"
                  aria-label="WhatsApp"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-muted-foreground hover:border-[#25D366]/50 hover:bg-[#25D366]/10 hover:text-[#25D366] transition-all duration-200"
                >
                  <SiWhatsapp className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-foreground">{t("footer.categories")}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/category/sun" className="hover:text-primary transition-colors">{t("footer.cat.sun")}</Link></li>
              <li><Link href="/category/china" className="hover:text-primary transition-colors">{t("footer.cat.china")}</Link></li>
              <li><Link href="/category/italy" className="hover:text-primary transition-colors">{t("footer.cat.italy")}</Link></li>
              <li><Link href="/category/children" className="hover:text-primary transition-colors">{t("footer.cat.children")}</Link></li>
              <li><Link href="/category/clip-on" className="hover:text-primary transition-colors">{t("footer.cat.clipon")}</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-foreground">{t("footer.contact")}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="tel:+201125554727" className="hover:text-primary transition-colors">0112 5554727</a>
              </li>
              <li>{t("footer.hours")}</li>
              <li>
                <a href="https://wa.me/201125554727" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors inline-flex items-center gap-1.5">
                  <SiWhatsapp className="h-3.5 w-3.5 text-[#25D366]" /> WhatsApp
                </a>
              </li>
              <li>
                <Link href="/track-order" className="hover:text-primary transition-colors">
                  {t("footer.trackOrder")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <p>{t("footer.copyright").replace("{year}", String(year))}</p>
          <div className="flex gap-4">
            <span className="hover:text-primary cursor-pointer transition-colors">{t("footer.privacy")}</span>
            <span className="hover:text-primary cursor-pointer transition-colors">{t("footer.terms")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
