import { isValidIsoDate } from "@/models/isValidIsoDate";

/**
 * Années révolues entre deux dates `YYYY-MM-DD` (comparaison du couple mois-jour : un 29 février est fêté le 1er mars
 * des années non bissextiles). `null` si une date est invalide ou si la naissance est postérieure à `today`.
 */
export function computeAge(birthDate: string, today: string): number | null {
  if (!isValidIsoDate(birthDate) || !isValidIsoDate(today) || birthDate > today) return null;
  const [birthYear, birthMonth, birthDay] = birthDate.split("-").map(Number);
  const [year, month, day] = today.split("-").map(Number);
  const birthdayReached = month > birthMonth || (month === birthMonth && day >= birthDay);
  return year - birthYear - (birthdayReached ? 0 : 1);
}
