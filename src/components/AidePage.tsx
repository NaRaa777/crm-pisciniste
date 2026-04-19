import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

type FaqItem = {
  id: string
  q: string
  a: string
}

type FaqSection = {
  title: string
  intro: string
  items: FaqItem[]
}

const FAQ_SECTIONS: FaqSection[] = [
  {
    title: 'Premiers pas',
    intro: 'Connexion, navigation générale et paramètres de base.',
    items: [
      {
        id: 'start-login',
        q: 'Comment me connecter pour la première fois ?',
        a: 'Sur la page de connexion, saisissez votre e-mail et votre mot de passe puis cliquez sur "Se connecter". Si votre entreprise vous a créé un compte, utilisez exactement la même adresse e-mail. En cas de message d’erreur, vérifiez d’abord les majuscules/minuscules du mot de passe.',
      },
      {
        id: 'start-nav',
        q: 'Comment me repérer dans l’application ?',
        a: 'La barre de gauche contient les pages principales : Dashboard, Planning, Chantiers, Facturation, Devis, Analytics, Clients, Paramètres et Aide. Cliquez simplement sur un menu pour changer d’écran. Sur mobile, utilisez la barre en bas.',
      },
      {
        id: 'start-settings',
        q: 'Où modifier mon nom, mon e-mail ou le thème clair/sombre ?',
        a: 'Ouvrez "Paramètres". Vous pouvez y mettre à jour vos informations de profil et choisir le thème visuel. Si vous partagez un appareil, pensez à vous déconnecter après usage.',
      },
    ],
  },
  {
    title: 'Clients',
    intro: 'Créer et maintenir un fichier client propre.',
    items: [
      {
        id: 'clients-add',
        q: 'Comment ajouter un nouveau client rapidement ?',
        a: 'Allez dans "Clients" puis cliquez sur "Nouveau client", ou utilisez "Ajouter un client" dans la sidebar. Remplissez au minimum le nom, puis ajoutez téléphone et e-mail pour faciliter les relances.',
      },
      {
        id: 'clients-edit',
        q: 'Comment modifier une fiche client ?',
        a: 'Dans la liste des clients, cliquez sur la ligne du client puis sur "Modifier". Mettez à jour les informations et enregistrez. Les devis/factures liés gardent l’historique, mais les nouvelles éditions prendront les données récentes.',
      },
      {
        id: 'clients-delete',
        q: 'Comment supprimer un client sans faire d’erreur ?',
        a: 'Ouvrez la fiche client puis cliquez sur "Supprimer". Avant de confirmer, vérifiez si des chantiers, devis ou factures sont liés à ce client. Si vous avez un doute, archivez les données en export PDF avant suppression.',
      },
    ],
  },
  {
    title: 'Chantiers',
    intro: 'Suivi opérationnel des projets terrain.',
    items: [
      {
        id: 'sites-create',
        q: 'Comment créer un chantier ?',
        a: 'Dans "Chantiers", cliquez sur "Nouveau chantier". Associez le chantier au bon client, renseignez un titre clair, une échéance et un statut de départ. Un bon nom de chantier vous fera gagner du temps ensuite.',
      },
      {
        id: 'sites-progress',
        q: 'Comment suivre l’avancement au fil des semaines ?',
        a: 'Mettez à jour régulièrement le statut et l’avancement dans la fiche chantier. Utilisez "En cours", "Terminé" ou "En retard" au bon moment : ces statuts alimentent aussi vos indicateurs Analytics.',
      },
      {
        id: 'sites-files',
        q: 'Comment ajouter des photos ou des fichiers liés au chantier ?',
        a: 'Depuis la fiche chantier, utilisez la zone pièces jointes si elle est disponible dans votre version. Si ce n’est pas encore activé, conservez les liens vers vos documents (Drive, Dropbox, etc.) dans les notes du chantier pour centraliser l’accès.',
      },
    ],
  },
  {
    title: 'Devis',
    intro: 'Du chiffrage à l’acceptation client.',
    items: [
      {
        id: 'quote-create',
        q: 'Comment créer un devis correctement ?',
        a: 'Cliquez sur "Devis rapide" ou ouvrez la page "Devis". Sélectionnez le client et le chantier, puis ajoutez vos lignes (désignation, quantité, prix). Vérifiez TVA, total HT et TTC avant de sauvegarder.',
      },
      {
        id: 'quote-lines',
        q: 'Comment ajouter des lignes sans me tromper dans les montants ?',
        a: 'Ajoutez chaque prestation sur une ligne séparée. Renseignez quantité et prix unitaire ; l’application calcule les totaux automatiquement. Relisez le total TTC avant envoi pour éviter les oublis.',
      },
      {
        id: 'quote-send-sign',
        q: 'Comment envoyer le devis et gérer la signature électronique ?',
        a: 'Depuis un devis enregistré, utilisez l’action d’envoi (email/PDF selon votre configuration). Si votre process utilise la signature électronique, suivez le statut du devis : "envoyé", "signé" ou "accepté". Mettez à jour ce statut dès réception.',
      },
    ],
  },
  {
    title: 'Facturation',
    intro: 'Transformer le travail réalisé en encaissement.',
    items: [
      {
        id: 'invoice-from-quote',
        q: 'Comment créer une facture à partir d’un devis accepté ?',
        a: 'Ouvrez le devis concerné puis utilisez "Convertir en facture" (si disponible). Les informations principales sont reprises automatiquement. Vérifiez la date, les montants et le client avant validation finale.',
      },
      {
        id: 'invoice-status',
        q: 'À quoi servent les statuts de paiement ?',
        a: 'Les statuts indiquent l’état réel d’encaissement : non payé, partiel ou payé. Ils pilotent vos montants en attente et vos tableaux Analytics. Pensez à les mettre à jour dès qu’un règlement arrive.',
      },
      {
        id: 'invoice-reminders',
        q: 'Comment faire les relances sans oublier personne ?',
        a: 'Filtrez les factures non payées dans "Facturation", triez par date d’émission puis relancez en priorité les plus anciennes. Notez chaque relance dans les commentaires internes pour garder une trace claire.',
      },
    ],
  },
  {
    title: 'Planning',
    intro: 'Organisation des tâches quotidiennes.',
    items: [
      {
        id: 'plan-add',
        q: 'Comment ajouter une tâche au planning ?',
        a: 'Depuis "Planning", cliquez sur "Nouvelle tâche". Donnez un titre court, une date d’échéance, puis liez la tâche à un chantier si possible. Une tâche bien nommée est plus facile à retrouver.',
      },
      {
        id: 'plan-assign',
        q: 'Comment assigner une tâche à une personne ?',
        a: 'Dans la fiche de tâche, renseignez le responsable. Si vous êtes seul, mettez votre nom pour garder un suivi propre. Si vous travaillez en équipe, évitez les tâches "sans responsable".',
      },
      {
        id: 'plan-status',
        q: 'Comment changer le statut d’une tâche ?',
        a: 'Ouvrez la tâche puis passez son état de "planifiée" à "en cours", puis "terminée". Si un blocage arrive, mettez-la en "retard" et ajoutez une note courte expliquant le problème.',
      },
    ],
  },
  {
    title: 'Analytics',
    intro: 'Lecture simple des chiffres clés pour piloter l’activité.',
    items: [
      {
        id: 'analytics-kpis',
        q: 'Que signifient les KPIs principaux ?',
        a: 'Les KPIs résument l’activité : volume de production, chantiers actifs, paiements en attente et chiffre d’affaires mensuel. Regardez-les chaque semaine pour voir rapidement si vous êtes en avance ou en retard.',
      },
      {
        id: 'analytics-dashboard',
        q: 'Comment lire le tableau de bord sans être expert ?',
        a: 'Commencez par les montants en attente et les tâches en retard : ce sont les urgences. Ensuite, regardez la tendance du CA et la conversion des devis. L’objectif est de décider les priorités, pas de faire des calculs compliqués.',
      },
      {
        id: 'analytics-graphs',
        q: 'Comment comprendre les graphiques (CA, retards, conversion) ?',
        a: 'Si la courbe CA monte, l’activité encaissée progresse. Si les barres "retard" augmentent, il faut réorganiser planning et ressources. Si la conversion devis baisse, retravaillez vos offres ou vos relances commerciales.',
      },
    ],
  },
  {
    title: 'Problèmes fréquents',
    intro: 'Solutions rapides avant de perdre du temps.',
    items: [
      {
        id: 'issue-loading',
        q: 'L’application ne charge pas ou reste bloquée : que faire ?',
        a: 'Vérifiez d’abord votre connexion internet. Ensuite, rechargez la page (Ctrl+R / Cmd+R). Si le problème persiste, déconnectez-vous puis reconnectez-vous. En dernier recours, videz le cache du navigateur.',
      },
      {
        id: 'issue-password',
        q: 'J’ai oublié mon mot de passe : comment récupérer l’accès ?',
        a: 'Sur l’écran de connexion, utilisez la procédure de récupération si elle est activée dans votre environnement. Sinon, contactez l’administrateur du compte Supabase/CRM pour réinitialiser votre mot de passe.',
      },
      {
        id: 'issue-missing-data',
        q: 'Mes données semblent avoir disparu : que vérifier ?',
        a: 'Contrôlez d’abord les filtres (dates, statuts, recherche) : ils masquent souvent des éléments. Vérifiez aussi que vous êtes sur la bonne page (Devis, Facturation, Chantiers). Si besoin, actualisez puis reconnectez-vous.',
      },
      {
        id: 'issue-sync',
        q: 'J’ai une erreur d’enregistrement : comment éviter de perdre mon travail ?',
        a: 'Copiez votre texte important (notes, description) avant de fermer la fenêtre. Vérifiez votre connexion, puis réessayez. Si l’erreur revient, faites une capture d’écran du message et transmettez-la au support technique.',
      },
    ],
  },
]

