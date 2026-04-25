/**
 * Validate an Australian Business Number (ABN) using the official
 * weighted-checksum algorithm published by the Australian Business Register.
 *
 * https://abr.business.gov.au/Help/AbnFormat
 */
const WEIGHTS = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

export function cleanAbn(input: string | null | undefined): string {
  return (input ?? "").replace(/\s/g, "");
}

export function isValidAbn(input: string | null | undefined): boolean {
  const abn = cleanAbn(input);
  if (!/^\d{11}$/.test(abn)) return false;
  const digits = abn.split("").map((d) => parseInt(d, 10));
  // Subtract 1 from the first (left-most) digit
  digits[0] -= 1;
  const sum = digits.reduce((acc, d, i) => acc + d * WEIGHTS[i], 0);
  return sum % 89 === 0;
}