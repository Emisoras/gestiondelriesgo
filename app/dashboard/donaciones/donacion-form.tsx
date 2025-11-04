
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Camera, Loader2, Trash2, PlusCircle, MinusCircle, Check, ChevronsUpDown, DollarSign } from "lucide-react";
import { addDonacion, updateDonacion } from "@/firebase/donacion-actions";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { useCollection } from "@/firebase";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { Articulo } from "../admin/articulos/articulos-table";

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const articuloSchema = z.object({
  articuloId: z.string().optional(), // Optional because it might not exist yet
  nombre: z.string().min(1, "El nombre es requerido."),
  cantidad: z.coerce.number().positive("La cantidad debe ser mayor a 0."),
  unidad: z.string().min(1, "La unidad es requerida."),
});

const formSchema = z.object({
  donante: z.string().min(2, "El nombre del donante es requerido."),
  tipo_persona: z.enum(["natural", "juridica"], { required_error: "Debe seleccionar un tipo de persona." }),
  identificacion: z.string().min(2, "El número de identificación es requerido."),
  email: z.string().email("Debe ser un correo electrónico válido.").optional().or(z.literal("")),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  
  tipo_donacion: z.enum(["monetaria", "alimentos", "ropa", "medicamentos", "aseo", "cocina", "frazadas", "otro"]),
  monto: z.coerce.number().optional(),
  descripcion_general: z.string().optional(),
  
  articulos: z.array(articuloSchema).optional(),
  
  fotos_donacion: z.array(z.string()).optional(),
  new_fotos_donacion: z.any().optional(),
  observaciones: z.string().optional(),
}).refine(data => {
    if (data.tipo_donacion !== 'monetaria' && (!data.articulos || data.articulos.length === 0)) {
        return false;
    }
    return true;
}, {
    message: "Debe agregar al menos un artículo a la donación.",
    path: ["articulos"],
}).refine(data => {
    if (data.tipo_donacion === 'monetaria' && (!data.monto || data.monto <= 0)) {
        return false;
    }
    return true;
}, {
    message: "Debe ingresar un monto válido para la donación monetaria.",
    path: ["monto"],
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
            articulos: [],
            fotos_donacion: [],
            observaciones: "",
            monto: 0,
            descripcion_general: ""
        };
    }
    const parsed = { ...initialValues };
    if (!parsed.fotos_donacion) parsed.fotos_donacion = [];
    if (!parsed.articulos) parsed.articulos = [];
    return parsed;
};


type DonacionFormProps = {
    donacionId?: string;
    initialValues?: Partial<z.infer<typeof formSchema>>;
};

