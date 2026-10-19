import { pluralize } from "@/lib/format";
import type { AdminGameAlert } from "@/models/AdminGameAlert";

export function describeAdminGameAlert(alert: AdminGameAlert): string {
  switch (alert.kind) {
    case "scoreMissing":
      return "Score à saisir : le match est passé mais le score vaut toujours 0-0.";
    case "statsMissing":
      return "Statistiques non saisies pour ce match.";
    case "duplicatePlayers": {
      const list = alert.players
        .map((player) => `${player.name} apparaît ${player.lineCount} fois dans la feuille de stats`)
        .join(" ; ");
      return `Doublon : ${list}. Les totaux comptent toutes les lignes.`;
    }
    case "scoreGap": {
      const { officialPoints, statsPoints, difference } = alert.gap;
      return `Écart entre le score officiel (${officialPoints}) et la somme des points saisis (${statsPoints}) : ${pluralize(Math.abs(difference), "point", "points")}.`;
    }
    case "invalidVideo":
      return `Lien vidéo non reconnu : « ${alert.raw} ». Saisis l'identifiant YouTube ou une adresse youtube.com / youtu.be.`;
    case "rpbSideUnknown":
      return "Aucune équipe RPB n'est associée à cette saison : résultat et écart de score non calculables.";
  }
}
