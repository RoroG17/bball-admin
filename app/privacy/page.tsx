import type { Metadata } from "next";
import styles from "../legal-pages.module.css";

export const metadata: Metadata = {
  title: "Politique de confidentialité – BBall",
  description:
    "Politique de confidentialité de l'application BBall, éditée par GProd.",
};

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Politique de confidentialité de BBall</h1>
        <p>
          <strong>Dernière mise à jour : 20 octobre 2026</strong>
        </p>
        <p>
          Cette politique concerne l&apos;application mobile <strong>BBall</strong>, éditée par{" "}
          <strong>GProd</strong>, ainsi que les données qu&apos;elle échange avec le service associé.
        </p>

        <h2>Responsable du traitement et contact</h2>
        <p>
          Le responsable du traitement est <strong>[Prénom Nom]</strong>, éditeur de l&apos;application sous le
          nom <strong>GProd</strong>.
        </p>
        <p>
          Contact : <a href="mailto:romain-g17@hotmail.fr">romain-g17@hotmail.fr</a>
        </p>

        <h2>Données traitées</h2>
        <p>
          Les données ci-dessous sont traitées lorsque vous utilisez les fonctionnalités correspondantes. Les
          données sportives sont associées à un joueur identifié par son compte ou son numéro de licence.
        </p>
        <ul>
          <li>
            <strong>Compte et authentification :</strong> nom d&apos;utilisateur, mot de passe saisi lors de la
            connexion ou de l&apos;initialisation du compte, et informations de compte renvoyées par le service,
            notamment l&apos;identifiant/licence du joueur et son équipe. Le mot de passe est transmis au serveur
            pour l&apos;authentification ; l&apos;application ne l&apos;enregistre pas dans son stockage local.
          </li>
          <li>
            <strong>Profil du joueur :</strong> numéro de licence, nom, prénom, civilité, date de naissance,
            équipe et, si disponible, photo/avatar.
          </li>
          <li>
            <strong>Données de basketball et de condition physique :</strong> matchs et résultats, statistiques
            individuelles, données d&apos;examens sportifs (date, type, réussite et coordonnées des tirs sur le
            terrain) et résultats de tests physiques (date, type et valeur). Ces données peuvent révéler les
            performances physiques d&apos;un joueur.
          </li>
          <li>
            <strong>Données de diagnostic et d&apos;utilisation technique :</strong> plateforme (mobile), version
            du système d&apos;exploitation, route appelée, méthode et résultat de la requête, durée de traitement
            côté serveur et utilisateur authentifié lorsque la requête est liée à un compte. En cas d&apos;erreur
            ou de plantage, l&apos;application peut aussi transmettre le message d&apos;erreur, la route ou l&apos;écran
            concerné et une trace technique (« stack trace »).
          </li>
          <li>
            <strong>Localisation de l&apos;appareil :</strong> l&apos;application peut vous demander l&apos;autorisation
            d&apos;accéder à la localisation de votre appareil pendant son utilisation. Si vous l&apos;accordez, la
            dernière position disponible (latitude et longitude) est jointe aux requêtes envoyées au serveur et
            peut être enregistrée dans ses journaux techniques. Elle sert uniquement au diagnostic et à
            l&apos;administration du service, et n&apos;est pas utilisée pour les statistiques sportives. L&apos;autorisation
            est facultative : l&apos;application fonctionne normalement si vous la refusez. Vous pouvez la retirer
            à tout moment dans les réglages de votre appareil ; les coordonnées ne sont alors plus envoyées.
          </li>
          <li>
            <strong>Données conservées sur l&apos;appareil :</strong> nom d&apos;utilisateur, identifiant du joueur,
            équipe et cache de contenus (par exemple matchs, joueurs, saisons et statistiques). Le mot de passe
            n&apos;est pas conservé par l&apos;application.
          </li>
        </ul>

        <h2>Finalités et bases légales</h2>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th scope="col">Finalité</th>
                <th scope="col">Données concernées</th>
                <th scope="col">Base légale</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Authentifier l&apos;utilisateur et retrouver le joueur associé au compte</td>
                <td>Compte et authentification</td>
                <td>Exécution du service demandé par l&apos;utilisateur</td>
              </tr>
              <tr>
                <td>
                  Fournir les profils, matchs et statistiques, et permettre la consultation hors ligne des
                  contenus déjà chargés
                </td>
                <td>Profil du joueur, données de basketball, données conservées sur l&apos;appareil</td>
                <td>Exécution du service demandé par l&apos;utilisateur</td>
              </tr>
              <tr>
                <td>Diagnostiquer les erreurs, surveiller la disponibilité, la sécurité et les performances du service</td>
                <td>Données de diagnostic et d&apos;utilisation technique</td>
                <td>Intérêt légitime de l&apos;éditeur à assurer le bon fonctionnement et la sécurité du service</td>
              </tr>
              <tr>
                <td>Diagnostic et administration du service à partir de la position de l&apos;appareil</td>
                <td>Localisation de l&apos;appareil</td>
                <td>Consentement, donné via l&apos;autorisation de localisation du système, et retirable à tout moment</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>Données de joueurs mineurs</h2>
        <p>
          Les profils accessibles dans BBall peuvent concerner des joueurs mineurs ; ils peuvent notamment
          comporter une date de naissance et des statistiques ou résultats sportifs. L&apos;application ne comporte
          pas de vérification d&apos;âge permettant de distinguer automatiquement les joueurs majeurs des mineurs.
        </p>
        <p>
          Ces données sont utilisées uniquement pour fournir les fonctionnalités sportives décrites ci-dessus.
          Un parent ou représentant légal peut contacter l&apos;éditeur pour demander des informations sur les
          données d&apos;un mineur, leur rectification ou leur suppression. L&apos;éditeur pourra demander les éléments
          strictement nécessaires pour vérifier l&apos;identité et l&apos;autorité du demandeur. N&apos;envoyez jamais de
          mot de passe par e-mail.
        </p>

        <h2>Destinataires et hébergement</h2>
        <p>
          Les données nécessaires au fonctionnement de l&apos;application sont transmises au serveur de BBall, à
          notre serveur <strong>AlwaysData</strong>. Le serveur reçoit les identifiants envoyés
          pour la connexion, les demandes de données sportives et les informations techniques décrites ci-dessus.
          Les journaux des requêtes et des erreurs ne peuvent être consultés que par les personnes autorisées à
          administrer le service.
        </p>
        <p>
          Le serveur est hébergé par <strong>Alwaysdata</strong>, qui traite techniquement les requêtes en tant
          qu&apos;hébergeur. Les données sont hébergées en France et ne sont pas transférées en dehors de l&apos;Union
          européenne.
        </p>
        <p>Les données ne sont pas vendues et ne sont pas utilisées à des fins publicitaires.</p>

        <h2>Durées de conservation</h2>
        <p>
          <strong>Sur l&apos;appareil :</strong> les informations de session et les contenus mis en cache restent
          enregistrés jusqu&apos;à leur suppression par l&apos;application ou jusqu&apos;à la déconnexion. La déconnexion
          supprime les données de session et les caches gérés par l&apos;application.
        </p>
        <p>
          <strong>Sur le serveur :</strong>
        </p>
        <ul>
          <li>
            <strong>Comptes inactifs :</strong> le compte et les données qui lui sont associées (profil du joueur,
            licence, statistiques et résultats sportifs) sont supprimés après <strong>deux ans sans connexion</strong>.
          </li>
          <li>
            <strong>Joueurs sans compte :</strong> les données nominatives d&apos;un joueur qui n&apos;a pas de compte
            sont supprimées ou anonymisées au plus tard <strong>deux saisons après son départ du club</strong>. Les
            statistiques anonymisées (scores, totaux d&apos;équipe) peuvent être conservées, car elles ne permettent
            plus d&apos;identifier le joueur.
          </li>
          <li>
            <strong>Journaux techniques :</strong> les journaux des requêtes et des erreurs, y compris les
            informations de localisation éventuelles, sont supprimés après <strong>une semaine</strong>.
          </li>
        </ul>

        <h2>Sécurité</h2>
        <p>
          Les échanges entre l&apos;application et le serveur sont chiffrés (HTTPS). Le mot de passe n&apos;est pas
          conservé dans le stockage local de l&apos;application. Les autres données mises en cache sont stockées dans
          l&apos;espace privé de l&apos;application sur l&apos;appareil, inaccessible aux autres applications ; l&apos;application
          n&apos;y ajoute pas de chiffrement supplémentaire. L&apos;accès aux données et aux journaux du serveur est
          réservé aux personnes chargées d&apos;administrer le service.
        </p>

        <h2>Vos droits</h2>
        <p>
          Conformément au RGPD et à la loi Informatique et Libertés, vous disposez d&apos;un droit d&apos;accès, de
          rectification, d&apos;effacement, de limitation et de portabilité de vos données, ainsi que d&apos;un droit
          d&apos;opposition aux traitements fondés sur l&apos;intérêt légitime. Vous pouvez retirer à tout moment votre
          consentement à la localisation, sans que cela remette en cause la licéité des traitements effectués
          auparavant.
        </p>
        <p>
          <strong>Suppression du compte et des données :</strong> écrivez à{" "}
          <a href="mailto:romain-g17@hotmail.fr">romain-g17@hotmail.fr</a> avec l&apos;objet « Suppression des
          données BBall », en indiquant le nom d&apos;utilisateur ou le numéro de licence concerné, sans envoyer
          votre mot de passe. Un parent ou représentant légal peut faire cette demande pour un mineur, sous
          réserve d&apos;une vérification proportionnée de son autorité.
        </p>
        <p>
          La déconnexion supprime les données locales gérées par l&apos;application, mais pas les données du serveur.
          Désinstaller l&apos;application ne constitue pas non plus une demande de suppression des données du serveur.
        </p>
        <p>
          Les demandes sont traitées dans un délai d&apos;<strong>un mois</strong> à compter de leur réception.
        </p>
        <p>
          Si vous estimez, après nous avoir contactés, que vos droits ne sont pas respectés, vous pouvez
          introduire une réclamation auprès de la <strong>CNIL</strong> (Commission nationale de l&apos;informatique
          et des libertés) :{" "}
          <a target="_blank" rel="noopener noreferrer" href="https://www.cnil.fr">
            www.cnil.fr
          </a>
          .
        </p>

        <h2>Modifications</h2>
        <p>
          Cette politique sera mise à jour si les traitements de données de BBall évoluent. La date de dernière
          mise à jour est indiquée en haut de cette page.
        </p>
      </main>
      <footer className={styles.footer}>© 2026 GProd – BBall</footer>
    </div>
  );
}