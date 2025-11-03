
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect }from "react";
import { addVoluntario, updateVoluntario } from "@/firebase/voluntario-actions";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";


const skills = [
  { id: "medica", label: "Asistencia Médica" },
  { id: "logistica", label: "Logística y Distribución" },
  { id: "psicologico", label: "Apoyo PsicoSocial y Comunitario" },
  { id: "infraestructura", label: "Ingeniería / Infraestructura" },
  { id: "educacion", label: "Educación y Recreación" },
  { id: "religioso", label: "Apoyo Religioso" },
  { id: "manipulacion_alimentos", label: "Manipulación de Alimentos" },
  { id: "comunicaciones", label: "Comunicaciones" },
  { id: "saneamiento_basico", label: "Saneamiento Básico" },
  { id: "seguridad", label: "Seguridad" },
  { id: "alojamiento", label: "Suministro Alojamiento" },
  { id: "transporte", label: "Transporte" },
  { id: "adecuaciones_locativas", label: "Adecuaciones Locativas" },
  { id: "apoyo_administrativo", label: "Apoyo Administrativo" },
];

const formSchema = z.object({
  autorizacion_datos: z.boolean().refine(val => val === true, {
    message: "Debe aceptar la autorización de datos para continuar.",
  }),
  nombre: z.string().min(2, "El nombre es requerido."),
  apellido: z.string().min(2, "El apellido es requerido."),
  documento_identidad: z.string().optional(),
  edad: z.coerce.number().positive("La edad debe ser un número positivo.").optional().or(z.literal("")),
  direccion: z.string().optional(),
  barrio: z.string().optional(),
  perfil_profesional: z.string().optional(),
  organizacion: z.string().optional(),
  email: z.string().email("Debe ser un correo electrónico válido."),
  telefono: z.string().min(7, "El teléfono es requerido."),
  habilidades: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "Debe seleccionar al menos una habilidad.",
  }),
});

const defaultValues = {
  autorizacion_datos: true, // Assume true for editing
  nombre: "",
  apellido: "",
  documento_identidad: "",
  email: "",
  telefono: "",
  habilidades: [],
  edad: "",
  direccion: "",
  barrio: "",
  perfil_profesional: "",
  organizacion: "",
};


type VoluntarioFormProps = {
    voluntarioId?: string;
    initialValues?: Partial<z.infer<typeof formSchema>>;
};


export function VoluntarioForm({ voluntarioId, initialValues }: VoluntarioFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues ? { ...defaultValues, ...initialValues, autorizacion_datos: true } : { ...defaultValues, autorizacion_datos: false},
  });

  useEffect(() => {
    if (initialValues) {
        form.reset({ ...defaultValues, ...initialValues, autorizacion_datos: true });
    }
  }, [initialValues, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    try {
        if (voluntarioId) {
            await updateVoluntario(voluntarioId, values);
            toast({
                title: "¡Actualización Exitosa!",
                description: `Los datos de ${values.nombre} han sido actualizados.`,
            });
            router.push("/dashboard/voluntarios/listado");
        } else {
            await addVoluntario(values);
            toast({
                title: "¡Gracias por unirte!",
                description: `${values.nombre}, hemos recibido tu registro.`,
                className: "bg-accent text-accent-foreground",
            });
            form.reset({ ...defaultValues, autorizacion_datos: false });
        }
    } catch (error) {
       toast({
        title: "Error inesperado",
        description: "Ocurrió un error al intentar guardar el registro. Verifique los permisos.",
        variant: "destructive"
      });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        <FormField
          control={form.control}
          name="autorizacion_datos"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={!!voluntarioId}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Autorización de Datos Personales
                </FormLabel>
                <FormDescription>
                  Autorizo el tratamiento de mis datos personales de acuerdo con la Ley 1581 de 2012 y las políticas de privacidad de la organización.
                </FormDescription>
                 <FormMessage />
              </div>
            </FormItem>
          )}
        />
        
        <div className="space-y-4">
            <h3 className="text-lg font-medium font-headline">Información Personal</h3>
            <div className="grid md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                        <Input placeholder="Juan" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="apellido"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                        <Input placeholder="Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="documento_identidad"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Documento de Identidad</FormLabel>
                        <FormControl>
                            <Input placeholder="123456789" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                 <FormField
                  control={form.control}
                  name="edad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Edad</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="30" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            <FormField
              control={form.control}
              name="perfil_profesional"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Perfil Profesional</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Médico, Ingeniero, Estudiante" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="direccion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input placeholder="Calle Principal, Casa #456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="barrio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barrio/Vereda</FormLabel>
                      <FormControl>
                        <Input placeholder="Sector Central" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="organizacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organización a la que pertenece</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: ONG, Junta Comunal, etc." {...field} />
                      </FormControl>
                       <FormDescription>Si no pertenece a ninguna, deje el campo vacío.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
             <div className="grid md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                        <Input type="email" placeholder="juan.smith@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="telefono"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                        <Input placeholder="315-9876543" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
        </div>

        <FormField
            control={form.control}
            name="habilidades"
            render={() => (
                <FormItem>
                <div className="mb-4">
                    <FormLabel className="text-lg font-medium font-headline">Habilidades y Áreas de Apoyo</FormLabel>
                    <FormDescription>
                    Selecciona las áreas en las que puedes y quieres colaborar.
                    </FormDescription>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    {skills.map((item) => (
                    <FormField
                        key={item.id}
                        control={form.control}
                        name="habilidades"
                        render={({ field }) => {
                        return (
                            <FormItem
                            key={item.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                            >
                            <FormControl>
                                <Checkbox
                                checked={field.value?.includes(item.id)}
                                onCheckedChange={(checked) => {
                                    return checked
                                    ? field.onChange([...(field.value || []), item.id])
                                    : field.onChange(
                                        (field.value || [])?.filter(
                                            (value) => value !== item.id
                                        )
                                        );
                                }}
                                />
                            </FormControl>
                            <FormLabel className="font-normal">
                                {item.label}
                            </FormLabel>
                            </FormItem>
                        );
                        }}
                    />
                    ))}
                </div>
                <FormMessage />
                </FormItem>
            )}
        />
        
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {voluntarioId ? 'Actualizar Voluntario' : 'Registrarme como Voluntario'}
        </Button>
      </form>
    </Form>
  );
}
