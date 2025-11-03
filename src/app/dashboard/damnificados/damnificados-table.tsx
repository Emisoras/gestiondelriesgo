
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, MoreHorizontal, Pencil, Trash2, FileDown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useUser } from "@/firebase";
import { deleteDamnificado } from "@/firebase/damnificado-actions";
import { useRouter } from "next/navigation";
import { exportDamnificadoToPDF } from "@/lib/pdf-generator";

type Damnificado = {
  id: string;
  nombre: string;
  apellido: string;
  cedula?: string;
  ciudad: string;
  condiciones_vivienda: "leve" | "moderado" | "grave" | "perdida_total";
  [key: string]: any; // Allow other properties
};

export function DamnificadosTable() {
  const { data: damnificados, loading, forceRefetch } = useCollection<Damnificado>('damnificados');
  const [searchTerm, setSearchTerm] = useState("");
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedDamnificado, setSelectedDamnificado] = useState<Damnificado | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { userProfile } = useUser();

  const filteredDamnificados = damnificados?.filter(
    (damnificado) =>
      damnificado.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      damnificado.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (damnificado.cedula && damnificado.cedula.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDeleteClick = (damnificado: Damnificado) => {
    setSelectedDamnificado(damnificado);
    setIsAlertOpen(true);
  };

  const handleEditClick = (damnificadoId: string) => {
    router.push(`/dashboard/damnificados/editar/${damnificadoId}`);
  };

  const handleExportClick = async (damnificado: Damnificado) => {
    try {
        await exportDamnificadoToPDF(damnificado);
        toast({
            title: "Exportación Exitosa",
            description: `Se ha generado el PDF para ${damnificado.nombre} ${damnificado.apellido}.`
        })
    } catch(error) {
        console.error("Error al exportar a PDF: ", error);
        toast({
            title: "Error de Exportación",
            description: "No se pudo generar el archivo PDF.",
            variant: "destructive"
        })
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedDamnificado) {
        try {
            await deleteDamnificado(selectedDamnificado.id);
            toast({
              title: "Registro Eliminado",
              description: "El damnificado ha sido eliminado correctamente.",
            });
            forceRefetch(); // Force refetch
        } catch(error) {
            toast({
              title: "Error al eliminar",
              description: "No se pudo eliminar el registro. Verifique sus permisos.",
              variant: "destructive",
            });
        }
    }
    setIsAlertOpen(false);
    setSelectedDamnificado(null);
  };


  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar por nombre, apellido o cédula..."
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
              <TableHead>Cédula</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Daño Vivienda</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Cargando damnificados...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredDamnificados && filteredDamnificados.length > 0 ? (
              filteredDamnificados.map((damnificado) => (
                <TableRow key={damnificado.id}>
                  <TableCell className="font-medium">{`${damnificado.nombre} ${damnificado.apellido}`}</TableCell>
                  <TableCell>{damnificado.cedula}</TableCell>
                  <TableCell>{damnificado.ciudad}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        damnificado.condiciones_vivienda === "grave" || damnificado.condiciones_vivienda === "perdida_total"
                          ? "destructive"
                          : damnificado.condiciones_vivienda === "moderado"
                          ? "secondary"
                          : "outline"
                      }
                      className="capitalize"
                    >
                      {damnificado.condiciones_vivienda.replace("_", " ")}
                    </Badge>
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
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => handleEditClick(damnificado.id)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>Editar</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleExportClick(damnificado)}>
                          <FileDown className="mr-2 h-4 w-4" />
                          <span>Exportar</span>
                        </DropdownMenuItem>
                        {userProfile?.role === 'administrador' && (
                          <DropdownMenuItem 
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onSelect={() => handleDeleteClick(damnificado)}
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
                  No se encontraron damnificados. Puede registrar uno nuevo.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro de que quieres eliminar este registro?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto eliminará permanentemente el registro de
                    {selectedDamnificado && ` ${selectedDamnificado.nombre} ${selectedDamnificado.apellido}`}.
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
