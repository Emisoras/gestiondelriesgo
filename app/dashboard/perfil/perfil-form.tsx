
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase";
import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { updateCurrentUserInfo } from "@/firebase/user-actions";

const formSchema = z.object({
  displayName: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  email: z.string().email(),
});

export function PerfilForm() {
  const { userProfile, loading } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: "",
      email: "",
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        displayName: userProfile.displayName || "",
        email: userProfile.email || "",
      });
    }
  }, [userProfile, form]);
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
        await updateCurrentUserInfo({ displayName: values.displayName });
        toast({
            title: "Perfil Actualizado",
            description: "Su nombre ha sido actualizado correctamente.",
        });
    } catch (error: any) {
        toast({
            title: "Error al actualizar",
            description: error.message || "No se pudo actualizar el perfil.",
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  if (loading) {
    return <div>Cargando perfil...</div>
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Completo</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo Electrónico</FormLabel>
              <FormControl>
                <Input type="email" {...field} readOnly disabled />
              </FormControl>
               <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4"/>}
          Guardar Cambios
        </Button>
      </form>
    </Form>
  );
}
