import { Link, useLocation } from "wouter";
import { Glasses, Menu, X, ShoppingBag, Search } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";

export function Navbar() {
  const [location, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const { lang, toggleLang, t } = useLanguage();
  const { totalItems } = useCart();

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const categories = [
    { key: "nav.sun", path: "/category/sun" },
    { key: "nav.china", path: "/category/china" },
    { key: "nav.italy", path: "/category/italy" },
    { key: "nav.children", path: "/category/children" },
    { key: "nav.clipon", path: "/category/clip-on" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-20 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Glasses className="h-5 w-5" />
            </div>
            <span className="font-serif text-xl font-bold tracking-tight text-primary">Ashraf Monir</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
            {categories.map((cat) => (
              <Link
                key={cat.path} href={cat.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary whitespace-nowrap",
                  location.startsWith(cat.path) ? "text-primary" : "text-muted-foreground"
                )}
              >
                {t(cat.key)}
              </Link>
            ))}
          </div>

          {/* Desktop right actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Search input */}
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-200">
                <input
                  ref={searchRef}
                  data-testid="input-search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("search.placeholder")}
                  className="w-52 bg-secondary/60 border border-white/20 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
                />
                <button type="button" onClick={() => setSearchOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <button
                data-testid="btn-search-open"
                onClick={() => setSearchOpen(true)}
                className="text-muted-foreground hover:text-primary transition-colors p-2"
                aria-label={t("nav.search")}
              >
                <Search className="h-5 w-5" />
              </button>
            )}

            {/* Cart */}
            <Link href="/cart" data-testid="link-cart" className="relative text-muted-foreground hover:text-primary transition-colors p-2">
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -end-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </Link>

            {/* Lang toggle */}
            <button
              onClick={toggleLang}
              data-testid="button-lang-toggle"
              className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold tracking-wide text-foreground hover:border-primary/50 hover:bg-primary/10 transition-all"
            >
              <span className={cn(lang === "en" ? "text-primary" : "text-muted-foreground")}>EN</span>
              <span className="text-white/40">|</span>
              <span className={cn(lang === "ar" ? "text-primary" : "text-muted-foreground")}>AR</span>
            </button>
          </div>

          {/* Mobile right */}
          <div className="md:hidden flex items-center gap-2">
            <button
              data-testid="btn-search-open-mobile"
              onClick={() => { setSearchOpen((s) => !s); setIsOpen(false); }}
              className="text-muted-foreground hover:text-primary transition-colors p-2"
            >
              <Search className="h-5 w-5" />
            </button>
            <Link href="/cart" className="relative text-muted-foreground hover:text-primary transition-colors p-2">
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -end-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </Link>
            <button
              onClick={toggleLang}
              className="flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-2.5 py-1 text-xs font-semibold text-foreground"
            >
              <span className={cn(lang === "en" ? "text-primary" : "text-muted-foreground")}>EN</span>
              <span className="text-white/40">|</span>
              <span className={cn(lang === "ar" ? "text-primary" : "text-muted-foreground")}>AR</span>
            </button>
            <Button variant="ghost" size="icon" onClick={() => { setIsOpen(!isOpen); setSearchOpen(false); }} className="text-primary">
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile search */}
        {searchOpen && (
          <div className="md:hidden pb-3 animate-in slide-in-from-top-2">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                ref={searchRef}
                data-testid="input-search-mobile"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("search.placeholder")}
                className="flex-1 bg-secondary/60 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button type="submit" size="sm" className="shrink-0">
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-white/10 bg-background p-4 animate-in slide-in-from-top-2">
          <div className="flex flex-col gap-1">
            {categories.map((cat) => (
              <Link
                key={cat.path} href={cat.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "text-sm font-medium transition-colors p-3 rounded-xl hover:bg-white/5",
                  location.startsWith(cat.path) ? "text-primary bg-primary/10" : "text-muted-foreground"
                )}
              >
                {t(cat.key)}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
