/**
 * Strips em dashes, en dashes, and arrow characters from any text before it's shown to a
 * client - covers generated copy (Charlie's summary, SMS bodies) and anything a user typed
 * that happens to contain one. Dashes read as commas, arrows read as full stops; whitespace
 * is tidied up afterwards so the substitution doesn't leave doubled punctuation.
 */
export function cleanText(input: string): string {
  return input
    .replace(/[–—]/g, ",")
    .replace(/-{1,2}>|<-{1,2}|[←-⇿➔➡⟶⟵]/g, ".")
    .replace(/\s*,\s*,+/g, ",")
    .replace(/,\s*\./g, ".")
    .replace(/\.\s*\./g, ".")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
