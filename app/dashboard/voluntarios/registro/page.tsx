import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VoluntarioForm } from "../voluntario-form";
import { HeartHandshake } from "lucide-react";

export default function VoluntarioRegistroPage() {
  return (
    <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <HeartHandshake className="h-6 w-6" />
              Registro de Voluntarios
            </CardTitle>
            <CardDescription>
              ¿Quieres ayudar? Completa el formulario para unirte a nuestros equipos de apoyo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VoluntarioForm />
          </CardContent>
        </Card>
    </div>
  );
}
