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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { UtensilsCrossed, Droplets, Home, Stethoscope, Shirt, CalendarIcon, Wrench, Camera, Trash2, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useEffect, useState } from "react";
import { addDamnificado, updateDamnificado } from "@/firebase/damnificado-actions";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";

const needsItems = [
  { id: "alimentos", label: "Alimentos", icon: UtensilsCrossed },
  { id: "agua", label: "Agua Potable", icon: Droplets },
  { id: "refugio", label: "Refugio Temporal", icon: Home },
  { id: "atencion_medica", label: "Atención Médica", icon: Stethoscope },
  { id: "ropa", label: "Ropa y Abrigo", icon: Shirt },
  { id: "reconstruccion", label: "Ayuda para Reconstrucción", icon: Wrench },
] as const;

const formSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  apellido: z.string().min(2, "El apellido debe tener al menos 2 caracteres."),
  cedula: z.string().optional(),
  fecha_nacimiento: z.date().optional(),
  email: z.string().email("Debe ser un correo electrónico válido.").optional().or(z.literal("")),
  telefono: z.string().optional(),
  direccion: z.string().min(5, "La dirección es requerida."),
  barrio: z.string().optional(),
  coordenadas: z.string().optional(),
  ciudad: z.string().min(2, "La ciudad es requerida."),
  estado: z.string().min(2, "El estado es requerido."),
  miembros_familia: z.string().optional(),
  tipo_vivienda: z.enum(["propia", "alquilada", "familiar", "otro"]),
  condiciones_vivienda: z.enum(["leve", "moderado", "grave", "perdida_total"]),
  danos_vivienda: z.string().optional(),
  fotos_danos: z.array(z.string()).optional(),
  new_fotos_danos: z.any().optional(),
  necesidades: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "Debe seleccionar al menos una necesidad.",
  }),
});

// We need to convert Firestore Timestamps to JS Dates for the form
const parseInitialValues = (initialValues: any) => {
    if (!initialValues) {
        return {
            nombre: "",
            apellido: "",
            cedula: "",
            email: "",
            telefono: "",
            direccion: "",
            barrio: "",
            coordenadas: "",
            ciudad: "",
            estado: "",
            miembros_familia: "",
            tipo_vivienda: "propia",
            condiciones_vivienda: "leve",
            danos_vivienda: "",
            necesidades: [],
            fotos_danos: [],
        };
    }
    const parsed = { ...initialValues };
    if (parsed.fecha_nacimiento && parsed.fecha_nacimiento.seconds) {
        parsed.fecha_nacimiento = new Date(parsed.fecha_nacimiento.seconds * 1000);
    }
    if (!parsed.fotos_danos) {
        parsed.fotos_danos = [];
    }
    return parsed;
};

// Helper function to convert a file to a Base64 string
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};


type DamnificadoFormProps = {
    damnificadoId?: string;
    initialValues?: Partial<z.infer<typeof formSchema>>;
};

