import type { NextConfig } from "next";

// Les images (logos, photos) sont servies par l'API : on autorise uniquement son hôte.
const apiUrl = new URL(process.env.BBALL_API_URL ?? "http://localhost:8000");
const isLocalApi = ["localhost", "127.0.0.1", "::1", "statmatch.alwaysdata.net"].includes(apiUrl.hostname);

const nextConfig: NextConfig = {
  // Dossier de build alternatif : le second serveur des tests e2e (journaux, back livré) cohabite avec le premier.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Un package-lock.json parasite existe plus haut dans l'arborescence : on fixe la racine du projet.
  turbopack: { root: __dirname },
  // `forbidden()` et `forbidden.tsx` (page « Accès refusé ») sont encore expérimentaux dans Next 16.
  experimental: { authInterrupts: true },
  images: {
    remotePatterns: [
      {
        protocol: apiUrl.protocol.replace(":", "") as "http" | "https",
        hostname: apiUrl.hostname,
        port: apiUrl.port,
        pathname: "/public/images/**",
      },
    ],
    // En développement, l'API tourne en local : sans cette option, Next refuse d'optimiser ses images.
    dangerouslyAllowLocalIP: isLocalApi,
  },
};

export default nextConfig;
