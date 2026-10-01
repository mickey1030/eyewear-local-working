import { Switch, Route, Router as WouterRouter } from "wouter";
import TrackOrder from "@/pages/TrackOrder";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SeoHeadContext, type SeoHeadProps } from "@/lib/seo-head";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Home from "@/pages/Home";
import Category from "@/pages/Category";
import Checkout from "@/pages/Checkout";
import ProductDetail from "@/pages/ProductDetail";
import Cart from "@/pages/Cart";
import Search from "@/pages/Search";
import OrderConfirmation from "@/pages/OrderConfirmation";
import Admin from "@/pages/Admin";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CartProvider } from "@/contexts/CartContext";
import { RobotsMeta } from "@/components/seo/RobotsMeta";
import { isArabicPath } from "@/lib/seo";

const queryClient = new QueryClient();

function Router() {
  return (
    <div className="min-h-[100dvh] flex flex-col selection:bg-primary/30 dark bg-background text-foreground">
      <RobotsMeta />
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/category/:category" component={Category} />
          <Route path="/category/:category/:subcategory" component={Category} />
          <Route path="/product/:id" component={ProductDetail} />
          <Route path="/cart" component={Cart} />
          <Route path="/search" component={Search} />
          <Route path="/order" component={Checkout} />
          <Route path="/order-confirmation" component={OrderConfirmation} />
          <Route path="/track-order" component={TrackOrder} />
          <Route path="/admin" component={Admin} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

interface AppProps {
  /** Full pathname (incl. optional `/ar` locale prefix) being rendered on the server. Omitted on the client, where `window.location` is used instead. */
  ssrUrl?: string;
  /** Populated synchronously by `SeoHead` during `renderToString` so the SSR entry point can extract `<head>` tags. */
  seoBox?: { current?: SeoHeadProps };
}

function App({ ssrUrl, seoBox }: AppProps) {
  const [ssrPathname, ssrSearch] = ssrUrl ? ssrUrl.split("?") : [undefined, undefined];
  const pathname = ssrPathname ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  const arabic = isArabicPath(pathname);
  const appBase = import.meta.env.BASE_URL.replace(/\/$/, "");
  const routerBase = arabic ? `${appBase}/ar` : appBase;
  // wouter's `base` is stripped internally against the raw pathname, so ssrPath
  // must still include the `/ar` prefix (do NOT pre-strip it here).
  const ssrPath = ssrPathname;

  return (
    <QueryClientProvider client={queryClient}>
      <SeoHeadContext.Provider value={{ set: (data) => { if (seoBox) seoBox.current = data; } }}>
        <TooltipProvider>
          <LanguageProvider initialLang={arabic ? "ar" : undefined}>
            <CartProvider>
              <WouterRouter base={routerBase} ssrPath={ssrPath} ssrSearch={ssrSearch}>
                <Router />
              </WouterRouter>
            </CartProvider>
          </LanguageProvider>
          <Toaster />
        </TooltipProvider>
      </SeoHeadContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
