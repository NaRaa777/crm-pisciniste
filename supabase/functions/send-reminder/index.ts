import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

type ResendErrorJson = { message?: string }

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Méthode non autorisée.' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = (await req.json()) as Record<string, unknown>
    const to = typeof body.to === 'string' ? body.to.trim() : ''
    const clientNom = typeof body.clientNom === 'string' ? body.clientNom.trim() : ''
    const chantierTitre = typeof body.chantierTitre === 'string' ? body.chantierTitre.trim() : ''
    const montantRaw = body.montant
    const montant =
      typeof montantRaw === 'number' ? montantRaw : Number(typeof montantRaw === 'string' ? montantRaw : NaN)
    const dateFacturation =
      typeof body.dateFacturation === 'string' && body.dateFacturation.trim()
        ? body.dateFacturation.trim()
        : 'Non renseignée'

    if (!to || !clientNom || !chantierTitre) {
      return new Response(JSON.stringify({ error: 'Champs requis manquants (to, clientNom, chantierTitre).' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!Number.isFinite(montant)) {
      return new Response(JSON.stringify({ error: 'Montant invalide.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('RESEND_API_KEY')
    if (!apiKey?.trim()) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY non configurée (secrets Supabase).' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const from = Deno.env.get('RESEND_FROM')?.trim() || 'CRM Perso <onboarding@resend.dev>'

    const montantStr = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(montant)

    const subject = `Rappel de paiement — ${chantierTitre}`

    const textBody = [
      'Bonjour,',
      '',
      `Nous vous rappelons qu’un paiement est en attente pour le chantier « ${chantierTitre} ».`,
      '',
      `Client : ${clientNom}`,
      `Montant dû : ${montantStr}`,
      `Date de facturation : ${dateFacturation}`,
      '',
      'Merci de procéder au règlement ou de nous contacter en cas de question.',
      '',
      'Cordialement',
    ].join('\n')

    const htmlBody = `<p>Bonjour,</p>
<p>Nous vous rappelons qu’un paiement est en attente pour le chantier <strong>${escapeHtml(chantierTitre)}</strong>.</p>
<ul>
<li><strong>Client :</strong> ${escapeHtml(clientNom)}</li>
<li><strong>Montant dû :</strong> ${escapeHtml(montantStr)}</li>
<li><strong>Date de facturation :</strong> ${escapeHtml(dateFacturation)}</li>
</ul>
<p>Merci de procéder au règlement ou de nous contacter en cas de question.</p>
<p>Cordialement</p>`

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text: textBody,
        html: htmlBody,
      }),
    })

    const json = (await res.json().catch(() => ({}))) as ResendErrorJson

    if (!res.ok) {
      const msg = json.message ?? res.statusText ?? 'Erreur Resend'
      return new Response(JSON.stringify({ error: msg }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
