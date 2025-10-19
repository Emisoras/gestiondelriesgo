
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
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { addDonacion, updateDonacion } from "@/firebase/donacion-actions";
import { useRouter } from "next/navigation";
import Image from "next/image";

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const formSchema = z.object({
  donante: z.string().min(2, "El nombre del donante es requerido."),
  tipo_persona: z.enum(["natural", "juridica"], { required_error: "Debe seleccionar un tipo de persona." }),
  identificacion: z.string().min(2, "El número de identificación es requerido."),
  email: z.string().email("Debe ser un correo electrónico válido.").optional().or(z.literal("")),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  tipo_donacion: z.enum(["monetaria", "alimentos", "ropa_calzado", "medicamentos", "utiles_aseo", "utiles_cocina", "fresadas", "otro"]),
  otro_tipo_donacion: z.string().optional(),
  descripcion: z.string().min(2, "La descripción es requerida."),
  fotos_donacion: z.array(z.string()).optional(),
  new_fotos_donacion: z.any().optional(),
  observaciones: z.string().optional(),
}).refine(data => {
    if (data.tipo_donacion === "otro") {
        return data.otro_tipo_donacion && data.otro_tipo_donacion.length > 0;
    }
    return true;
}, {
    message: "Por favor, especifique el tipo de donación.",
    path: ["otro_tipo_donacion"],
});

const parseInitialValues = (initialValues: any) => {
    if (!initialValues) {
        return {
            donante: "",
            tipo_persona: "natural",
            identificacion: "",
            email: "",
            telefono: "",
            direccion: "",
            tipo_donacion: "alimentos",
            otro_tipo_donacion: "",
            descripcion: "",
            fotos_donacion: [],
            observaciones: "",
        };
    }
    const parsed = { ...initialValues };
    if (!parsed.fotos_donacion) {
        parsed.fotos_donacion = [];
    }
    return parsed;
};


type DonacionFormProps = {
    donacionId?: string;
    initialValues?: Partial<z.infer<typeof formSchema>>;
};

export function DonacionForm({ donacionId, initialValues }: DonacionFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>(initialValues?.fotos_donacion || []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: parseInitialValues(initialValues),
  });
  
  useEffect(() => {
    const parsed = parseInitialValues(initialValues);
    form.reset(parsed);
    setExistingImages(parsed.fotos_donacion || []);
  }, [initialValues, form]);

  const handleRemoveImage = (imageUrl: string) => {
    setExistingImages(prev => prev.filter(url => url !== imageUrl));
  };

  const tipoDonacion = form.watch("tipo_donacion");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    let uploadedImageUrls: string[] = [...existingImages];

    try {
      const filesToUpload = values.new_fotos_donacion as FileList;
      if (filesToUpload && filesToUpload.length > 0) {
          const base64Promises = Array.from(filesToUpload).map(file => fileToBase64(file));
          const base64Images = await Promise.all(base64Promises);
          uploadedImageUrls.push(...base64Images);
      }

      const dataPayload = {
          ...values,
          fotos_donacion: uploadedImageUrls,
      };
      delete dataPayload.new_fotos_donacion;

        if (donacionId) {
            await updateDonacion(donacionId, dataPayload);
            toast({ title: "Actualización Exitosa", description: "La donación ha sido actualizada." });
            router.push("/dashboard/donaciones/listado");
        } else {
            await addDonacion(dataPayload);
            toast({ title: "Registro Exitoso", description: "La donación ha sido registrada." });
            form.reset();
            setExistingImages([]);
        }
    } catch (error) {
        toast({ title: "Error", description: "No se pudo guardar la donación. Verifique sus permisos.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="donante"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Donante / Organización</FormLabel>
              <FormControl>
                <Input placeholder="Ej: John Alvarez o Empresa XYZ" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="tipo_persona"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Persona</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una opción" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="natural">Natural</SelectItem>
                      <SelectItem value="juridica">Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="identificacion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nro. de Identificación</FormLabel>
                  <FormControl>
                    <Input placeholder="Cédula" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
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
        <FormField
          control={form.control}
          name="tipo_donacion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Donación</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="monetaria">Monetaria</SelectItem>
                  <SelectItem value="alimentos">Alimentos</SelectItem>
                  <SelectItem value="ropa_calzado">Ropa y Calzado</SelectItem>
                  <SelectItem value="medicamentos">Medicamentos</SelectItem>
                  <SelectItem value="utiles_aseo">Útiles de Aseo</SelectItem>
                  <SelectItem value="utiles_cocina">Útiles de Cocina</SelectItem>
                  <SelectItem value="fresadas">Fresadas</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {tipoDonacion === "otro" && (
            <FormField
                control={form.control}
                name="otro_tipo_donacion"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Especifique el tipo de donación</FormLabel>
                        <FormControl>
                            <Input placeholder="Ej: Herramientas, Juguetes, etc." {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        )}
        
        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cantidad y Descripción</FormLabel>
              <FormControl>
                <Textarea placeholder="Ej: $ 500, 100 kg de arroz, 20 cajas de ropa..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-4">
          <FormLabel>Fotos de la Donación</FormLabel>
          {existingImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {existingImages.map((url, index) => (
                <div key={index} className="relative group">
                  <Image src={url} alt="Foto de donación" width={150} height={150} className="rounded-md object-cover w-full h-32" />
                  <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveImage(url)}>
                    <Trash2 className="h-4 w-4"/>
                  </Button>
                </div>
              ))}
            </div>
          )}
          <FormField
            control={form.control}
            name="new_fotos_donacion"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <Camera className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input type="file" multiple className="pl-10" onChange={(e) => field.onChange(e.target.files)} />
                  </div>
                </FormControl>
                <FormDescription>
                  Puede adjuntar fotos para registrar los artículos donados.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

         <FormField
          control={form.control}
          name="observaciones"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observaciones</FormLabel>
              <FormControl>
                <Textarea placeholder="Observaciones adicionales sobre la donación" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90">
            {isSubmitting ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {donacionId ? "Actualizando..." : "Registrando..."}
                </>
            ) : (
                donacionId ? "Actualizar Donación" : "Registrar Donación"
            )}
        </Button>
      </form>
    </Form>
  );
}

    