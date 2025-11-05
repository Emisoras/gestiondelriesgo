
"use server";

import { generateImpactStatement, GenerateImpactStatementInput } from "@/ai/flows/generate-impact-statement";
import { z } from "zod";

const GenerateImpactStatementInputSchema = z.object({
  eventDescription: z.string().min(10, "La descripción del evento es muy corta."),
  affectedPeopleCount: z.coerce.number().min(0, "El número de personas debe ser positivo."),
  donationsReceived: z.string().min(5, "La descripción de donaciones es muy corta."),
  volunteerHours: z.coerce.number().min(0, "Las horas de voluntariado deben ser positivas."),
});

type FormState = {
  message: string;
  impactStatement?: string;
  errors?: {
    [key in keyof GenerateImpactStatementInput]?: string[];
  };
};

export async function handleGenerateImpactStatement(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const rawFormData = Object.fromEntries(formData.entries());

  const validatedFields = GenerateImpactStatementInputSchema.safeParse(rawFormData);
  
  if (!validatedFields.success) {
    return {
      message: "Por favor corrija los errores en el formulario.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  try {
    const result = await generateImpactStatement(validatedFields.data);
    return {
      message: "Declaración de impacto generada exitosamente.",
      impactStatement: result.impactStatement,
    };
  } catch (error) {
    console.error("Error generating impact statement:", error);
    return {
      message: "Ocurrió un error al generar la declaración. Por favor, intente de nuevo.",
    };
  }
}
