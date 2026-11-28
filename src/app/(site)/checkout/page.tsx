import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/dictionaries";
import { getSessionUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { Breadcrumbs, PageHero } from "@/components/site/breadcrumbs";
import { CheckoutForm } from "@/components/site/checkout-form";
import { StaticCheckout } from "@/components/site/static-checkout";
import { STATIC_MODE } from "@/lib/static-mode";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const user = STATIC_MODE ? null : await getSessionUser();
  if (!STATIC_MODE && !user) redirect("/login?next=%2Fcheckout");

  const locale = await getLocale();
  const d = getDict(locale);
  const bn = locale === "bn";
  const settings = await getSettings();


  return (
    <>
      <PageHero eyebrow={bn ? "শপ" : "Shop"} title={d.shop.checkout} />
      <div className="container-page py-10">
        <Breadcrumbs
          items={[
            { label: d.nav.home, href: "/" },
            { label: d.common.cart, href: "/cart" },
            { label: d.shop.checkout },
          ]}
        />
        {STATIC_MODE ? (
          <StaticCheckout en={!bn} delivery={settings.deliveryInside} />
        ) : (
        <CheckoutForm
            locale={locale}
            deliveryInside={settings.deliveryInside}
            deliveryOutside={settings.deliveryOutside}
            freeDeliveryAbove={settings.freeDeliveryAbove}
            defaultName={user?.name ?? ""}
            defaultPhone={user?.phone ?? undefined}
            labels={{
              receiver: d.shop.receiver,
              phone: d.auth.phone,
              address: d.shop.address,
              city: d.shop.city,
              zone: d.shop.deliveryZone,
              inside: d.shop.insideCity,
              outside: d.shop.outsideCity,
              notes: d.shop.orderNotes,
              coupon: bn ? "কুপন কোড" : "Coupon code",
              apply: bn ? "প্রয়োগ" : "Apply",
              payment: d.shop.paymentMethod,
              placeOrder: d.shop.placeOrder,
              submitting: d.common.loading,
              empty: d.shop.cartEmpty,
              browse: d.shop.allProducts,
              items: d.order.items,
              subtotal: d.common.subtotal,
              delivery: d.common.delivery,
              discount: d.common.discount,
              total: d.common.total,
              freeDelivery: bn ? "ফ্রি" : "Free",
              cash: d.payment.cash,
              cod: d.payment.cod,
            }}
          />
        )}
      </div>
    </>
  );
}