export function DonacionForm({ donacionId, initialValues }: DonacionFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { data: catalogo, loading: loadingCatalogo } = useCollection<Articulo>('catalogoArticulos');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>(initialValues?.fotos_donacion || []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: parseInitialValues(initialValues),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "articulos",
  });
  
  const tipoDonacion = form.watch("tipo_donacion");

  useEffect(() => {
    const parsed = parseInitialValues(initialValues);
    form.reset(parsed);
    setExistingImages(parsed.fotos_donacion || []);
  }, [initialValues, form]);

  const handleRemoveImage = (imageUrl: string) => {
    setExistingImages(prev => prev.filter(url => url !== imageUrl));
  };


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
      
      if (dataPayload.tipo_donacion === 'monetaria') {
        dataPayload.articulos = []; // Clear articles if it's monetary
      } else {
        dataPayload.monto = 0; // Clear amount if it's not monetary
        dataPayload.descripcion_general = "";
      }

        if (donacionId) {
            await updateDonacion(donacionId, dataPayload);
            toast({ title: "Actualización Exitosa", description: "La donación ha sido actualizada." });
            router.push("/dashboard/donaciones/listado");
        } else {
            await addDonacion(dataPayload);
            toast({ title: "Registro Exitoso", description: "La donación ha sido registrada y el inventario actualizado." });
            form.reset(parseInitialValues(null));
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
        
        <Separator />

        <FormField
            control={form.control}
            name="tipo_donacion"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Tipo de Donación</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                    <SelectTrigger>
                    <SelectValue placeholder="Seleccione una categoría" />
                    </SelectTrigger>
                </FormControl>
                <SelectContent>
                    <SelectItem value="monetaria">Monetaria</SelectItem>
                    <SelectItem value="alimentos">Alimentos</SelectItem>
                    <SelectItem value="ropa">Ropa y Calzado</SelectItem>
                    <SelectItem value="medicamentos">Medicamentos</SelectItem>
                    <SelectItem value="aseo">Útiles de Aseo</SelectItem>
                    <SelectItem value="cocina">Útiles de Cocina</SelectItem>
                    <SelectItem value="frazadas">Frazadas y Cobijas</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
                </Select>
                <FormMessage />
            </FormItem>
            )}
        />
        
        {tipoDonacion === 'monetaria' ? (
            <div className="space-y-4 rounded-md border p-4">
                <FormField
                    control={form.control}
                    name="monto"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Monto de la Donación</FormLabel>
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
                    name="descripcion_general"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                            <Input placeholder="Ej: Transferencia Bancaria, Efectivo" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
        ) : (
             <div>
                <FormLabel className="text-lg font-medium">Artículos Donados</FormLabel>
                <FormDescription>Escriba para buscar un artículo o para crear uno nuevo.</FormDescription>
                <div className="space-y-4 mt-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-2 items-start p-4 border rounded-md">
                            <FormField
                                control={form.control}
                                name={`articulos.${index}.nombre`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input 
                                                      placeholder="Buscar o crear artículo..." 
                                                      {...field}
                                                      onChange={(e) => {
                                                        field.onChange(e.target.value);
                                                        const currentArticulos = form.getValues('articulos') || [];
                                                        currentArticulos[index] = { ...currentArticulos[index], articuloId: undefined, unidad: ''};
                                                        form.setValue('articulos', currentArticulos);
                                                      }}
                                                    />
                                                </div>
                                            </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[300px] p-0" align="start">
                                                <Command>
                                                    <CommandInput placeholder="Buscar artículo..." value={field.value} onValueChange={field.onChange} />
                                                    <CommandList>
                                                        <CommandEmpty>No se encontraron resultados. Se creará un nuevo artículo.</CommandEmpty>
                                                        <CommandGroup>
                                                        {catalogo?.map((item) => (
                                                            <CommandItem
                                                            value={item.nombre}
                                                            key={item.id}
                                                            onSelect={() => {
                                                                const currentArticulos = form.getValues('articulos') || [];
                                                                currentArticulos[index] = {
                                                                    articuloId: item.id,
                                                                    nombre: item.nombre,
                                                                    unidad: item.unidad,
                                                                    cantidad: currentArticulos[index].cantidad || 1,
                                                                };
                                                                form.setValue('articulos', currentArticulos);
                                                            }}
                                                            >
                                                            <Check className={cn("mr-2 h-4 w-4", item.id === form.getValues(`articulos.${index}.articuloId`) ? "opacity-100" : "opacity-0")}/>
                                                            {item.nombre}
                                                            </CommandItem>
                                                        ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name={`articulos.${index}.cantidad`}
                                render={({ field }) => (
                                    <FormItem className="w-24">
                                        <FormControl><Input type="number" placeholder="Cant." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name={`articulos.${index}.unidad`}
                                render={({ field }) => (
                                    <FormItem className="w-32">
                                        <FormControl><Input placeholder="und, kg, lts..." {...field} disabled={!!form.watch(`articulos.${index}.articuloId`)}/></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex items-end h-full">
                               <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                                   <MinusCircle className="h-4 w-4" />
                               </Button>
                            </div>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ nombre: "", cantidad: 1, unidad: "" })}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir Artículo
                    </Button>
                     {form.formState.errors.articulos && typeof form.formState.errors.articulos.message === 'string' && (
                        <FormMessage>{form.formState.errors.articulos.message}</FormMessage>
                     )}
                </div>
            </div>
        )}
        
        <Separator />
        
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
        <Button type="submit" disabled={isSubmitting || loadingCatalogo} className="w-full bg-primary hover:bg-primary/90">
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

    