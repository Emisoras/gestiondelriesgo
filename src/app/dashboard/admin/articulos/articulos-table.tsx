
"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Pencil, Trash2 } from "lucide-react";
import { useCollection, useUser } from "@/firebase";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { deleteArticulo } from "@/firebase/articulo-actions";
import { useToast } from "@/hooks/use-toast";


export type Articulo = {
    id: string;
    nombre: string;
    categoria: string;
    unidad: string;
    nombre_normalizado?: string;
};


export function ArticulosTable() {
  const { data: articulos, loading, forceRefetch } = useCollection<Articulo>('catalogoArticulos', { orderBy: ['nombre', 'asc'] });
  const [searchTerm, setSearchTerm] = useState("");
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedArticulo, setSelectedArticulo] = useState<Articulo | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const filteredArticulos = articulos?.filter(
    (articulo) =>
      articulo.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      articulo.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleEditClick = (articuloId: string) => {
    router.push(`/dashboard/admin/articulos/editar/${articuloId}`);
  }
  
  const handleDeleteClick = (articulo: Articulo) => {
    setSelectedArticulo(articulo);
    setIsAlertOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedArticulo) {
        try {
            await deleteArticulo(selectedArticulo.id);
            toast({
              title: "Artículo Eliminado",
              description: "El artículo ha sido eliminado del catálogo.",
            });
            forceRefetch();
        } catch(error) {
            toast({
              title: "Error al eliminar",
              description: "No se pudo eliminar el artículo.",
              variant: "destructive",
            });
        }
    }
    setIsAlertOpen(false);
    setSelectedArticulo(null);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar por nombre o categoría..."
          className="pl-8 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre del Artículo</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Unidad de Medida</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Cargando artículos...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredArticulos && filteredArticulos.length > 0 ? (
              filteredArticulos.map((articulo) => (
                <TableRow key={articulo.id}>
                  <TableCell className="font-medium">{articulo.nombre}</TableCell>
                  <TableCell>
                     <Badge variant="secondary">{articulo.categoria}</Badge>
                  </TableCell>
                  <TableCell>{articulo.unidad}</TableCell>
                   <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(articulo.id)}>
                            <Pencil className="h-4 w-4"/>
                            <span className="sr-only">Editar Artículo</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClick(articulo)}>
                            <Trash2 className="h-4 w-4"/>
                            <span className="sr-only">Eliminar Artículo</span>
                        </Button>
                   </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No se encontraron artículos en el catálogo.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
       <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro de que quieres eliminar este artículo?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto eliminará permanentemente el artículo "{selectedArticulo?.nombre}" del catálogo.
                    Esta acción no afectará el stock actual en el inventario.
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
