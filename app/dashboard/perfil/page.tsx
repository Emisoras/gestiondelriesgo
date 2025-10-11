import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Lock } from "lucide-react";
import { PerfilForm } from "./perfil-form";
import { PasswordForm } from "./password-form";

export default function PerfilPage() {
  return (
    <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                    <User className="h-6 w-6" />
                    Información Personal
                </CardTitle>
                <CardDescription>
                    Actualice su nombre y vea su correo electrónico.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <PerfilForm />
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                    <Lock className="h-6 w-6" />
                    Cambiar Contraseña
                </CardTitle>
                <CardDescription>
                    Asegúrese de usar una contraseña segura.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <PasswordForm />
            </CardContent>
        </Card>
    </div>
  );
}
