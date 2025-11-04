
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
import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { addArticulo, updateArticulo } from "@/firebase/articulo-actions";
import { useRouter } from "next/navigation";
import type { Articulo } from "./articulos-table";

const formSchema = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  categoria: z.string().min(3, "La categoría es requerida."),
  unidad: z.string().min(1, "La unidad es requerida (ej: kg, und, lts)."),
});

type ArticuloFormProps = {
    articuloId?: string;
    initialValues?: Partial<Articulo>;
}

export function ArticuloForm({ articuloId, initialValues }: ArticuloFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues || {
      nombre: "",
      categoria: "",
      unidad: "",
    },
  });

  useEffect(() => {
    if (initialValues) {
      form.reset(initialValues);
    }
  }, [initialValues, form]);
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
        if (articuloId) {
            await updateArticulo(articuloId, values);
            toast({ title: "Artículo Actualizado", description: "El artículo ha sido actualizado en el catálogo." });
        } else {
            await addArticulo(values);
            toast({ title: "Artículo Creado", description: "El nuevo artículo ha sido añadido al catálogo." });
        }
        router.push("/dashboard/admin/articulos");
    } catch (error: any) {
        toast({
            title: "Error al guardar",
            description: error.message || "No se pudo guardar el artículo.",
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Nombre del Artículo</FormLabel>
                <FormControl>
                    <Input placeholder="Ej: Arroz Blanco" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="categoria"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Categoría</FormLabel>
                <FormControl>
                    <Input placeholder="Ej: Alimentos no perecederos" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="unidad"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Unidad de Medida</FormLabel>
                <FormControl>
                    <Input placeholder="Ej: kg, und, lts" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4"/>}
                {articuloId ? 'Guardar Cambios' : 'Crear Artículo'}
            </Button>
        </form>
    </Form>
  );
}
