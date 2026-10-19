import "server-only";
import { cache } from "react";
import { UserLicencesDto } from "@/repositories/dto/UserLicencesDto";
import { fetchUsersPayload } from "@/repositories/sources/usersSource";

/**
 * Licences des joueurs qui ont un compte de connexion (liste blanche : aucune autre donnée de compte n'est lue). Sert
 * à chiffrer les comptes emportés par une suppression d'équipe. Lève si la lecture ou le format échoue.
 */
export const listAccountLicences = cache(async (token: string): Promise<string[]> => {
  return UserLicencesDto.parse(await fetchUsersPayload(token));
});
