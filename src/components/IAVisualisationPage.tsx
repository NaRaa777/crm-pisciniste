import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Box,
  Check,
  Circle,
  Download,
  Droplets,
  Eraser,
  Layers2,
  Paintbrush,
  RectangleHorizontal,
  RefreshCw,
  Ruler,
  Share2,
  Waves,
} from 'lucide-react'

const STEPS = ['Upload', 'Masquage', 'Configuration', 'Génération', 'Résultat'] as const

const MASK_COLOR = 'rgba(239,68,68,0.5)'

const GEN_MESSAGES = [
  'Analyse de la photo...',
  'Application du masque...',
  'Génération du rendu IA...',
  'Finalisation...',
] as const

const GEN_DURATION_MS = 5000

type PoolType = 'coque' | 'beton' | 'liner'
type PoolShape = 'rect' | 'ovale' | 'haricot' | 'surmesure'
type WaterColor = 'bleuclair' | 'bleufonce' | 'turquoise' | 'verteau'

const POOL_TYPES: { id: PoolType; label: string; Icon: typeof Circle }[] = [
  { id: 'coque', label: 'Coque', Icon: Circle },
  { id: 'beton', label: 'Béton', Icon: Box },
  { id: 'liner', label: 'Liner', Icon: Layers2 },
]

const POOL_SHAPES: { id: PoolShape; label: string; Icon: typeof RectangleHorizontal }[] = [
  { id: 'rect', label: 'Rectangulaire', Icon: RectangleHorizontal },
  { id: 'ovale', label: 'Ovale', Icon: Circle },
  { id: 'haricot', label: 'Haricot', Icon: Waves },
  { id: 'surmesure', label: 'Sur-mesure', Icon: Ruler },
]

const WATER_SWATCHES: { id: WaterColor; label: string; color: string }[] = [
  { id: 'bleuclair', label: 'Bleu clair', color: '#7dd3fc' },
  { id: 'bleufonce', label: 'Bleu foncé', color: '#0369a1' },
  { id: 'turquoise', label: 'Turquoise', color: '#2dd4bf' },
  { id: 'verteau', label: "Vert d'eau", color: '#14b8a6' },
]

function useObjectUrlRevoke(url: string | null) {
  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [url])
}

