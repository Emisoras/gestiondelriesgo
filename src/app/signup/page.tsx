
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignupForm } from "./signup-form";
import { Logo } from "@/components/icons/logo";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/40">
        <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <Logo className="mx-auto h-24 w-24 text-primary" />
            <CardTitle className="mt-4 font-headline text-2xl">Crear una cuenta</CardTitle>
            <CardDescription>
                Únase a ResQ Hub para empezar a colaborar.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <SignupForm />
        </CardContent>
        </Card>
    </div>
  );
}
