
"use client";

import { useState, useMemo } from "react";
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
import { Search, Loader2 } from "lucide-react";
import { useCollection } from "@/firebase";
import type { Articulo } from "../admin/articulos/articulos-table";

type InventarioItem = {
  id: string; // Document ID in inventario collection
  articuloId: string; // Document ID from catalogoArticulos
  nombre: string;
  cantidad: number;
  unidad: string;
  lastUpdatedAt?: {
    seconds: number;
  }
};

export function InventarioTable() {
  const { data: catalogo, loading: loadingCatalogo } = useCollection<Articulo>('catalogoArticulos', { orderBy: ['nombre', 'asc'] });
  const { data: inventario, loading: loadingInventario } = useCollection<InventarioItem>('inventario');
  const [searchTerm, setSearchTerm] = useState("");

  const loading = loadingCatalogo || loadingInventario;

  const combinedInventario = useMemo(() => {
    if (!catalogo) return [];

    // Create a map of inventory items by their articuloId for quick lookup.
    const inventarioMap = new Map(inventario?.map(item => [item.articuloId, item]) || []);

    // Map over the catalog and enrich it with inventory data.
    return catalogo.map(articulo => {
      const inventarioItem = inventarioMap.get(articulo.id);
      return {
        id: articulo.id,
        nombre: articulo.nombre,
        unidad: articulo.unidad,
        cantidad: inventarioItem?.cantidad ?? 0,
      };
    });
  }, [catalogo, inventario]);


  const filteredInventario = combinedInventario?.filter(
    (item) =>
      item && (
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.unidad.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );
  
  const getStockVariant = (cantidad: number) => {
    if (cantidad <= 0) return 'destructive';
    if (cantidad <= 10) return 'secondary';
    return 'default';
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar por nombre o unidad..."
          className="pl-8 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Artículo</TableHead>
              <TableHead className="text-right">Cantidad en Stock</TableHead>
              <TableHead>Unidad</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  <div className="flex justify-center items-center">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Cargando inventario...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredInventario && filteredInventario.length > 0 ? (
              filteredInventario.map((item) => (
                item && <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.nombre}</TableCell>
                  <TableCell className="text-right">
                     <Badge variant={getStockVariant(item.cantidad)} className="text-lg">
                        {item.cantidad}
                     </Badge>
                  </TableCell>
                  <TableCell>{item.unidad}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                   {catalogo && catalogo.length > 0 ? "No se encontraron artículos con ese criterio." : "No hay artículos en el catálogo. Agregue algunos para ver el inventario."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
