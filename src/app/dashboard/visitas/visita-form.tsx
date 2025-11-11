
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
import { Camera, Loader2, Trash2, PenSquare, CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { useCollection, useUser } from "@/firebase";
import { addVisita, updateVisita, getNextActaNumber } from "@/firebase/visita-actions";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { SignaturePad } from "@/app/dashboard/entregas/signature-pad";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { exportVisitaToPDF } from "@/lib/pdf-generator-visita";
import type { UserProfile } from "@/firebase/auth/use-user";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";


const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
};

const eventItems = [
    { id: "afectacion_estructural", label: "Afectación Estructural" },
    { id: "perdida_banca", label: "Pérdida de Banca" },
    { id: "deslizamiento", label: "Deslizamiento" },
    { id: "explosion", label: "Explosión" },
    { id: "incendio_estructural", label: "Incendio Estructural" },
    { id: "incendio_forestal", label: "Incendio Forestal" },
    { id: "incendio_vehicular", label: "Incendio Vehicular" },
    { id: "inundacion", label: "Inundación" },
    { id: "inspeccion_arborea", label: "Inspección Arbórea" },
    { id: "accidente_transito", label: "Accidente de Tránsito" },
    { id: "derrame_combustible", label: "Derrame de Combustible" },
    { id: "vendaval", label: "Vendaval" },
    { id: "granizada", label: "Granizada" },
    { id: "sismo", label: "Sismo" },
    { id: "otro", label: "Otro" },
] as const;

const formSchema = z.object({
    actaNumero: z.string().optional(),
    damnificadoId: z.string({ required_error: "Debe seleccionar un damnificado." }),
    nombreDamnificado: z.string().min(1, "El nombre es requerido."),
    apellidoDamnificado: z.string().min(1, "El apellido es requerido."),
    cedulaDamnificado: z.string().optional(),
    telefonoDamnificado: z.string().optional(),
    direccion: z.string().min(1, "La dirección es requerida."),
    barrio: z.string().optional(),
    ubicacionTipo: z.enum(["urbano", "rural"]).optional(),
    tipoEscenario: z.string().optional(),
    condicionVivienda: z.string().optional(),
    fichaEdan: z.enum(["si", "no", "na"]).optional(),
    tipoEvento: z.array(z.string()).refine(value => value.length > 0, "Debe seleccionar al menos un tipo de evento."),
    otro_tipo_evento: z.string().optional(),
    descripcionRequerimiento: z.string().min(10, "La descripción es requerida."),
    profesionalAsignado: z.string(),
    fechaVisita: z.date({ required_error: "La fecha de visita es requerida." }),
    registroFotografico: z.array(z.string()).optional(),
    new_fotos: z.any().optional(),
    firmaProfesional: z.string().optional(),
}).refine(data => {
    if (data.tipoEvento.includes("otro")) {
        return data.otro_tipo_evento && data.otro_tipo_evento.length > 0;
    }
    return true;
}, {
    message: "Por favor, especifique el otro tipo de evento.",
    path: ["otro_tipo_evento"],
});

export type VisitaTecnica = z.infer<typeof formSchema> & { id?: string };

type DamnificadoSnapshot = {
  id: string;
  nombre: string;
  apellido: string;
  cedula?: string;
  telefono?: string;
  direccion?: string;
  barrio?: string;
  condiciones_vivienda?: string;
};


type VisitaFormProps = {
    visitaId?: string;
    initialValues?: Partial<VisitaTecnica>;
};

