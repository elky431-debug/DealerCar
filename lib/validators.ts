import { z } from "zod";

export const registerSchema = z
  .object({
    company_name: z.string().min(2, "Nom d'entreprise requis"),
    email: z.string().email("Email invalide"),
    phone: z
      .string()
      .min(6, "Téléphone requis")
      .max(30, "Téléphone trop long"),
    location: z.string().min(2, "Localisation requise"),
    password: z.string().min(8, "8 caractères minimum"),
    password_confirm: z.string(),
  })
  .refine((d) => d.password === d.password_confirm, {
    message: "Les mots de passe ne correspondent pas",
    path: ["password_confirm"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});
export type LoginInput = z.infer<typeof loginSchema>;

const currentYear = new Date().getFullYear();

export const vehicleSchema = z
  .object({
    brand: z.string().min(1, "Marque requise"),
    model: z.string().min(1, "Modèle requis"),
    year: z.coerce
      .number()
      .int()
      .min(1900, "Année invalide")
      .max(currentYear + 1, "Année invalide"),
    mileage: z.coerce.number().int().min(0, "Kilométrage invalide"),
    price: z.coerce.number().min(0, "Prix invalide"),
    location: z.string().min(1, "Localisation requise"),
    description: z.string().optional().or(z.literal("")),
    type: z.enum(["stock", "depot"]),
    visibility: z.enum(["private", "network"]),
    status: z.enum(["available", "reserved", "sold"]).default("available"),
    client_price: z.coerce.number().min(0).optional().nullable(),
    commission_type: z.enum(["fixed", "percent"]).optional().nullable(),
    commission_value: z.coerce.number().min(0).optional().nullable(),
    deposit_client_name: z.string().optional().or(z.literal("")),
    deposit_client_phone: z.string().optional().or(z.literal("")),
    deposit_client_email: z
      .string()
      .email("Email invalide")
      .optional()
      .or(z.literal("")),
    deposit_client_address: z.string().optional().or(z.literal("")),
    deposit_notes: z.string().optional().or(z.literal("")),
  })
  .superRefine((d, ctx) => {
    if (d.type === "depot") {
      if (d.client_price == null || Number.isNaN(d.client_price)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["client_price"],
          message: "Prix client requis pour un dépôt-vente",
        });
      }
      if (!d.commission_type) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["commission_type"],
          message: "Type de commission requis",
        });
      }
      if (d.commission_value == null || Number.isNaN(d.commission_value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["commission_value"],
          message: "Valeur de commission requise",
        });
      }
      if (!d.deposit_client_name || d.deposit_client_name.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["deposit_client_name"],
          message: "Nom du client déposant requis",
        });
      }
    }
  });

export type VehicleInput = z.infer<typeof vehicleSchema>;

// ---------- Lead (client intéressé) ----------
export const leadSchema = z
  .object({
    name: z.string().min(2, "Nom requis"),
    phone: z.string().optional().or(z.literal("")),
    email: z.string().email("Email invalide").optional().or(z.literal("")),
    vehicle_id: z.string().uuid().optional().nullable().or(z.literal("")),
    message: z.string().optional().or(z.literal("")),
    status: z
      .enum(["new", "contacted", "hot", "cold", "won", "lost"])
      .default("new"),
    notes: z.string().optional().or(z.literal("")),
  })
  .superRefine((d, ctx) => {
    if (!d.phone && !d.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone"],
        message: "Renseignez au moins un téléphone ou un email",
      });
    }
  });

export type LeadInput = z.infer<typeof leadSchema>;

export const profileSchema = z.object({
  company_name: z.string().min(2, "Nom d'entreprise requis"),
  phone: z.string().min(6, "Téléphone requis"),
  location: z.string().min(2, "Ville/Localisation requise"),
  siret: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^\d{14}$/.test(v.replace(/\s/g, "")), {
      message: "SIRET = 14 chiffres",
    }),
  specialties: z.string().max(500, "500 caractères max").optional().or(z.literal("")),
});
export type ProfileInput = z.infer<typeof profileSchema>;
