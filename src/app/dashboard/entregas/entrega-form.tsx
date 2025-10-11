
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
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { useCollection } from "@/firebase";
import { addEntrega, updateEntrega } from "@/firebase/entrega-actions";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Damnificado = {
  id: string;
  nombre: string;
  apellido: string;
  cedula: string;
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const formSchema = z.object({
  receptorId: z.string({ required_error: "Debe seleccionar un receptor." }),
  descripcion_entrega: z.string().min(5, "La descripción de la entrega es requerida."),
  fotos_entrega: z.array(z.string()).optional(),
  new_fotos_entrega: z.any().optional(),
  responsable: z.string().min(2, "El nombre del responsable es requerido."),
});

const parseInitialValues = (initialValues: any) => {
    if (!initialValues) {
        return { 
            receptorId: "",
            descripcion_entrega: "",
            responsable: "",
            fotos_entrega: [] 
        };
    }
    const parsed = { ...initialValues };
    if (!parsed.fotos_entrega) {
        parsed.fotos_entrega = [];
    }
    return parsed;
};

type EntregaFormProps = {
    entregaId?: string;
    initialValues?: Partial<z.infer<typeof formSchema>>;
};

export function EntregaForm({ entregaId, initialValues }: EntregaFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { data: damnificados, loading: loadingDamnificados } = useCollection<Damnificado>('damnificados');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>(initialValues?.fotos_entrega || []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: parseInitialValues(initialValues) || {
      receptorId: "",
      descripcion_entrega: "",
      responsable: "",
      fotos_entrega: [],
    },
  });

  useEffect(() => {
    const parsed = parseInitialValues(initialValues);
    form.reset(parsed);
    setExistingImages(parsed.fotos_entrega || []);
  }, [initialValues, form]);
  
  const handleRemoveImage = (imageUrl: string) => {
    setExistingImages(prev => prev.filter(url => url !== imageUrl));
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    
    const receptorSeleccionado = damnificados?.find(d => d.id === values.receptorId);
    if (!receptorSeleccionado) {
        toast({ title: "Error", description: "Receptor no válido.", variant: "destructive" });
        return;
    }
    
    setIsSubmitting(true);
    let uploadedImageUrls: string[] = [...existingImages];
    
    try {
        const filesToUpload = values.new_fotos_entrega as FileList;
        if (filesToUpload && filesToUpload.length > 0) {
            const base64Promises = Array.from(filesToUpload).map(file => fileToBase64(file));
            const base64Images = await Promise.all(base64Promises);
            uploadedImageUrls.push(...base64Images);
        }

        const dataPayload = {
            ...values,
            receptorNombre: `${receptorSeleccionado.nombre} ${receptorSeleccionado.apellido}`,
            fotos_entrega: uploadedImageUrls,
        };
        delete dataPayload.new_fotos_entrega;

        if (entregaId) {
            await updateEntrega(entregaId, dataPayload);
            toast({ title: "Actualización Exitosa", description: "La entrega ha sido actualizada." });
            router.push('/dashboard/entregas/listado');
        } else {
            await addEntrega(dataPayload);
            toast({ title: "Registro Exitoso", description: "La entrega ha sido registrada." });
            form.reset();
            setExistingImages([]);
        }
    } catch(error) {
        toast({ title: "Error", description: "No se pudo registrar la entrega. Verifique sus permisos.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="receptorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Receptor / Familia / Albergue</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={loadingDamnificados}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingDamnificados ? "Cargando receptores..." : "Seleccione un damnificado o albergue"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {!loadingDamnificados && damnificados?.map(damnificado => (
                    <SelectItem key={damnificado.id} value={damnificado.id}>
                      {`${damnificado.nombre} ${damnificado.apellido}`} ({damnificado.cedula})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="descripcion_entrega"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Artículos Entregados y Cantidad</FormLabel>
              <FormControl>
                <Textarea placeholder="Ej: 2 kits de alimentos, 5 cobijas, 10L de agua" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
            <FormLabel>Fotos de la Entrega</FormLabel>
            {existingImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {existingImages.map((url, index) => (
                        <div key={index} className="relative group">
                            <Image src={url} alt="Foto de entrega" width={150} height={150} className="rounded-md object-cover w-full h-32" />
                            <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveImage(url)}>
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        </div>
                    ))}
                </div>
            )}
            <FormField
                control={form.control}
                name="new_fotos_entrega"
                render={({ field }) => (
                    <FormItem>
                        <FormControl>
                            <div className="relative">
                                <Camera className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input type="file" multiple className="pl-10" onChange={(e) => field.onChange(e.target.files)} />
                            </div>
                        </FormControl>
                        <FormDescription>
                            Puede adjuntar fotos como constancia de la entrega.
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <FormField
          control={form.control}
          name="responsable"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Responsable de la Entrega (Miembro CMGRD)</FormLabel>
              <FormControl>
                <Input placeholder="Nombre del miembro del equipo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90">
            {isSubmitting ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {entregaId ? "Actualizando..." : "Registrando..."}
                </>
            ) : (
                entregaId ? "Actualizar Entrega" : "Registrar Entrega"
            )}
        </Button>
      </form>
    </Form>
  );
}
