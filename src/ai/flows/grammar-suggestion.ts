'use server';

/**
 * @fileOverview An AI-powered assistant that suggests improvements for grammar, clarity, and style in notes.
 *
 * - grammarSuggestion - A function that handles the grammar suggestion process.
 * - GrammarSuggestionInput - The input type for the grammarSuggestion function.
 * - GrammarSuggestionOutput - The return type for the grammarSuggestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GrammarSuggestionInputSchema = z.object({
  text: z.string().describe('The text to be checked for grammar, clarity, and style.'),
});
export type GrammarSuggestionInput = z.infer<typeof GrammarSuggestionInputSchema>;

const GrammarSuggestionOutputSchema = z.object({
  suggestions: z
    .string()
    .describe('The suggested improvements for grammar, clarity, and style.'),
});
export type GrammarSuggestionOutput = z.infer<typeof GrammarSuggestionOutputSchema>;

export async function grammarSuggestion(input: GrammarSuggestionInput): Promise<GrammarSuggestionOutput> {
  return grammarSuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'grammarSuggestionPrompt',
  input: {schema: GrammarSuggestionInputSchema},
  output: {schema: GrammarSuggestionOutputSchema},
  prompt: `You are an AI-powered assistant that suggests improvements for grammar, clarity, and style in the given text.\n\nText: {{{text}}}\n\nSuggestions:`,
});

const grammarSuggestionFlow = ai.defineFlow(
  {
    name: 'grammarSuggestionFlow',
    inputSchema: GrammarSuggestionInputSchema,
    outputSchema: GrammarSuggestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
