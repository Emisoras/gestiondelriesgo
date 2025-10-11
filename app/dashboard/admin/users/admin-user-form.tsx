
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Loader2, Save, Send } from "lucide-react";
import { updateUserProfile, sendPasswordResetEmailForUser } from "@/firebase/user-actions";
import type { UserProfile } from "./users-table";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  displayName: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  email: z.string().email(),
  role: z.enum(["administrador", "empleado"]),
  estado: z.enum(["activo", "inactivo", "pendiente"]),
});

type AdminUserFormProps = {
    user: UserProfile;
    onFinished: () => void;
}

export function AdminUserForm({ user, onFinished }: AdminUserFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: user.displayName || "",
      email: user.email || "",
      role: user.role || "empleado",
      estado: user.estado || "pendiente",
    },
  });

  useEffect(() => {
    form.reset({
        displayName: user.displayName || "",
        email: user.email || "",
        role: user.role || "empleado",
        estado: user.estado || "pendiente",
    });
  }, [user, form]);
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
        await updateUserProfile(user.id, { 
            displayName: values.displayName,
            role: values.role,
            estado: values.estado,
        });
        toast({
            title: "Usuario Actualizado",
            description: "Los datos del usuario han sido actualizados.",
        });
        onFinished();
    } catch (error: any) {
        toast({
            title: "Error al actualizar",
            description: error.message || "No se pudo actualizar el usuario.",
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handlePasswordReset = async () => {
    setIsSendingEmail(true);
    try {
      await sendPasswordResetEmailForUser(user.email);
      toast({
        title: "Correo Enviado",
        description: `Se ha enviado un correo para restablecer la contraseña a ${user.email}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error al enviar el correo",
        description: error.message || "No se pudo enviar el correo de restablecimiento.",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <>
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
          <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                  <FormItem>
                      <FormLabel>Rol</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                          <SelectTrigger>
                              <SelectValue placeholder="Seleccionar rol" />
                          </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                              <SelectItem value="administrador">Administrador</SelectItem>
                              <SelectItem value="empleado">Empleado</SelectItem>
                          </SelectContent>
                      </Select>
                      <FormMessage />
                  </FormItem>
              )}
          />
          <FormField
              control={form.control}
              name="estado"
              render={({ field }) => (
                  <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                          <SelectTrigger>
                              <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                              <SelectItem value="activo">Activo</SelectItem>
                              <SelectItem value="inactivo">Inactivo</SelectItem>
                              <SelectItem value="pendiente">Pendiente</SelectItem>
                          </SelectContent>
                      </Select>
                      <FormMessage />
                  </FormItem>
              )}
          />
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4"/>}
            Guardar Cambios
          </Button>
        </form>
      </Form>
      <Separator className="my-6" />
      <div>
        <h3 className="text-md font-semibold mb-2">Zona de Peligro</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Esta acción enviará un correo electrónico al usuario para que pueda restablecer su contraseña.
        </p>
        <Button
            variant="destructive"
            onClick={handlePasswordReset}
            disabled={isSendingEmail}
            className="w-full"
        >
            {isSendingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4"/>}
            Enviar correo de restablecimiento
        </Button>
      </div>
    </>
  );
}
