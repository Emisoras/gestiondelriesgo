
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, firestore } from "@/firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import type { UserProfile } from "@/firebase/auth/use-user";
import { Logo } from "@/components/icons/logo";

const formSchema = z.object({
  email: z.string().email({ message: "Por favor ingrese un correo válido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSignIn = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // Check user profile status in Firestore
      const userRef = doc(firestore, `users/${user.uid}`);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const userProfile = docSnap.data() as UserProfile;
        
        if (userProfile.estado === 'pendiente') {
          await signOut(auth);
          toast({
            variant: "destructive",
            title: "Cuenta Pendiente",
            description: "Su cuenta está pendiente de aprobación por un administrador.",
          });
          setIsSubmitting(false);
          return;
        }

        if (userProfile.estado === 'inactivo') {
          await signOut(auth);
          toast({
            variant: "destructive",
            title: "Cuenta Inactiva",
            description: "Su cuenta ha sido inhabilitada. Contacte a un administrador.",
          });
          setIsSubmitting(false);
          return;
        }
      } else {
        // This case might happen on first login if the profile isn't created yet
        // The client-provider should handle creation, but as a fallback:
        await signOut(auth);
        toast({
          variant: "destructive",
          title: "Error de Perfil",
          description: "No se pudo encontrar su perfil. Intente registrarse de nuevo.",
        });
        setIsSubmitting(false);
        return;
      }
      
      // If active, proceed
      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido de nuevo.",
      });
      router.push('/dashboard');

    } catch (error: any) {
      console.error("Firebase sign-in error:", error);
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: "Credenciales incorrectas o error de conexión.",
      });
    } finally {
      // Don't set isSubmitting to false if routing away, to prevent button re-enabling
      if (router.pathname === '/login') {
          setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Logo className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="mt-4 font-headline text-2xl">ResQ Hub</CardTitle>
          <CardDescription>
            Inicie sesión para acceder al panel de gestión de emergencias.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSignIn)} className="space-y-4">
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
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                {isSubmitting ? "Ingresando..." : "Iniciar Sesión"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center text-sm">
          <p className="text-muted-foreground">¿No tienes una cuenta?</p>
          <Button variant="link" asChild className="px-1">
            <Link href="/signup">Regístrate aquí</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
