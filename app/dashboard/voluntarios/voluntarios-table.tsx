
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
import { Search, MoreHorizontal, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useUser } from "@/firebase";
import { deleteVoluntario } from "@/firebase/voluntario-actions";

type Voluntario = {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    habilidades: string[];
};

export function VoluntariosTable() {
  const { data: voluntarios, loading, forceRefetch } = useCollection<Voluntario>('voluntarios');
  const [searchTerm, setSearchTerm] = useState("");
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedVoluntario, setSelectedVoluntario] = useState<Voluntario | null>(null);
  const { toast } = useToast();
  const { userProfile } = useUser();

  const filteredVoluntarios = voluntarios?.filter(
    (voluntario) => {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const searchInHabilidades = voluntario.habilidades?.some(habilidad => 
        habilidad.replace(/_/g, ' ').toLowerCase().includes(lowerCaseSearchTerm)
      );

      return (
        voluntario.nombre.toLowerCase().includes(lowerCaseSearchTerm) ||
        voluntario.apellido.toLowerCase().includes(lowerCaseSearchTerm) ||
        voluntario.email.toLowerCase().includes(lowerCaseSearchTerm) ||
        searchInHabilidades
      );
    }
  );

  const handleDeleteClick = (voluntario: Voluntario) => {
    setSelectedVoluntario(voluntario);
    setIsAlertOpen(true);
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
              <TableHead>Habilidades</TableHead>
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
                  <TableCell className="font-medium">{`${voluntario.nombre} ${voluntario.apellido}`}</TableCell>
                  <TableCell>{voluntario.email}</TableCell>
                  <TableCell>{voluntario.telefono}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                        {voluntario.habilidades.slice(0, 2).map(habilidad => (
                             <Badge key={habilidad} variant="secondary" className="capitalize">
                                {habilidad.replace(/_/g, ' ')}
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
                        <DropdownMenuSeparator />
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
