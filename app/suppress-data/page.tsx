import type { Metadata } from "next";
import styles from "../legal-pages.module.css";

export const metadata: Metadata = {
  title: "Supprimer son compte – BBall",
  description: "Demander la suppression de votre compte BBall et des données associées.",
};

const deletionRequestHref =
  "mailto:romain-g17@hotmail.fr?subject=Suppression%20des%20donn%C3%A9es%20BBall&body=Bonjour%2C%0A%0AJe%20demande%20la%20suppression%20de%20mon%20compte%20BBall%20et%20des%20donn%C3%A9es%20associ%C3%A9es.%0A%0ANom%20d%27utilisateur%20ou%20num%C3%A9ro%20de%20licence%20%3A%20%0A%0AMerci.";

export default function SuppressDataPage() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Supprimer votre compte BBall</h1>
        <p>
          Application <strong>BBall</strong> – éditeur <strong>GProd</strong>
        </p>

        <p>
          Vous pouvez demander à tout moment la suppression de votre compte BBall et des données qui lui sont
          associées sur nos serveurs.
        </p>

        <h2>Comment faire votre demande</h2>
        <ol className={styles.steps}>
          <li>
            Envoyez un e-mail à <a href={deletionRequestHref}>romain-g17@hotmail.fr</a> avec l&apos;objet{" "}
            <strong>« Suppression des données BBall »</strong>.
          </li>
          <li>
            Indiquez votre <strong>nom d&apos;utilisateur</strong> ou votre <strong>numéro de licence</strong>.{" "}
            <strong>N&apos;envoyez jamais votre mot de passe.</strong>
          </li>
          <li>Nous pourrons vous demander une vérification simple pour confirmer que vous êtes bien le titulaire du compte.</li>
          <li>
            Vous recevez une confirmation une fois la suppression effectuée, dans un délai maximum d&apos;
            <strong>un mois</strong>.
          </li>
        </ol>
        <a className={styles.button} href={deletionRequestHref}>
          Envoyer ma demande de suppression
        </a>

        <p className={styles.note}>
          Pour un joueur mineur, la demande peut être faite par un parent ou représentant légal. Nous pourrons
          demander les éléments strictement nécessaires pour vérifier son autorité.
        </p>

        <h2>Données supprimées</h2>
        <ul>
          <li>Le compte : nom d&apos;utilisateur, identifiants et informations de connexion.</li>
          <li>Le profil du joueur : numéro de licence, nom, prénom, civilité, date de naissance, équipe et photo.</li>
          <li>
            Les données sportives associées : statistiques individuelles, examens sportifs et résultats de tests
            physiques.
          </li>
        </ul>

        <h2>Données conservées</h2>
        <ul>
          <li>
            <strong>Journaux techniques</strong> (requêtes, erreurs, localisation éventuelle) : ils ne sont pas
            supprimés immédiatement, mais sont effacés automatiquement au bout d&apos;<strong>une semaine</strong> au
            maximum.
          </li>
          <li>
            <strong>Résultats collectifs anonymisés</strong> (scores et totaux d&apos;équipe) : ils peuvent être
            conservés, car ils ne permettent plus de vous identifier.
          </li>
        </ul>

        <h2>À savoir</h2>
        <ul>
          <li>
            La déconnexion efface les données stockées sur votre téléphone, mais <strong>pas</strong> celles de
            nos serveurs.
          </li>
          <li>Désinstaller l&apos;application ne vaut pas demande de suppression.</li>
          <li>
            Sans demande de votre part, les comptes inactifs depuis <strong>deux ans</strong> sont supprimés
            automatiquement.
          </li>
        </ul>

        <p>
          Pour en savoir plus, consultez notre <a href="/privacy">politique de confidentialité</a>.
        </p>
      </main>
      <footer className={styles.footer}>© 2026 GProd – BBall</footer>
    </div>
  );
}