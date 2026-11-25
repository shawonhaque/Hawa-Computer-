import type { Metadata } from "next";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { Breadcrumbs, PageHero } from "@/components/site/breadcrumbs";
import { CartView } from "@/components/site/cart-view";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage() {
  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";

  return (
    <>
      <PageHero eyebrow={bn ? "শপ" : "Shop"} title={d.common.cart} />
      <div className="container-page py-10">
        <Breadcrumbs items={[{ label: d.nav.home, href: "/" }, { label: d.nav.shop, href: "/shop" }, { label: d.common.cart }]} />
        <CartView
          locale={locale}
          labels={{
            empty: d.shop.cartEmpty,
            emptyBody: d.shop.cartEmptyBody,
            browse: d.shop.allProducts,
            quantity: d.common.quantity,
            remove: d.common.delete,
            subtotal: d.common.subtotal,
            delivery: d.common.delivery,
            checkout: d.shop.checkout,
            continue: d.common.continue,
            deliveryNote: bn ? "চেকআউটে যোগ হবে" : "Calculated at checkout",
          }}
        />
      </div>
    </>
  );
}
