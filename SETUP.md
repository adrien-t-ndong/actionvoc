# Setup ActionVoc

## 1. Installer les dépendances
```bash
npm install
```

## 2. Remplir les variables d'environnement
Édite le fichier `.env.local` avec tes clés API :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb...
OPENAI_API_KEY=sk-...
RESEND_API_KEY=re_...
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 3. Configurer Supabase
1. Crée un projet sur [supabase.com](https://supabase.com)
2. Va dans **SQL Editor** et exécute le fichier `supabase/schema.sql`
3. Va dans **Storage** → **New bucket** → nom : `audio-recordings` → coche **Public bucket**
4. Récupère tes clés dans **Settings → API**

## 4. Configurer Resend
1. Crée un compte sur [resend.com](https://resend.com)
2. Vérifie ton domaine ou utilise l'adresse test `onboarding@resend.dev`
3. Génère une API key

## 5. Configurer Stripe
1. Crée un compte sur [stripe.com](https://stripe.com)
2. Récupère tes clés test dans **Developers → API keys**
3. Pour les webhooks en local, installe Stripe CLI :
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. Copie le webhook secret affiché et mets-le dans `STRIPE_WEBHOOK_SECRET`

## 6. Lancer en développement
```bash
npm run dev
```
→ Ouvre [http://localhost:3000](http://localhost:3000)

## 7. Déployer sur Vercel
```bash
npm install -g vercel
vercel deploy
```
Puis configure les variables d'environnement dans le dashboard Vercel.

Pour les webhooks Stripe en production, ajoute l'URL :
`https://your-app.vercel.app/api/stripe/webhook`

## Architecture

```
app/
  (auth)/         → Pages login/signup (pas de navbar)
  (app)/          → Pages protégées avec navbar
    record/       → Nouvel enregistrement
    meetings/     → Liste + détail des réunions
    actions/      → Toutes les tâches
  api/
    analyze/      → Pipeline Whisper + GPT-4o
    send-summary/ → Envoi email résumé via Resend
    send-reminders/ → Rappels overdue via Resend
    stripe/       → Checkout + webhook
```

## Stack
- **Next.js 14** App Router + TypeScript
- **Supabase** Auth + PostgreSQL + Storage
- **OpenAI** Whisper (transcription) + GPT-4o (analyse)
- **Resend** Emails transactionnels
- **Stripe** Paiements SaaS
- **Tailwind CSS** Styling