export function IAVisualisationPage() {
  const [step, setStep] = useState(0)
  const [maxReached, setMaxReached] = useState(0)

  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const maskCanvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)

  const [tool, setTool] = useState<'brush' | 'eraser'>('brush')
  const [brushSize, setBrushSize] = useState(20)

  const [poolType, setPoolType] = useState<PoolType>('coque')
  const [poolShape, setPoolShape] = useState<PoolShape>('rect')
  const [waterColor, setWaterColor] = useState<WaterColor>('bleuclair')

  const [genProgress, setGenProgress] = useState(0)
  const [genMessageIndex, setGenMessageIndex] = useState(0)

  useObjectUrlRevoke(imageUrl)

  const drawStroke = useCallback(
    (from: { x: number; y: number }, to: { x: number; y: number }) => {
      const canvas = maskCanvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = brushSize

      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out'
        ctx.strokeStyle = 'rgba(0,0,0,1)'
      } else {
        ctx.globalCompositeOperation = 'source-over'
        ctx.strokeStyle = MASK_COLOR
      }

      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      ctx.lineTo(to.x, to.y)
      ctx.stroke()
    },
    [brushSize, tool],
  )

  const drawDot = useCallback(
    (p: { x: number; y: number }) => {
      const canvas = maskCanvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out'
        ctx.fillStyle = 'rgba(0,0,0,1)'
      } else {
        ctx.globalCompositeOperation = 'source-over'
        ctx.fillStyle = MASK_COLOR
      }

      ctx.beginPath()
      ctx.arc(p.x, p.y, brushSize / 2, 0, Math.PI * 2)
      ctx.fill()
    },
    [brushSize, tool],
  )

  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = maskCanvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const sx = canvas.width / rect.width
    const sy = canvas.height / rect.height
    return {
      x: (clientX - rect.left) * sx,
      y: (clientY - rect.top) * sy,
    }
  }

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = getCanvasCoords(e.clientX, e.clientY)
    if (!p) return
    isDrawing.current = true
    lastPoint.current = p
    drawDot(p)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !lastPoint.current) return
    const p = getCanvasCoords(e.clientX, e.clientY)
    if (!p) return
    drawStroke(lastPoint.current, p)
    lastPoint.current = p
  }

  const endStroke = () => {
    isDrawing.current = false
    lastPoint.current = null
  }

  /** Efface le masque uniquement lors d’un nouvel upload (pas au retour d’étape). */
  useEffect(() => {
    if (!imageUrl) return
    const canvas = maskCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }, [imageUrl])

  /** Génération : progression + texte + passage auto à l’étape 5 */
  useEffect(() => {
    if (step !== 3) return

    setGenProgress(0)
    setGenMessageIndex(0)

    const start = performance.now()
    let raf = 0

    const tick = (now: number) => {
      const elapsed = now - start
      const p = Math.min(100, (elapsed / GEN_DURATION_MS) * 100)
      setGenProgress(p)
      const idx = Math.min(GEN_MESSAGES.length - 1, Math.floor(elapsed / 2000))
      setGenMessageIndex(idx)

      if (elapsed < GEN_DURATION_MS) {
        raf = requestAnimationFrame(tick)
      } else {
        setGenProgress(100)
        setGenMessageIndex(GEN_MESSAGES.length - 1)
        setStep(4)
        setMaxReached((r) => Math.max(r, 4))
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [step])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f || !f.type.startsWith('image/')) return
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    setImageUrl(URL.createObjectURL(f))
  }

  function goNext() {
    setStep((s) => {
      const n = Math.min(STEPS.length - 1, s + 1)
      setMaxReached((m) => Math.max(m, n))
      return n
    })
  }

  function goBack() {
    setStep((s) => Math.max(0, s - 1))
  }

  function resetFlow() {
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    setImageUrl(null)
    setStep(0)
    setMaxReached(0)
    setPoolType('coque')
    setPoolShape('rect')
    setWaterColor('bleuclair')
    setGenProgress(0)
    setGenMessageIndex(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleStepperClick(i: number) {
    if (i > maxReached) return
    setStep(i)
  }

  return (
    <section aria-label="IA Visualisation" className="space-y-6">
      <nav
        aria-label="Étapes"
        className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-[10px] bg-[#0a0a0a] p-1"
        role="tablist"
      >
        {STEPS.map((label, i) => {
          const isActive = i === step
          const isPast = i < step
          const isFuture = i > step

          return (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={i > maxReached}
              onClick={() => handleStepperClick(i)}
              className={[
                'inline-flex items-center gap-2 rounded-[8px] px-3 py-2 text-xs font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-accent/60',
                isActive
                  ? 'bg-black text-white'
                  : isPast
                    ? 'bg-transparent text-emerald-400 hover:text-emerald-300'
                    : 'bg-transparent text-zinc-500',
                isFuture ? 'cursor-not-allowed opacity-70' : '',
                i <= maxReached && !isActive ? 'cursor-pointer' : '',
              ].join(' ')}
            >
              {isPast ? <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" strokeWidth={2.5} /> : null}
              <span className="tabular-nums">{i + 1}.</span> {label}
            </button>
          )
        })}
      </nav>

      <div className="overflow-hidden rounded-[12px] border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
        <div key={step} className="ia-step-enter">
          {step === 0 ? (
            <div className="flex min-h-[320px] flex-col">
              <h2 className="text-sm font-semibold text-text">Étape 1 — Upload</h2>
              <p className="mt-1 text-sm text-text-muted">Glissez une photo de jardin ou cliquez pour parcourir.</p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={handleFileChange}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-6 flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-[12px] border-2 border-dashed border-primary/50 bg-black-contrast/15 px-6 py-14 text-center outline-none transition hover:border-primary hover:bg-black-contrast/25 focus-visible:ring-2 focus-visible:ring-accent/60"
              >
                <Droplets className="h-10 w-10 text-accent" strokeWidth={1.5} />
                <span className="text-sm font-medium text-text">Déposer la photo ici</span>
                <span className="text-xs text-text-muted">PNG, JPG jusqu’à 10 Mo</span>
              </button>

              {imageUrl ? (
                <p className="mt-3 text-center text-xs text-emerald-400/90">Image chargée — vous pouvez passer à l’étape suivante.</p>
              ) : null}

              <div className="mt-auto flex items-center justify-between gap-3 pt-8">
                <span className="text-xs text-zinc-600" />
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!imageUrl}
                  className="rounded-[10px] bg-primary px-5 py-2.5 text-sm font-semibold text-white outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent/60 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Suivant
                </button>
              </div>
            </div>
          ) : null}

          {step === 1 && imageUrl ? (
            <div className="flex min-h-[520px] flex-col gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Délimitez la zone piscine</h2>
                <p className="mt-1 text-sm text-text-muted">Dessinez sur la photo pour indiquer où sera installée la piscine</p>
              </div>

              <div className="overflow-x-auto pb-1">
                <div className="relative mx-auto h-[400px] w-[600px] max-w-full shrink-0 overflow-hidden rounded-[12px] border border-[rgba(59,130,246,0.15)] bg-black/40">
                  <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
                  <canvas
                    ref={maskCanvasRef}
                    width={600}
                    height={400}
                    className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={endStroke}
                    onPointerLeave={endStroke}
                    onPointerCancel={endStroke}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTool('brush')}
                  className={[
                    'inline-flex items-center gap-2 rounded-[10px] border px-3 py-2 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-accent/60',
                    tool === 'brush'
                      ? 'border-primary bg-primary/20 text-white'
                      : 'border-border bg-black-contrast/25 text-text-muted hover:bg-white/5',
                  ].join(' ')}
                >
                  <Paintbrush className="h-4 w-4" strokeWidth={2} />
                  Pinceau
                </button>
                <button
                  type="button"
                  onClick={() => setTool('eraser')}
                  className={[
                    'inline-flex items-center gap-2 rounded-[10px] border px-3 py-2 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-accent/60',
                    tool === 'eraser'
                      ? 'border-primary bg-primary/20 text-white'
                      : 'border-border bg-black-contrast/25 text-text-muted hover:bg-white/5',
                  ].join(' ')}
                >
                  <Eraser className="h-4 w-4" strokeWidth={2} />
                  Gomme
                </button>
                <label className="flex min-w-[180px] flex-1 items-center gap-3 text-sm text-text-muted">
                  <span className="whitespace-nowrap">Taille pinceau</span>
                  <input
                    type="range"
                    min={4}
                    max={80}
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="h-2 flex-1 cursor-pointer accent-primary"
                  />
                  <span className="tabular-nums text-text">{brushSize}px</span>
                </label>
              </div>

              <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                <button
                  type="button"
                  onClick={goBack}
                  className="rounded-[10px] px-4 py-2.5 text-sm font-medium text-text-muted outline-none transition hover:bg-white/5 hover:text-text focus-visible:ring-2 focus-visible:ring-accent/60"
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="rounded-[10px] bg-primary px-5 py-2.5 text-sm font-semibold text-white outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent/60"
                >
                  Suivant
                </button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="flex min-h-[480px] flex-col gap-8">
              <div>
                <h2 className="text-lg font-semibold text-white">Configurez votre piscine</h2>
                <p className="mt-1 text-sm text-text-muted">Choisissez le type, la forme et la teinte d’eau souhaitée.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Type</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {POOL_TYPES.map(({ id, label, Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPoolType(id)}
                        className={[
                          'flex flex-col items-center gap-3 rounded-[14px] border p-5 text-center outline-none transition focus-visible:ring-2 focus-visible:ring-accent/60',
                          poolType === id
                            ? 'border-primary bg-primary/15 shadow-[0_0_24px_rgba(59,130,246,0.2)] ring-1 ring-primary/40'
                            : 'border-border bg-black-contrast/20 hover:bg-white/[0.04]',
                        ].join(' ')}
                      >
                        <Icon className="h-8 w-8 text-accent" strokeWidth={1.5} />
                        <span className="text-sm font-semibold text-text">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Forme</p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {POOL_SHAPES.map(({ id, label, Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPoolShape(id)}
                        className={[
                          'flex flex-col items-center gap-3 rounded-[14px] border p-4 text-center outline-none transition focus-visible:ring-2 focus-visible:ring-accent/60',
                          poolShape === id
                            ? 'border-primary bg-primary/15 shadow-[0_0_24px_rgba(59,130,246,0.2)] ring-1 ring-primary/40'
                            : 'border-border bg-black-contrast/20 hover:bg-white/[0.04]',
                        ].join(' ')}
                      >
                        <Icon className="h-7 w-7 text-accent" strokeWidth={1.5} />
                        <span className="text-sm font-semibold text-text">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Couleur eau</p>
                  <div className="flex flex-wrap gap-4">
                    {WATER_SWATCHES.map(({ id, label, color }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setWaterColor(id)}
                        className={[
                          'flex flex-col items-center gap-2 rounded-[12px] border p-3 outline-none transition focus-visible:ring-2 focus-visible:ring-accent/60',
                          waterColor === id
                            ? 'border-primary ring-2 ring-primary/50'
                            : 'border-border hover:bg-white/[0.04]',
                        ].join(' ')}
                      >
                        <span
                          className="h-12 w-12 rounded-full border-2 border-white/20 shadow-inner"
                          style={{ backgroundColor: color }}
                        />
                        <span className="max-w-[88px] text-center text-xs font-medium text-text">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                <button
                  type="button"
                  onClick={goBack}
                  className="rounded-[10px] px-4 py-2.5 text-sm font-medium text-text-muted outline-none transition hover:bg-white/5 hover:text-text focus-visible:ring-2 focus-visible:ring-accent/60"
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="rounded-[10px] bg-primary px-5 py-2.5 text-sm font-semibold text-white outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent/60"
                >
                  Suivant
                </button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="flex min-h-[380px] flex-col items-center justify-center gap-8 py-8">
              <h2 className="text-lg font-semibold text-white">Génération en cours...</h2>

              <div className="ia-gen-pulse grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-primary to-accent">
                <div className="h-10 w-10 rounded-full bg-white/90 opacity-90" />
              </div>

              <div className="w-full max-w-md space-y-3">
                <div className="h-2.5 overflow-hidden rounded-full bg-black-contrast/40">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-primary transition-[width] duration-75 ease-linear"
                    style={{ width: `${genProgress}%` }}
                  />
                </div>
                <p className="text-center text-sm text-text-muted transition-opacity duration-300">
                  {GEN_MESSAGES[genMessageIndex]}
                </p>
              </div>
            </div>
          ) : null}

          {step === 4 && imageUrl ? (
            <div className="flex min-h-[420px] flex-col gap-8">
              <h2 className="text-center text-lg font-semibold text-white">Votre rendu est prêt !</h2>

              <div className="grid gap-6 md:grid-cols-2">
                <figure className="overflow-hidden rounded-[12px] border border-border">
                  <figcaption className="bg-black/40 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Avant
                  </figcaption>
                  <img src={imageUrl} alt="Photo originale" className="aspect-[4/3] w-full object-cover" />
                </figure>
                <figure className="overflow-hidden rounded-[12px] border border-border">
                  <figcaption className="bg-black/40 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Après
                  </figcaption>
                  <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-[#0a1628] to-[#0e1e35]">
                    <div className="absolute inset-0 flex items-center justify-center bg-cyan-500/10">
                      <span className="rounded-[10px] border border-cyan-400/40 bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-200">
                        Rendu IA
                      </span>
                    </div>
                  </div>
                </figure>
              </div>

              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-primary px-5 py-2.5 text-sm font-semibold text-white outline-none transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent/60"
                >
                  <Download className="h-4 w-4" strokeWidth={2} />
                  Télécharger le rendu
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-primary/45 bg-primary/10 px-5 py-2.5 text-sm font-semibold text-text outline-none transition hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-accent/60"
                >
                  <Share2 className="h-4 w-4" strokeWidth={2} />
                  Partager avec le client
                </button>
                <button
                  type="button"
                  onClick={resetFlow}
                  className="inline-flex items-center justify-center gap-2 rounded-[10px] px-5 py-2.5 text-sm font-medium text-text-muted outline-none transition hover:bg-white/5 hover:text-text focus-visible:ring-2 focus-visible:ring-accent/60"
                >
                  <RefreshCw className="h-4 w-4" strokeWidth={2} />
                  Nouvelle visualisation
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
