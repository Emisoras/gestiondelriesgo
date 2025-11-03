
"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, MoreHorizontal, Trash2, Loader2, Pencil, Mail, Phone, Briefcase, Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useUser } from "@/firebase";
import { deleteVoluntario } from "@/firebase/voluntario-actions";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";

type Voluntario = {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    habilidades: string[];
    documento_identidad?: string;
    edad?: number;
    direccion?: string;
    barrio?: string;
    perfil_profesional?: string;
    organizacion?: string;
};

const skillLabels: { [key: string]: string } = {
  medica: "Asistencia Médica",
  logistica: "Logística y Distribución",
  psicologico: "Apoyo PsicoSocial",
  infraestructura: "Ingeniería / Infraestructura",
  educacion: "Educación y Recreación",
  religioso: "Apoyo Religioso",
  manipulacion_alimentos: "Manipulación de Alimentos",
  comunicaciones: "Comunicaciones",
  saneamiento_basico: "Saneamiento Básico",
  seguridad: "Seguridad",
  alojamiento: "Suministro Alojamiento",
  transporte: "Transporte",
  adecuaciones_locativas: "Adecuaciones Locativas",
  apoyo_administrativo: "Apoyo Administrativo",
};

const getSkillLabel = (id: string) => skillLabels[id] || id.replace(/_/g, ' ');


export function VoluntariosTable() {
  const { data: voluntarios, loading, forceRefetch } = useCollection<Voluntario>('voluntarios');
  const [searchTerm, setSearchTerm] = useState("");
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedVoluntario, setSelectedVoluntario] = useState<Voluntario | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { userProfile } = useUser();

  const filteredVoluntarios = voluntarios?.filter(
    (voluntario) => {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const searchInHabilidades = voluntario.habilidades?.some(habilidad => 
        getSkillLabel(habilidad).toLowerCase().includes(lowerCaseSearchTerm)
      );

      return (
        voluntario.nombre.toLowerCase().includes(lowerCaseSearchTerm) ||
        voluntario.apellido.toLowerCase().includes(lowerCaseSearchTerm) ||
        voluntario.email.toLowerCase().includes(lowerCaseSearchTerm) ||
        searchInHabilidades
      );
    }
  );

  const handleViewDetailsClick = (voluntario: Voluntario) => {
    setSelectedVoluntario(voluntario);
    setIsSheetOpen(true);
  };

  const handleDeleteClick = (voluntario: Voluntario) => {
    setSelectedVoluntario(voluntario);
    setIsAlertOpen(true);
  };
  
  const handleEditClick = (voluntarioId: string) => {
    router.push(`/dashboard/voluntarios/editar/${voluntarioId}`);
  };

  const handleDeleteConfirm = async () => {
    if (selectedVoluntario) {
        try {
            await deleteVoluntario(selectedVoluntario.id);
            toast({
              title: "Registro Eliminado",
              description: "El voluntario ha sido eliminado correctamente.",
            });
            forceRefetch(); // Force refetch after deletion
        } catch (error) {
            toast({
              title: "Error al eliminar",
              description: "No se pudo eliminar el voluntario. Verifique los permisos.",
              variant: "destructive"
            });
        }
    }
    setIsAlertOpen(false);
    setSelectedVoluntario(null);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar por nombre, email o habilidad..."
          className="pl-8 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre Completo</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Habilidades Principales</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex justify-center items-center">
                        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                        Cargando voluntarios...
                    </div>
                    </TableCell>
                </TableRow>
            ) : filteredVoluntarios && filteredVoluntarios.length > 0 ? (
              filteredVoluntarios.map((voluntario) => (
                <TableRow key={voluntario.id}>
                  <TableCell className="font-medium">
                    <Button variant="link" className="p-0 h-auto" onClick={() => handleViewDetailsClick(voluntario)}>
                        {`${voluntario.nombre} ${voluntario.apellido}`}
                    </Button>
                  </TableCell>
                  <TableCell>{voluntario.email}</TableCell>
                  <TableCell>{voluntario.telefono}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                        {voluntario.habilidades.slice(0, 2).map(habilidad => (
                             <Badge key={habilidad} variant="secondary" className="capitalize">
                                {getSkillLabel(habilidad)}
                            </Badge>
                        ))}
                        {voluntario.habilidades.length > 2 && <Badge variant="outline">+{voluntario.habilidades.length - 2}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => handleViewDetailsClick(voluntario)}>Ver Detalles</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => handleEditClick(voluntario.id)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            <span>Editar</span>
                        </DropdownMenuItem>
                        {userProfile?.role === 'administrador' && (
                          <DropdownMenuItem
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onSelect={() => handleDeleteClick(voluntario)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Eliminar</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No se encontraron voluntarios.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

       <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent className="sm:max-w-lg overflow-y-auto">
                {selectedVoluntario && (
                    <>
                        <SheetHeader>
                            <SheetTitle className="font-headline text-2xl">{`${selectedVoluntario.nombre} ${selectedVoluntario.apellido}`}</SheetTitle>
                            <SheetDescription>
                                Detalles del voluntario.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="py-6 space-y-6">
                            <div className="space-y-2">
                                <h4 className="font-semibold">Información de Contacto</h4>
                                <div className="text-sm space-y-2">
                                    <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground"/> {selectedVoluntario.email}</p>
                                    <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground"/> {selectedVoluntario.telefono}</p>
                                    {selectedVoluntario.direccion && <p className="text-sm">{selectedVoluntario.direccion}{selectedVoluntario.barrio ? `, ${selectedVoluntario.barrio}` : ''}</p>}
                                </div>
                            </div>
                            <Separator />
                             <div className="space-y-2">
                                <h4 className="font-semibold">Datos Personales</h4>
                                <div className="text-sm grid grid-cols-2 gap-2">
                                    <p><strong>C.I:</strong> {selectedVoluntario.documento_identidad || 'N/A'}</p>
                                    <p><strong>Edad:</strong> {selectedVoluntario.edad || 'N/A'}</p>
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <h4 className="font-semibold">Información Profesional y Organizacional</h4>
                                 <div className="text-sm space-y-2">
                                    {selectedVoluntario.perfil_profesional && <p className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-muted-foreground"/> {selectedVoluntario.perfil_profesional}</p>}
                                    {selectedVoluntario.organizacion && <p className="flex items-center gap-2"><Building className="h-4 w-4 text-muted-foreground"/> {selectedVoluntario.organizacion}</p>}
                                    {!selectedVoluntario.perfil_profesional && !selectedVoluntario.organizacion && <p className="text-muted-foreground">No se proporcionó información profesional.</p>}
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <h4 className="font-semibold">Habilidades y Áreas de Apoyo</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedVoluntario.habilidades.map(habilidad => (
                                        <Badge key={habilidad} variant="secondary" className="capitalize text-sm">{getSkillLabel(habilidad)}</Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <SheetFooter>
                            <Button onClick={() => handleEditClick(selectedVoluntario.id)}>
                                <Pencil className="mr-2 h-4 w-4"/> Editar Voluntario
                            </Button>
                        </SheetFooter>
                    </>
                )}
            </SheetContent>
        </Sheet>

       <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro de que quieres eliminar este registro?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto eliminará permanentemente el registro de
                    {selectedVoluntario && ` ${selectedVoluntario.nombre} ${selectedVoluntario.apellido}`}.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
                    Eliminar
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
