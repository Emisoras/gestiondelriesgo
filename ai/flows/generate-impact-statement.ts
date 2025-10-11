// This file is machine-generated - edit with caution!
'use server';
/**
 * @fileOverview A flow to generate an estimated impact statement for a specific event.
 *
 * - generateImpactStatement - A function that generates the impact statement.
 * - GenerateImpactStatementInput - The input type for the generateImpactStatement function.
 * - GenerateImpactStatementOutput - The return type for the generateImpactStatement function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImpactStatementInputSchema = z.object({
  eventDescription: z
    .string()
    .describe('A detailed description of the event for which to generate the impact statement.'),
  affectedPeopleCount: z
    .number()
    .describe('The number of people affected by the event.'),
  donationsReceived: z
    .string()
    .describe('A description of the donations received for the event.'),
  volunteerHours: z
    .number()
    .describe('The number of volunteer hours contributed to the event.'),
});
export type GenerateImpactStatementInput = z.infer<
  typeof GenerateImpactStatementInputSchema
>;

const GenerateImpactStatementOutputSchema = z.object({
  impactStatement: z
    .string()
    .describe('A comprehensive impact statement for the event.'),
});
export type GenerateImpactStatementOutput = z.infer<
  typeof GenerateImpactStatementOutputSchema
>;

export async function generateImpactStatement(
  input: GenerateImpactStatementInput
): Promise<GenerateImpactStatementOutput> {
  return generateImpactStatementFlow(input);
}

const generateImpactStatementPrompt = ai.definePrompt({
  name: 'generateImpactStatementPrompt',
  input: {schema: GenerateImpactStatementInputSchema},
  output: {schema: GenerateImpactStatementOutputSchema},
  prompt: `You are an expert in creating impact statements for disaster relief events. Based on the provided information, create a compelling and informative impact statement.

Event Description: {{{eventDescription}}}
Number of People Affected: {{{affectedPeopleCount}}}
Donations Received: {{{donationsReceived}}}
Volunteer Hours: {{{volunteerHours}}}

Impact Statement:`, // Handlebars syntax
});

const generateImpactStatementFlow = ai.defineFlow(
  {
    name: 'generateImpactStatementFlow',
    inputSchema: GenerateImpactStatementInputSchema,
    outputSchema: GenerateImpactStatementOutputSchema,
  },
  async input => {
    const {output} = await generateImpactStatementPrompt(input);
    return output!;
  }
);
