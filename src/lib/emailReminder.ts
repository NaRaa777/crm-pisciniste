import { supabase } from './supabase'

export type PaymentReminderPayload = {
  to: string
  chantierNom: string
  clientNom: string
  montantDu: number
  dateFacturation: string
}

/** Aligné sur les filtres notifications (unpaid, En attente). */
export function isPaymentReminderEligible(statut: unknown): boolean {
  const s = String(statut ?? '').trim().toLowerCase()
  return s === 'unpaid' || s === 'en attente'
}

export async function sendPaymentReminderEmail(
  payload: PaymentReminderPayload,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await supabase.functions.invoke('send-reminder', {
    body: {
      to: payload.to,
      clientNom: payload.clientNom,
      montant: payload.montantDu,
      chantierTitre: payload.chantierNom,
      dateFacturation: payload.dateFacturation,
    },
  })

  if (error) {
    return { ok: false, error: error.message || 'Impossible d’appeler la fonction d’envoi.' }
  }

  if (data && typeof data === 'object') {
    const d = data as { success?: boolean; error?: unknown }
    if (d.error != null && d.error !== '') {
      return { ok: false, error: String(d.error) }
    }
    if (d.success === true) {
      return { ok: true }
    }
  }

  return { ok: false, error: 'Réponse inattendue du serveur.' }
}