export function AidePage() {
  const [openId, setOpenId] = useState<string>('start-login')

  return (
    <div className="space-y-8">
      <section
        className="rounded-[12px] border border-border bg-surface p-6 shadow-[var(--shadow-card)]"
        aria-labelledby="faq-heading"
      >
        <h2 id="faq-heading" className="text-lg font-semibold text-text">
          FAQ
        </h2>
        <div className="mt-5 space-y-6">
          {FAQ_SECTIONS.map((section) => (
            <article
              key={section.title}
              className="rounded-[12px] border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/5 p-4"
            >
              <h3 className="text-base font-semibold text-text">{section.title}</h3>
              <p className="mt-1 text-sm text-text-muted">{section.intro}</p>

              <ul className="mt-4 divide-y divide-border/80 rounded-[10px] border border-border/70 bg-black-contrast/15">
                {section.items.map((item) => {
                  const open = openId === item.id
                  return (
                    <li key={item.id} className="px-2 py-1">
                      <button
                        type="button"
                        onClick={() => setOpenId(open ? '' : item.id)}
                        className="flex w-full items-start justify-between gap-3 rounded-[10px] px-2 py-3 text-left text-sm font-semibold text-text outline-none transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-accent/60"
                        aria-expanded={open}
                      >
                        <span>{item.q}</span>
                        <ChevronDown
                          className={[
                            'h-5 w-5 shrink-0 text-primary transition duration-200',
                            open ? 'rotate-180' : '',
                          ].join(' ')}
                          strokeWidth={1.75}
                        />
                      </button>
                      {open ? <p className="px-2 pb-3 text-sm leading-relaxed text-text-muted">{item.a}</p> : null}
                    </li>
                  )
                })}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