export function DamnificadoForm({ damnificadoId, initialValues }: DamnificadoFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>(initialValues?.fotos_danos || []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: parseInitialValues(initialValues),
  });

  useEffect(() => {
    const parsed = parseInitialValues(initialValues);
    form.reset(parsed);
    setExistingImages(parsed.fotos_danos || []);
  }, [initialValues, form]);
  
  const handleRemoveImage = (imageUrl: string) => {
    setExistingImages(prev => prev.filter(url => url !== imageUrl));
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    let uploadedImageUrls: string[] = [...existingImages];

    try {
        const filesToUpload = values.new_fotos_danos as FileList;
        if (filesToUpload && filesToUpload.length > 0) {
            const base64Promises = Array.from(filesToUpload).map(file => fileToBase64(file));
            const base64Images = await Promise.all(base64Promises);
            uploadedImageUrls.push(...base64Images);
        }

        const dataPayload = {
            ...values,
            fotos_danos: uploadedImageUrls,
        };
        delete dataPayload.new_fotos_danos; // IMPORTANT: Remove FileList before sending to Firestore

        if (damnificadoId) {
            await updateDamnificado(damnificadoId, dataPayload);
            toast({
            title: "Actualización Exitosa",
            description: "Se ha actualizado el registro del damnificado.",
            });
            router.push("/dashboard/damnificados/listado");
        } else {
            await addDamnificado(dataPayload);
            toast({
            title: "Registro Exitoso",
            description: "Se ha registrado al damnificado correctamente.",
            className: "bg-accent text-accent-foreground",
            });
            form.reset();
            setExistingImages([]);
        }

    } catch (error) {
       toast({
        title: "Error al guardar",
        description: (error as Error).message || "No se pudo guardar el registro.",
        variant: "destructive"
      });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Accordion type="multiple" defaultValue={["item-1", "item-2", "item-3"]} className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="font-headline">Información Personal</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
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
                        <Input placeholder="Alvarez" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cedula"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cédula de Identidad</FormLabel>
                      <FormControl>
                        <Input placeholder="12.345.678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fecha_nacimiento"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de Nacimiento</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: es })
                              ) : (
                                <span>Seleccione una fecha</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            captionLayout="dropdown-buttons"
                            fromYear={1900}
                            toYear={new Date().getFullYear()}
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                            locale={es}
                          />
                        </PopoverContent>
                      </Popover>
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
                        <Input type="email" placeholder="john.alvarez@email.com" {...field} />
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
                        <Input placeholder="315-1234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="item-2">
            <AccordionTrigger className="font-headline">Ubicación y Vivienda</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
               <FormField
                control={form.control}
                name="direccion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input placeholder="Calle Principal, Casa #123" {...field} />
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
                        <Input placeholder="Sector La Esperanza" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="coordenadas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coordenadas GPS</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 10.480, -66.903" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ciudad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad</FormLabel>
                      <FormControl>
                        <Input placeholder="Ocaña" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Norte de Santander</FormLabel>
                      <FormControl>
                        <Input placeholder="Norte de Santander" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="tipo_vivienda"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Vivienda</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="propia">Propia</SelectItem>
                          <SelectItem value="alquilada">Alquilada</SelectItem>
                          <SelectItem value="familiar">Familiar</SelectItem>
                          <SelectItem value="otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="condiciones_vivienda"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condiciones de la vivienda</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione una condición" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="leve">Leve</SelectItem>
                          <SelectItem value="moderado">Moderado</SelectItem>
                          <SelectItem value="grave">Grave</SelectItem>
                          <SelectItem value="perdida_total">Pérdida total</SelectItem>
                        </SelectContent>
                      </Select>
                       <FormDescription>
                        Tipo de daño (leve, moderado, grave, pérdida total)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </div>
                <FormField
                  control={form.control}
                  name="danos_vivienda"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción de Daños en Vivienda</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Ej: Techo dañado, pérdida de enseres..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="space-y-4">
                    <FormLabel>Fotos de los Daños</FormLabel>
                    {existingImages.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {existingImages.map((url, index) => (
                                <div key={index} className="relative group">
                                    <Image src={url} alt="Daño de vivienda" width={150} height={150} className="rounded-md object-cover w-full h-32" />
                                    <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveImage(url)}>
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                     <FormField
                        control={form.control}
                        name="new_fotos_danos"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <div className="relative">
                                        <Camera className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <Input type="file" multiple className="pl-10" onChange={(e) => field.onChange(e.target.files)} />
                                    </div>
                                </FormControl>
                                <FormDescription>
                                    Puede seleccionar múltiples imágenes para adjuntar. Las nuevas imágenes se añadirán a las existentes.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger className="font-headline">Grupo Familiar y Necesidades</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <FormField
                  control={form.control}
                  name="miembros_familia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Miembros del Grupo Familiar</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Ej: Esposa, 2 hijos menores. Indicar edades si es posible." {...field} />
                      </FormControl>
                      <FormDescription>
                        Liste las personas que viven con usted y fueron afectadas.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <FormField
                control={form.control}
                name="necesidades"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Necesidades Urgentes</FormLabel>
                      <FormDescription>
                        Seleccione todas las que apliquen.
                      </FormDescription>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {needsItems.map((item) => (
                        <FormField
                          key={item.id}
                          control={form.control}
                          name="necesidades"
                          render={({ field }) => {
                            const Icon = item.icon;
                            return (
                              <FormItem
                                key={item.id}
                                className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 has-[:checked]:bg-secondary"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), item.id])
                                        : field.onChange(
                                            (field.value || []).filter(
                                              (value) => value !== item.id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal flex items-center gap-2">
                                  <Icon className="h-5 w-5 text-muted-foreground" /> {item.label}
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
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? (damnificadoId ? "Actualizando..." : "Registrando...") : (damnificadoId ? "Actualizar Registro" : "Registrar Damnificado")}
        </Button>
      </form>
    </Form>
  );
}
