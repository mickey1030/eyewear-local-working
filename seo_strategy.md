# SEO Strategy

## In scope
- Public storefront home page (`/`)
- Category and subcategory listing pages (`/category/**`)
- Product detail pages (`/product/**`)
- Public search page (`/search`)
- Public utility routes only for crawl/index control checks (`/cart`, `/order`, `/order-confirmation`)

## Out of scope
- Admin product-management workflow content (`/admin`) except where its public route exposure affects crawlability or indexation
- Authenticated back-office behavior after successful admin login

## Target audience
- Shoppers looking for sunglasses and prescription eyewear in Egypt
- English- and Arabic-speaking users

## Primary keywords
- Unknown — likely branded eyewear queries plus sunglasses, prescription glasses, and category-specific terms. Update when keyword strategy is defined.

## Site characteristics
- Frontend is a Vite + React single-page application using Wouter routing
- The initial HTML shell is `artifacts/ashraf-monir/index.html`
- Public product and category content is rendered client-side

## Dismissed categories
- (None yet)