export function VisitaForm({ visitaId, initialValues }: VisitaFormProps) {
    const { toast } = useToast();
    const router = useRouter();
    const { userProfile } = useUser();
    const { data: damnificados, loading: loadingDamnificados } = useCollection<DamnificadoSnapshot>('damnificados');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingImages, setExistingImages] = useState<string[]>(initialValues?.registroFotografico || []);
    const [nextActa, setNextActa] = useState<string | null>(visitaId ? initialValues?.actaNumero || null : null);
    const [loadingActa, setLoadingActa] = useState(!visitaId);
    
    useEffect(() => {
        if (!visitaId) {
            setLoadingActa(true);
            getNextActaNumber()
                .then(setNextActa)
                .catch(() => toast({ title: "Error", description: "No se pudo obtener el número de acta.", variant: "destructive" }))
                .finally(() => setLoadingActa(false));
        }
    }, [visitaId, toast]);

    const parsedInitialValues = useMemo(() => {
        const defaults = {
            actaNumero: initialValues?.actaNumero || "",
            damnificadoId: "",
            nombreDamnificado: "",
            apellidoDamnificado: "",
            cedulaDamnificado: "",
            telefonoDamnificado: "",
            direccion: "",
            barrio: "",
            condicionVivienda: "",
            tipoEvento: [],
            descripcionRequerimiento: "",
            profesionalAsignado: userProfile?.displayName || "",
            fechaVisita: new Date(), 
            registroFotografico: [],
            firmaProfesional: "",
        };

        if (!initialValues) {
            return defaults;
        }

        const parsed = { ...initialValues };
        if (parsed.fechaVisita && (parsed.fechaVisita as any).seconds) {
            parsed.fechaVisita = new Date((parsed.fechaVisita as any).seconds * 1000);
        } else if (typeof parsed.fechaVisita === 'string') {
             parsed.fechaVisita = new Date(parsed.fechaVisita);
        }

        return { ...defaults, ...parsed };
    }, [initialValues, userProfile]);


    const form = useForm<VisitaTecnica>({
        resolver: zodResolver(formSchema),
        defaultValues: parsedInitialValues,
    });
    
    useEffect(() => {
        form.reset(parsedInitialValues);
        setExistingImages(parsedInitialValues.registroFotografico || []);
    }, [parsedInitialValues, form]);

    const damnificadoId = form.watch("damnificadoId");
    
    useEffect(() => {
        if (damnificadoId) {
            const selected = damnificados?.find(d => d.id === damnificadoId);
            if (selected) {
                form.setValue("nombreDamnificado", selected.nombre || "");
                form.setValue("apellidoDamnificado", selected.apellido || "");
                form.setValue("cedulaDamnificado", selected.cedula || "");
                form.setValue("telefonoDamnificado", selected.telefono || "");
                form.setValue("direccion", selected.direccion || "");
                form.setValue("barrio", selected.barrio || "");
                form.setValue("condicionVivienda", selected.condiciones_vivienda || "");
            }
        }
    }, [damnificadoId, damnificados, form]);

    const tipoEvento = form.watch("tipoEvento");

    const handleRemoveImage = (imageUrl: string) => {
        setExistingImages(prev => prev.filter(url => url !== imageUrl));
    };

    async function onSubmit(values: VisitaTecnica) {
        if (!userProfile) {
            toast({ title: "Error", description: "Debe iniciar sesión para registrar una visita.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        let uploadedImageUrls: string[] = [...existingImages];
        
        try {
            const filesToUpload = values.new_fotos as FileList;
            if (filesToUpload && filesToUpload.length > 0) {
                const base64Promises = Array.from(filesToUpload).map(file => fileToBase64(file));
                const base64Images = await Promise.all(base64Promises);
                uploadedImageUrls.push(...base64Images);
            }
            
            const finalActaNumero = visitaId ? values.actaNumero : nextActa;
            if (!finalActaNumero) {
                throw new Error("El número de acta no está disponible.");
            }

            const dataPayload: Omit<VisitaTecnica, 'actaNumero'> & { actaNumero?: string } = {
                ...values,
                actaNumero: finalActaNumero,
                registroFotografico: uploadedImageUrls,
                profesionalAsignado: userProfile.displayName || "No identificado",
            };
            delete dataPayload.new_fotos;
            
            if (visitaId) {
                await updateVisita(visitaId, dataPayload);
                toast({ title: "Actualización Exitosa", description: "El acta de visita ha sido actualizada." });
                const finalData = { ...dataPayload, id: visitaId, actaNumero: dataPayload.actaNumero || ''};
                await exportVisitaToPDF(finalData, userProfile);
                router.push('/dashboard/visitas/listado');
            } else {
                const { id: newVisitaId } = await addVisita(dataPayload);
                toast({ title: "Registro Exitoso", description: `El acta ${finalActaNumero} ha sido guardada.` });
                
                const finalData = { ...dataPayload, id: newVisitaId, actaNumero: finalActaNumero };
                await exportVisitaToPDF(finalData, userProfile);
                
                // Reset form and refetch acta number for new entry
                form.reset({
                    ...parsedInitialValues,
                    damnificadoId: "", nombreDamnificado: "", apellidoDamnificado: "", cedulaDamnificado: "",
                    telefonoDamnificado: "", direccion: "", barrio: "", condicionVivienda: "", tipoEvento: [],
                    descripcionRequerimiento: "", registroFotografico: [], new_fotos: undefined, firmaProfesional: "",
                    otro_tipo_evento: "", profesionalAsignado: userProfile?.displayName || "", fechaVisita: new Date(),
                });
                setExistingImages([]);
                setLoadingActa(true);
                getNextActaNumber().then(setNextActa).finally(() => setLoadingActa(false));
            }
        } catch(error: any) {
            toast({ title: "Error", description: error.message || "No se pudo registrar la visita. Verifique sus permisos.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        <div className="flex justify-between items-center bg-muted p-3 rounded-lg">
            <h3 className="font-bold text-lg">Número de Acta</h3>
            <span className="font-mono text-primary font-semibold">
                {loadingActa ? <Loader2 className="h-4 w-4 animate-spin" /> : (nextActa || "No disponible")}
            </span>
        </div>

        <Accordion type="multiple" defaultValue={["item-1", "item-2", "item-3", "item-4"]} className="w-full">
            
          {/* INFORMACIÓN PERSONAL */}
          <AccordionItem value="item-1">
            <AccordionTrigger className="font-headline">Información Personal del Solicitante</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
                 <FormField
                    control={form.control}
                    name="damnificadoId"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Buscar Damnificado</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                    "w-full justify-between",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value
                                    ? damnificados?.find(
                                        (d) => d.id === field.value
                                    )?.nombre + ' ' + damnificados?.find(
                                        (d) => d.id === field.value
                                    )?.apellido
                                    : "Seleccione un damnificado"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0">
                            <Command>
                                <CommandInput placeholder="Buscar por nombre, apellido o cédula..." />
                                <CommandEmpty>No se encontraron damnificados.</CommandEmpty>
                                <CommandGroup>
                                {damnificados?.map((d) => (
                                    <CommandItem
                                    value={`${d.nombre} ${d.apellido} ${d.cedula}`}
                                    key={d.id}
                                    onSelect={() => {
                                        form.setValue("damnificadoId", d.id)
                                    }}
                                    >
                                    <Check
                                        className={cn(
                                        "mr-2 h-4 w-4",
                                        d.id === field.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {`${d.nombre} ${d.apellido}`} ({d.cedula || 'Sin Cédula'})
                                    </CommandItem>
                                ))}
                                </CommandGroup>
                            </Command>
                            </PopoverContent>
                        </Popover>
                        <FormDescription>Al seleccionar, se autocompletarán los campos.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="nombreDamnificado" render={({ field }) => ( <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="apellidoDamnificado" render={({ field }) => ( <FormItem><FormLabel>Apellidos</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                 <div className="grid md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="cedulaDamnificado" render={({ field }) => ( <FormItem><FormLabel>Cédula/Documento</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="telefonoDamnificado" render={({ field }) => ( <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
            </AccordionContent>
          </AccordionItem>

          {/* UBICACIÓN Y VIVIENDA */}
          <AccordionItem value="item-2">
            <AccordionTrigger className="font-headline">Ubicación y Vivienda</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
                <FormField control={form.control} name="direccion" render={({ field }) => ( <FormItem><FormLabel>Dirección</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="barrio" render={({ field }) => ( <FormItem><FormLabel>Barrio/Vereda</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                <div className="grid md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="ubicacionTipo" render={({ field }) => ( <FormItem><FormLabel>Ubicación</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger></FormControl><SelectContent><SelectItem value="urbano">Urbano</SelectItem><SelectItem value="rural">Rural</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="tipoEscenario" render={({ field }) => ( <FormItem><FormLabel>Tipo de Escenario</FormLabel><FormControl><Input placeholder="Ej: Residencial, Comercial" {...field} /></FormControl><FormMessage /></FormItem> )} />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="condicionVivienda" render={({ field }) => ( <FormItem><FormLabel>Condición de la Vivienda</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="fichaEdan" render={({ field }) => ( <FormItem><FormLabel>Ficha EDAN</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger></FormControl><SelectContent><SelectItem value="si">Sí</SelectItem><SelectItem value="no">No</SelectItem><SelectItem value="na">N/A</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                </div>
            </AccordionContent>
          </AccordionItem>
          
          {/* TIPO DE EVENTO Y DESCRIPCIÓN */}
          <AccordionItem value="item-3">
            <AccordionTrigger className="font-headline">Evento y Descripción</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
               <FormField
                    control={form.control}
                    name="tipoEvento"
                    render={() => (
                    <FormItem>
                        <FormLabel className="text-base">Tipo de Evento</FormLabel>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {eventItems.map((item) => (
                            <FormField
                            key={item.id}
                            control={form.control}
                            name="tipoEvento"
                            render={({ field }) => (
                                <FormItem key={item.id} className="flex flex-row items-center space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value?.includes(item.id)}
                                            onCheckedChange={(checked) => {
                                            return checked
                                                ? field.onChange([...(field.value || []), item.id])
                                                : field.onChange((field.value || []).filter(v => v !== item.id));
                                            }}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-normal">{item.label}</FormLabel>
                                </FormItem>
                            )}
                            />
                        ))}
                        </div>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                {tipoEvento.includes("otro") && (
                    <FormField control={form.control} name="otro_tipo_evento" render={({ field }) => ( <FormItem><FormLabel>Especifique Otro Evento</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                )}
                <FormField control={form.control} name="descripcionRequerimiento" render={({ field }) => ( <FormItem><FormLabel>Descripción del Requerimiento / Observaciones</FormLabel><FormControl><Textarea rows={5} placeholder="Detalles de lo observado en la visita..." {...field} /></FormControl><FormMessage /></FormItem> )} />
            </AccordionContent>
          </AccordionItem>
          
          {/* PROFESIONAL Y FIRMA */}
          <AccordionItem value="item-4">
            <AccordionTrigger className="font-headline">Profesional Asignado y Cierre</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="profesionalAsignado" render={({ field }) => ( <FormItem><FormLabel>Nombre del Profesional</FormLabel><FormControl><Input {...field} readOnly disabled /></FormControl><FormMessage /></FormItem> )} />
                    <FormField control={form.control} name="fechaVisita" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Fecha de la Visita</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccione fecha</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} locale={es} /></PopoverContent></Popover><FormMessage /></FormItem> )} />
                </div>
                 <div className="space-y-2">
                    <FormLabel>Registro Fotográfico</FormLabel>
                    {existingImages.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {existingImages.map((url, index) => (
                                <div key={index} className="relative group">
                                    <Image src={url} alt="Foto de visita" width={150} height={150} className="rounded-md object-cover w-full h-32" />
                                    <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleRemoveImage(url)}><Trash2 className="h-4 w-4"/></Button>
                                </div>
                            ))}
                        </div>
                    )}
                    <FormField control={form.control} name="new_fotos" render={({ field }) => ( <FormItem><FormControl><div className="relative"><Camera className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /><Input type="file" multiple className="pl-10" onChange={(e) => field.onChange(e.target.files)} /></div></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField
                    control={form.control}
                    name="firmaProfesional"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="flex items-center gap-2"><PenSquare className="h-5 w-5"/> Firma del Profesional</FormLabel>
                        <FormControl>
                            <SignaturePad onSave={field.onChange} initialSignature={field.value} />
                        </FormControl>
                        <FormDescription>Firme en el panel o suba una imagen de su firma.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <div className="text-xs text-muted-foreground p-3 border rounded-md">
                    Este documento se firma digitalmente por {userProfile?.displayName} el {format(new Date(), "dd/MM/yyyy 'a las' HH:mm")}. La integridad de este documento está asegurada.
                </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Button type="submit" size="lg" disabled={isSubmitting || loadingActa} className="w-full bg-primary hover:bg-primary/90">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? (visitaId ? "Actualizando..." : "Guardando y Generando PDF...") : (visitaId ? "Actualizar y Generar PDF" : "Guardar y Generar PDF")}
        </Button>
      </form>
    </Form>
  );
}
