
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
import { useEffect, useState, useMemo } from "react";
import { Camera, Loader2, Trash2, Fingerprint, PenSquare, UploadCloud, CalendarIcon } from "lucide-react";
import { useCollection } from "@/firebase";
import { addEntrega, updateEntrega } from "@/firebase/entrega-actions";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { SignaturePad } from "./signature-pad";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";


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
  fecha_entrega: z.date({ required_error: "La fecha de entrega es requerida." }),
  descripcion_entrega: z.string().min(5, "La descripción de la entrega es requerida."),
  fotos_entrega: z.array(z.string()).optional(),
  new_fotos_entrega: z.any().optional(),
  responsable: z.string().min(2, "El nombre del responsable es requerido."),
  firmaReceptor: z.string().optional(),
  huellaReceptor: z.string().optional(),
  new_huellaReceptor: z.any().optional(),
});

const parseInitialValues = (initialValues: any) => {
    if (!initialValues) {
        return { 
            receptorId: "",
            fecha_entrega: undefined, // Set to undefined to avoid hydration error
            descripcion_entrega: "",
            responsable: "",
            fotos_entrega: [],
            firmaReceptor: "",
            huellaReceptor: "",
        };
    }
    const parsed = { ...initialValues };
    if (parsed.fecha_entrega && parsed.fecha_entrega.seconds) {
        parsed.fecha_entrega = new Date(parsed.fecha_entrega.seconds * 1000);
    } else if (typeof parsed.fecha_entrega === 'string') {
        parsed.fecha_entrega = new Date(parsed.fecha_entrega);
    }

    if (!parsed.fotos_entrega) parsed.fotos_entrega = [];
    if (!parsed.firmaReceptor) parsed.firmaReceptor = "";
    if (!parsed.huellaReceptor) parsed.huellaReceptor = "";
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
  const [existingHuella, setExistingHuella] = useState<string | null>(initialValues?.huellaReceptor || null);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: useMemo(() => parseInitialValues(initialValues), [initialValues]),
  });

  useEffect(() => {
    if (!initialValues) {
        form.setValue("fecha_entrega", new Date());
    }
  }, [initialValues, form]);
  
  useEffect(() => {
    const parsed = parseInitialValues(initialValues);
    form.reset(parsed);
    setExistingImages(parsed.fotos_entrega || []);
    setExistingHuella(parsed.huellaReceptor || null);
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
    let uploadedHuellaUrl: string | undefined = values.huellaReceptor;
    
    try {
        // Handle delivery photos
        const filesToUpload = values.new_fotos_entrega as FileList;
        if (filesToUpload && filesToUpload.length > 0) {
            const base64Promises = Array.from(filesToUpload).map(file => fileToBase64(file));
            const base64Images = await Promise.all(base64Promises);
            uploadedImageUrls.push(...base64Images);
        }
        
        // Handle fingerprint image
        const huellaFile = values.new_huellaReceptor?.[0] as File;
        if (huellaFile) {
            uploadedHuellaUrl = await fileToBase64(huellaFile);
        }

        const dataPayload = {
            ...values,
            receptorNombre: `${receptorSeleccionado.nombre} ${receptorSeleccionado.apellido}`,
            fotos_entrega: uploadedImageUrls,
            huellaReceptor: uploadedHuellaUrl,
        };
        delete dataPayload.new_fotos_entrega;
        delete dataPayload.new_huellaReceptor;

        if (entregaId) {
            await updateEntrega(entregaId, dataPayload);
            toast({ title: "Actualización Exitosa", description: "La entrega ha sido actualizada." });
            router.push('/dashboard/entregas/listado');
        } else {
            await addEntrega(dataPayload);
            toast({ title: "Registro Exitoso", description: "La entrega ha sido registrada." });
            form.reset(parseInitialValues(null));
            form.setValue("fecha_entrega", new Date()); // Reset date for new entry on client
            setExistingImages([]);
            setExistingHuella(null);
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
        <div className="grid md:grid-cols-2 gap-4">
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
                name="fecha_entrega"
                render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Fecha de Entrega</FormLabel>
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
                        selected={field.value}
                        onSelect={field.onChange}
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
          name="firmaReceptor"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2"><PenSquare className="h-5 w-5"/> Firma del Receptor</FormLabel>
              <FormControl>
                <SignaturePad onSave={field.onChange} initialSignature={field.value} />
              </FormControl>
               <FormDescription>
                La persona que recibe la ayuda puede firmar en el panel o puede subir una imagen de su firma.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-4">
            <FormLabel className="flex items-center gap-2"><Fingerprint className="h-5 w-5"/> Huella del Receptor (Opcional)</FormLabel>
            {existingHuella && (
                <div className="relative w-40 h-40 group">
                    <Image src={existingHuella} alt="Huella" layout="fill" objectFit="contain" className="rounded-md border p-2"/>
                    <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setExistingHuella(null)}>
                        <Trash2 className="h-4 w-4"/>
                    </Button>
                </div>
            )}
            <FormField
                control={form.control}
                name="new_huellaReceptor"
                render={({ field }) => (
                    <FormItem>
                        <FormControl>
                            <div className="relative">
                                <UploadCloud className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input type="file" accept="image/*" className="pl-10" onChange={(e) => field.onChange(e.target.files)} />
                            </div>
                        </FormControl>
                         <FormDescription>
                            Si dispone de un lector de huellas, puede subir la imagen aquí.
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
