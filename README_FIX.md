# Neuroshost Billing V1.0.0 — Discord / Announcements / Tickets FIX

Correctifs inclus :

- Correction TypeScript des pages de création et modification des annonces.
- Import de récupération des rôles Discord dans les formulaires d'annonces.
- Sélection multiple des rôles à mentionner, avec présélection lors de l'édition.
- Les annonces Discord n'envoient plus le contenu HTML de l'annonce.
- Discord reçoit un embed « Une nouvelle annonce a été publiée » avec un lien vers l'annonce Web.
- Les rôles sélectionnés sont mentionnés au-dessus de l'embed et transmis via `allowed_mentions.roles`.
- Enregistrement des commandes Discord après connexion du bot pour fiabiliser le déploiement de `/ticket`.
- `/ticket` affiche un embed et un bouton « Ouvrir un ticket ».
- Les tickets Discord sont enregistrés en MariaDB et visibles dans l'administration Web.
- Les messages Discord sont synchronisés dans le ticket Web.
- Les réponses des administrateurs depuis le Web sont envoyées dans le salon Discord du ticket.
- Le rôle Client Discord est attribué automatiquement selon l'ID configuré dans l'administration.

Installation :

```bash
npm install
npm run build
npm start
```

Bot :

```bash
npm run bot
```

Le bot doit avoir les permissions nécessaires et l'intent `Message Content` activé dans le Discord Developer Portal pour synchroniser les messages des tickets.
