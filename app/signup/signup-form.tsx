
"use client";

import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { auth } from '@/firebase/firebase';

const formSchema = z.object({
  displayName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  email: z.string().email({ message: "Por favor ingrese un correo válido." }),
  password: z.string()
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres." })
    .regex(/[A-Z]/, { message: "Debe contener al menos una letra mayúscula." })
    .regex(/[a-z]/, { message: "Debe contener al menos una letra minúscula." })
    .regex(/\d/, { message: "Debe contener al menos un número." })
    .regex(/[^A-Za-z0-9]/, { message: "Debe contener al menos un carácter especial." }),
});

export function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
    },
  });

  const handleSignUp = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        await updateProfile(userCredential.user, { displayName: values.displayName });

        // Sign out the user immediately after creation
        await signOut(auth);

        toast({
            title: "¡Registro exitoso!",
            description: "Tu cuenta ha sido creada y está pendiente de aprobación.",
            duration: 5000,
        });
        router.push('/login');

    } catch (error: any) {
        console.error("Firebase sign-up error", error);
        toast({
            variant: "destructive",
            title: "Error en el registro",
            description: "El correo ya podría estar en uso o hubo un problema de conexión.",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSignUp)} className="space-y-4">
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
                    <Input type="email" placeholder="su@correo.com" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
            {isSubmitting ? "Creando cuenta..." : "Registrarse"}
            </Button>
        </form>
        </Form>
        <CardFooter className="flex flex-col items-center justify-center text-sm mt-6">
          <p className="text-muted-foreground">¿Ya tienes una cuenta?</p>
          <Button variant="link" asChild className="px-1">
            <Link href="/login">Inicia sesión aquí</Link>
          </Button>
        </CardFooter>
    </>
  );
}
