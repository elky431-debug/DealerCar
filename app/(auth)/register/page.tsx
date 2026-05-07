"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { registerSchema, type RegisterInput } from "@/lib/validators";

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterInput) {
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          company_name: values.company_name,
          phone: values.phone,
          location: values.location,
        },
      },
    });
    if (error) {
      toast.error("Inscription impossible", error.message);
      return;
    }
    toast.success("Compte créé", "Bienvenue sur DealerLink.");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Créer un compte marchand</CardTitle>
        <CardDescription>Quelques informations et c'est parti.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field
            label="Nom de l'entreprise"
            htmlFor="company_name"
            required
            error={errors.company_name?.message}
          >
            <Input id="company_name" {...register("company_name")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" htmlFor="email" required error={errors.email?.message}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email")}
              />
            </Field>
            <Field label="Téléphone" htmlFor="phone" required error={errors.phone?.message}>
              <Input id="phone" type="tel" autoComplete="tel" {...register("phone")} />
            </Field>
          </div>
          <Field label="Localisation" htmlFor="location" required error={errors.location?.message}>
            <Input id="location" placeholder="Ville, département…" {...register("location")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mot de passe" htmlFor="password" required error={errors.password?.message}>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                {...register("password")}
              />
            </Field>
            <Field
              label="Confirmation"
              htmlFor="password_confirm"
              required
              error={errors.password_confirm?.message}
            >
              <Input
                id="password_confirm"
                type="password"
                autoComplete="new-password"
                {...register("password_confirm")}
              />
            </Field>
          </div>
          <Button type="submit" className="w-full" loading={isSubmitting}>
            Créer mon compte
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Déjà inscrit ?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
