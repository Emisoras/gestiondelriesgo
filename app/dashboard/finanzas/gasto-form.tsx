
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase";
import { useEffect, useState } from "react";
import { Loader2, Save, CalendarIcon, DollarSign } from "lucide-react";
import { addGasto, updateGasto } from "@/firebase/gasto-actions";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const formSchema = z.object({
  fecha: z.date({ required_error: "La fecha es requerida." }),
  monto: z.coerce.number().positive("El monto debe ser un número positivo."),
  descripcion: z.string().min(5, "La descripción es requerida."),
  categoria: z.string().optional(),
  responsable: z.string().min(2, "El responsable es requerido."),
});

type GastoFormProps = {
  gastoId?: string;
  initialValues?: Partial<z.infer<typeof formSchema>> | null;
  onFinished: () => void;
};

export function GastoForm({ gastoId, initialValues, onFinished }: GastoFormProps) {
  const { toast } = useToast();
  const { userProfile } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const getDefaultValues = () => {
    if (initialValues) {
        return {
            ...initialValues,
            fecha: initialValues.fecha ? (initialValues.fecha as any).seconds ? new Date((initialValues.fecha as any).seconds * 1000) : new Date(initialValues.fecha) : new Date(),
        };
    }
    return {
        fecha: new Date(),
        monto: 0,
        descripcion: "",
        categoria: "",
        responsable: userProfile?.displayName || "",
    }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });

  useEffect(() => {
    form.reset(getDefaultValues());
  }, [initialValues, userProfile]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      if (gastoId) {
        await updateGasto(gastoId, values);
        toast({ title: "Gasto Actualizado", description: "El registro del gasto ha sido actualizado." });
      } else {
        await addGasto(values);
        toast({ title: "Gasto Registrado", description: "Se ha registrado un nuevo gasto." });
      }
      onFinished();
    } catch (error: any) {
      toast({
        title: "Error al guardar",
        description: error.message || "No se pudo guardar el gasto.",
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
          name="fecha"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Fecha del Gasto</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                    >
                      {field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccione una fecha</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={es} />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="monto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monto</FormLabel>
              <FormControl>
                <div className="relative">
                    <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="number" placeholder="0.00" className="pl-8" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea placeholder="Ej: Compra de 50 kits de aseo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="responsable"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Responsable</FormLabel>
              <FormControl>
                <Input {...field} readOnly disabled />
              </FormControl>
              <FormDescription>Este campo se llena automáticamente con el usuario actual.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {gastoId ? 'Guardar Cambios' : 'Registrar Gasto'}
        </Button>
      </form>
    </Form>
  );
}
