import { z } from "zod";
import { normalisePhone } from "@/lib/utils";

export const phoneSchema = z
  .string()
  .trim()
  .transform(normalisePhone)
  .refine((v) => /^(?:\+?88)?01[3-9]\d{8}$/.test(v), { message: "invalid_phone" });

export const emailSchema = z.string().trim().toLowerCase().email();

export const passwordSchema = z
  .string()
  .min(8, { message: "password_min" })
  .max(72, { message: "password_max" });

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, { message: "name_required" }).max(80),
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    consent: z.literal("on", { message: "consent_required" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "password_mismatch",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  phone: phoneSchema.optional().or(z.literal("")),
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(4000),
});

export const checkoutSchema = z.object({
  receiverName: z.string().trim().min(2).max(80),
  phone: phoneSchema,
  address: z.string().trim().min(8).max(500),
  city: z.string().trim().min(2).max(80),
  zone: z.enum(["INSIDE", "OUTSIDE"]),
  paymentMethod: z.enum(["BKASH", "NAGAD", "ROCKET", "CASH", "COD"]),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  coupon: z.string().trim().max(30).optional().or(z.literal("")),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().int().min(1).max(50),
      }),
    )
    .min(1, { message: "cart_empty" }),
});

export const serviceOrderSchema = z.object({
  serviceId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(500),
  instructions: z.string().trim().max(2000).optional().or(z.literal("")),
  deliveryMethod: z.enum(["PICKUP", "DELIVERY"]),
  deliveryAddress: z.string().trim().max(500).optional().or(z.literal("")),
  details: z.record(z.string(), z.string()).default({}),
});

export const paymentSchema = z.object({
  method: z.enum(["BKASH", "NAGAD", "ROCKET", "CARD", "BANK", "CASH"]),
  amount: z.coerce.number().int().min(1).max(1_000_000),
  trxId: z.string().trim().min(4).max(60).optional().or(z.literal("")),
  payerNumber: z.string().trim().max(20).optional().or(z.literal("")),
});

export const ticketSchema = z.object({
  subject: z.string().trim().min(4).max(120),
  message: z.string().trim().min(10).max(4000),
  priority: z.enum(["LOW", "NORMAL", "HIGH"]).default("NORMAL"),
});

export const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: phoneSchema,
  address: z.string().trim().max(300).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  district: z.string().trim().max(80).optional().or(z.literal("")),
  postcode: z.string().trim().max(10).optional().or(z.literal("")),
});

export const trackSchema = z.object({
  orderNo: z.string().trim().min(4).max(40),
  phone: phoneSchema,
});

export const applicationSchema = z.object({
  serviceId: z.string().min(1),
  consent: z.literal("on", { message: "consent_required" }),
  note: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
