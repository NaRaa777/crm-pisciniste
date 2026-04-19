import { useMemo, useState } from 'react'

type PoolFilter = 'tous' | 'Coque' | 'Béton' | 'Rénovation'

type Item = {
  id: string
  titre: string
  type: 'Coque' | 'Béton' | 'Rénovation'
  image: string
}

const MOCK: Item[] = [
  { id: '1', titre: 'Liner bleu azur', type: 'Coque', image: 'https://picsum.photos/seed/pool1/640/400' },
  { id: '2', titre: 'Bassin débordement', type: 'Béton', image: 'https://picsum.photos/seed/pool2/640/400' },
  { id: '3', titre: 'Rénovation liner', type: 'Rénovation', image: 'https://picsum.photos/seed/pool3/640/400' },
  { id: '4', titre: 'Coque 8×4', type: 'Coque', image: 'https://picsum.photos/seed/pool4/640/400' },
  { id: '5', titre: 'Piscine béton gris', type: 'Béton', image: 'https://picsum.photos/seed/pool5/640/400' },
  { id: '6', titre: 'Résine après chantier', type: 'Rénovation', image: 'https://picsum.photos/seed/pool6/640/400' },
]

export function PortfolioPage() {
  const [filtre, setFiltre] = useState<PoolFilter>('tous')

  const list = useMemo(() => {
    if (filtre === 'tous') return MOCK
    return MOCK.filter((x) => x.type === filtre)
  }, [filtre])

  return (
    <section aria-label="Portfolio" className="space-y-6">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {(['tous', 'Coque', 'Béton', 'Rénovation'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFiltre(f)}
            className={[
              'rounded-full border px-3.5 py-1.5 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-primary/50',
              filtre === f
                ? 'border-primary bg-primary/25 text-white shadow-[0_0_20px_rgba(59,130,246,0.28)]'
                : 'border-[rgba(59,130,246,0.4)] bg-black/45 text-slate-300 hover:border-primary/55 hover:bg-primary/15 hover:text-white',
            ].join(' ')}
          >
            {f === 'tous' ? 'Tous' : f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <article
            key={p.id}
            className="overflow-hidden rounded-[12px] border border-border bg-surface shadow-[var(--shadow-card)]"
          >
            <div className="aspect-[16/10] w-full overflow-hidden bg-black-contrast/30">
              <img
                src={p.image}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                width={640}
                height={400}
              />
            </div>
            <div className="p-3">
              <div className="truncate text-sm font-semibold text-text">{p.titre}</div>
              <div className="mt-1 text-xs text-text-muted">{p.type}</div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
