import { useEffect, useMemo, useState, useRef } from 'react'
import { api } from '@/shared/lib/api'
import type { Colaborador, Equipe, Setor, Competencia, ColaboradorCompetencia } from '@/shared/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/shared/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Users, Building2, Layers } from 'lucide-react'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useNavigate } from 'react-router-dom'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/shared/components/ui/command'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function HomeDiretor() {
  const navigate = useNavigate()
  const [setores, setSetores] = useState<Setor[]>([])
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [competencias, setCompetencias] = useState<Competencia[]>([])
  const [competenciasByColab, setCompetenciasByColab] = useState<Record<number, ColaboradorCompetencia[]>>({})
  const [loading, setLoading] = useState(true)
  const [monthsRange, setMonthsRange] = useState<6 | 12 | 36>(6)
  const [setorFilter, setSetorFilter] = useState<number | 'all'>('all')
  const [selectedCompetenciaId, setSelectedCompetenciaId] = useState<number | 'all'>('all')
  const [showCompetenciasDropdown, setShowCompetenciasDropdown] = useState(false)
  const [competenciaQuery, setCompetenciaQuery] = useState('')
  const competenciasRef = useRef<HTMLDivElement | null>(null)
  const [showSetoresDropdown, setShowSetoresDropdown] = useState(false)
  const [setorQuery, setSetorQuery] = useState('')
  const setoresRef = useRef<HTMLDivElement | null>(null)
  const [sparklineTooltip, setSparklineTooltip] = useState<{ x: number; y: number; label: string; value: number } | null>(null)
  const sparklineRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [s, e, c, comps] = await Promise.all([
        api.get<Setor[]>('/setores'),
        api.get<Equipe[]>('/equipes'),
        api.get<Colaborador[]>('/colaboradores'),
        api.get<Competencia[]>('/competencias'),
      ])
      const rawSetores = Array.isArray(s.data) ? (s.data as any[]) : []
      const normSetores: Setor[] = rawSetores.map((x) => ({
        id_setor: Number(x?.id_setor ?? x?.id ?? x?.idSetor ?? 0),
        nome_setor: String(x?.nome_setor ?? x?.nome ?? ''),
        desc_setor: x?.desc_setor ?? x?.descricao ?? null,
        status: Boolean(x?.status ?? true),
        id_diretor: x?.id_diretor ?? x?.diretorId ?? null,
        diretor: undefined,
      }))

      const rawEquipes = Array.isArray(e.data) ? (e.data as any[]) : []
      const normEquipes: Equipe[] = rawEquipes.map((x) => ({
        id_equipe: Number(x?.id_equipe ?? x?.id ?? 0),
        nome_equipe: String(x?.nome_equipe ?? x?.nome ?? ''),
        id_setor: Number(x?.id_setor ?? x?.setorId ?? 0),
        setor: undefined,
        status: Boolean(x?.status ?? true),
      }))

      const rawColabs = Array.isArray(c.data) ? (c.data as any[]) : []
      const normColabs: Colaborador[] = rawColabs.map((x) => ({
        id_colaborador: Number(x?.id_colaborador ?? x?.id ?? 0),
        cpf: x?.cpf ?? null,
        data_nasci: x?.data_nasci ?? x?.dataNascimento ?? null,
        nome: String(x?.nome ?? ''),
        sobrenome: String(x?.sobrenome ?? ''),
        genero: Boolean(x?.genero ?? false),
        email: String(x?.email ?? ''),
        senha: String(x?.senha ?? ''),
        status: Boolean(x?.status ?? true),
        role: String(x?.role ?? '') as any,
        avatar: x?.avatar ?? null,
        capa: x?.capa ?? null,
        criado_em: x?.criado_em ?? x?.criadoEm ?? null,
        atualizado_em: x?.atualizado_em ?? x?.atualizadoEm ?? null,
        id_equipe: Number(x?.id_equipe ?? x?.idEquipe ?? 0),
        id_cargo: Number(x?.id_cargo ?? x?.idCargo ?? 0),
        equipe: undefined,
        cargo: undefined,
        competencias: undefined,
      }))

      const rawComps = Array.isArray(comps.data) ? (comps.data as any[]) : []
      const normComps: Competencia[] = rawComps.map((x) => ({
        id_competencia: Number(x?.id_competencia ?? x?.id ?? x?.idCompetencia ?? 0),
        nome: String(x?.nome ?? x?.name ?? ''),
        tipo: Number(x?.tipo ?? 0) as 0 | 1,
      }))

      setSetores(normSetores)
      setEquipes(normEquipes)
      setColaboradores(normColabs)
      setCompetencias(normComps)
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    async function loadCompetenciasByColab() {
      if (!colaboradores.length || !competencias.length) return
      try {
        const nameToId = new Map<string, number>()
        for (const c of competencias) nameToId.set(String(c.nome).toLowerCase(), c.id_competencia)

        const pairs = await Promise.all(
          colaboradores.map(async (col) => {
            try {
              const perfil = await api.get<any>(`/colaboradores/${encodeURIComponent(col.id_colaborador)}/perfil`)
              const raw = Array.isArray(perfil.data?.competencias) ? perfil.data.competencias : []
              const normalized: ColaboradorCompetencia[] = raw.map((it: any) => ({
                id: Number(it?.id ?? 0),
                id_colaborador: Number(col.id_colaborador),
                id_competencia: Number(it?.id_competencia ?? it?.competencia?.id_competencia ?? 0),
                proeficiencia: Number(it?.proeficiencia ?? 0),
                ordem: it?.ordem ?? (null as unknown as number),
                competencia: competencias.find(c => c.id_competencia === Number(it?.id_competencia ?? it?.competencia?.id_competencia ?? 0)),
              }))
              return [col.id_colaborador, normalized] as const
            } catch {
              const res = await api.get<any[]>(`/colaboradores/${encodeURIComponent(col.id_colaborador)}/competencias`)
              const raw = Array.isArray(res.data) ? res.data : []
              const normalized: ColaboradorCompetencia[] = []
              for (const it of raw) {
                const key = String(it?.nome ?? '').toLowerCase()
                const maybeId: number | undefined = it?.id_competencia ?? nameToId.get(key)
                if (!maybeId) continue
                normalized.push({
                  id: Number(it?.id ?? 0),
                  id_colaborador: Number(col.id_colaborador),
                  id_competencia: Number(maybeId),
                  proeficiencia: Number(it?.proeficiencia ?? 0),
                  ordem: it?.ordem ?? (null as unknown as number),
                  competencia: competencias.find(c => c.id_competencia === Number(maybeId)),
                })
              }
              return [col.id_colaborador, normalized] as const
            }
          })
        )
        const map: Record<number, ColaboradorCompetencia[]> = {}
        for (const [id, list] of pairs) map[id] = list
        setCompetenciasByColab(map)
      } catch {}
    }
    loadCompetenciasByColab()
  }, [colaboradores, competencias])
  const optionsCompetencias = useMemo(() => (
    [{ id: 'all' as const, nome: 'Todas' }, ...competencias.map(c => ({ id: c.id_competencia, nome: c.nome }))]
  ), [competencias])

  function isCompetenciaSelected(id: number | 'all') {
    return selectedCompetenciaId === id
  }

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const target = e.target as Node | null
      const clickedInsideCompetencias = competenciasRef.current?.contains(target as Node) ?? false
      const clickedInsideSetores = setoresRef.current?.contains(target as Node) ?? false
      if (!clickedInsideCompetencias) setShowCompetenciasDropdown(false)
      if (!clickedInsideSetores) setShowSetoresDropdown(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])


  

  const filteredColabs = useMemo(() => {
    if (setorFilter === 'all') return colaboradores
    const equipeIds = equipes.filter(eq => eq.id_setor === setorFilter).map(eq => eq.id_equipe)
    return colaboradores.filter(c => equipeIds.includes(c.id_equipe))
  }, [colaboradores, equipes, setorFilter])

  const kpis = useMemo(() => {
    const totalColab = filteredColabs.length
    const totalEquipes = (setorFilter === 'all' ? equipes : equipes.filter(eq => eq.id_setor === setorFilter)).length
    const totalSetores = (setorFilter === 'all' ? setores : setores.filter(s => s.id_setor === setorFilter)).length
    return { totalColab, totalEquipes, totalSetores }
  }, [filteredColabs, equipes, setores, setorFilter])

  const porSetor = useMemo(() => {
    const map = new Map<number, { setor: Setor; equipes: number; colaboradores: number }>()
    const equipesBase = setorFilter === 'all' ? equipes : equipes.filter(eq => eq.id_setor === setorFilter)
    for (const equipe of equipesBase) {
      const key = equipe.id_setor
      const setor = setores.find(s => s.id_setor === key)
      if (!setor) continue
      const entry = map.get(key) ?? { setor, equipes: 0, colaboradores: 0 }
      entry.equipes += 1
      entry.colaboradores += filteredColabs.filter(c => c.id_equipe === equipe.id_equipe).length
      map.set(key, entry)
    }
    return Array.from(map.values()).sort((a, b) => b.colaboradores - a.colaboradores)
  }, [equipes, setores, filteredColabs, setorFilter])

  const porEquipe = useMemo(() => {
    const equipesBase = setorFilter === 'all' ? equipes : equipes.filter(eq => eq.id_setor === setorFilter)
    return equipesBase
      .map(eq => ({
        equipe: eq,
        colaboradores: filteredColabs.filter(c => c.id_equipe === eq.id_equipe).length,
      }))
      .sort((a, b) => b.colaboradores - a.colaboradores)
      .slice(0, 5)
  }, [equipes, filteredColabs, setorFilter])

  const serieEvolucao = useMemo(() => {
    const len = monthsRange
    const now = new Date()
    const buckets = Array.from({ length: len }).map((_, i) => {
      const monthsAgo = len - 1 - i
      const date = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1)
      return { 
        label: `${monthsAgo}m`, 
        value: 0,
        date: date,
        dateLabel: format(date, 'MMM yyyy', { locale: ptBR })
      }
    })
    for (const c of filteredColabs) {
      const d = c.criado_em ? new Date(c.criado_em) : null
      if (!d) continue
      const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())
      const idx = len - 1 - Math.min(len - 1, Math.max(0, diffMonths))
      if (buckets[idx]) buckets[idx].value += 1
    }
    return buckets
  }, [filteredColabs, monthsRange])

  const coberturaPorCompetencia = useMemo(() => {
    const total = filteredColabs.length || 1
    const counts = new Map<number, number>()
    for (const col of filteredColabs) {
      const list = competenciasByColab[col.id_colaborador] || []
      for (const cc of list) {
        counts.set(cc.id_competencia, (counts.get(cc.id_competencia) ?? 0) + 1)
      }
    }
    const rows = competencias.map((comp) => {
      const covered = counts.get(comp.id_competencia) ?? 0
      const pct = Math.round((covered / total) * 100)
      return { comp, covered, pct }
    })
    return rows.sort((a, b) => b.covered - a.covered).slice(0, 10)
  }, [competencias, competenciasByColab, filteredColabs])

  const distribuicaoProeficiencia = useMemo(() => {
    const total = filteredColabs.length || 1
    const buckets: Record<1|2|3|4|5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    if (selectedCompetenciaId !== 'all') {
      for (const col of filteredColabs) {
        const list = competenciasByColab[col.id_colaborador] || []
        for (const cc of list) {
          if (cc.id_competencia !== selectedCompetenciaId) continue
          const v = Math.min(5, Math.max(1, cc.proeficiencia as number)) as 1|2|3|4|5
          buckets[v] += 1
        }
      }
    }
    return (Object.keys(buckets) as unknown as Array<1|2|3|4|5>).map((nivel) => ({
      nivel,
      qtd: buckets[nivel],
      pct: Math.round((buckets[nivel] / total) * 100),
    }))
  }, [competenciasByColab, filteredColabs, selectedCompetenciaId])

  const evolChartConfig = useMemo(() => ({
    value: { label: 'Colaboradores', color: 'hsl(var(--primary))' },
  }), [])

  const profChartConfig = useMemo(() => ({
    qtd: { label: 'Colaboradores', color: 'hsl(var(--primary))' },
  }), [])

  function sparklinePath(values: number[], width = 120, height = 32, padding = 2) {
    if (values.length === 0) return ''
    const max = Math.max(1, ...values)
    const step = (width - padding * 2) / (values.length - 1 || 1)
    const pts = values.map((v, i) => {
      const x = padding + i * step
      const y = height - padding - (v / max) * (height - padding * 2)
      return `${x},${y}`
    })
    return `M ${pts[0]} L ${pts.slice(1).join(' ')}`
  }

  function HorizontalBars({ data }: { data: { label: string; value: number }[] }) {
    if (!data || data.length === 0) return <div className="text-sm text-muted-foreground">Sem dados</div>
    const max = Math.max(1, ...data.map(d => d.value))
    const labelWidth = 160
    return (
      <div className="space-y-3">
        {data.map((d, i) => {
          const pct = Math.round((d.value / max) * 100)
          return (
            <div key={`${d.label}-${i}`} className="flex items-center gap-3">
              <div className="truncate text-sm" style={{ width: labelWidth }}>{d.label}</div>
              <div className="flex-1 h-2 rounded-full bg-primary/15">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
              <div className="w-10 text-right text-sm tabular-nums">{d.value}</div>
            </div>
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-4 w-16" />
          {[1,2,3].map((i) => (
            <Skeleton key={i} className="h-6 w-10 rounded-full" />
          ))}
          <div className="ml-4" />
          {[1,2,3,4].map((i) => (
            <Skeleton key={`chip-${i}`} className="h-6 w-24 rounded-full" />
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1,2,3,4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {[1,2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-4 w-56" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(5)].map((_, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-2 flex-1" />
                      <Skeleton className="h-4 w-10" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-9 w-40 rounded-md" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-xs text-muted-foreground">Período</div>
        {[6, 12, 36].map((m) => (
          <button key={m}
            className={`rounded-full px-3 py-1 text-xs border ${monthsRange === m ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
            onClick={() => setMonthsRange(m as 6 | 12 | 36)}
          >{m}m</button>
        ))}
        <div className="ml-4 text-xs text-muted-foreground">Setor</div>
        <div className="flex gap-2 items-center">
          <button
            className={`rounded-full px-3 py-1 text-xs border ${setorFilter === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
            onClick={() => setSetorFilter('all')}
          >Todos</button>
          {setores.slice(0, 5).map((s, i) => (
            <button 
              key={s.id_setor ?? `${s.nome_setor}-${i}`}
              className={`rounded-full px-3 py-1 text-xs border ${setorFilter === s.id_setor ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
              onClick={() => setSetorFilter(s.id_setor)}
            >{s.nome_setor}</button>
          ))}
          {setores.length > 5 && (
            <div className="relative" ref={setoresRef}>
              <button
                className={`rounded-full px-3 py-1 text-xs border ${showSetoresDropdown ? 'bg-primary text-primary-foreground' : 'bg-transparent hover:bg-accent'}`}
                onClick={() => setShowSetoresDropdown((v) => !v)}
              >
                ...
              </button>
              {showSetoresDropdown && (
                <div className="absolute z-20 mt-1 w-56 rounded-md border bg-popover shadow-xs">
                  <Command>
                    <CommandInput placeholder="Filtrar setor..." value={setorQuery} onValueChange={setSetorQuery} />
                    <CommandList>
                      <CommandEmpty>Nenhum setor</CommandEmpty>
                      <CommandGroup>
                        <CommandItem 
                          onSelect={() => { 
                            setSetorFilter('all')
                            setShowSetoresDropdown(false)
                            setSetorQuery('')
                          }}
                        >
                          Todos
                        </CommandItem>
                        {setores
                          .filter(s => s.nome_setor.toLowerCase().includes(setorQuery.toLowerCase()))
                          .map((s) => (
                            <CommandItem 
                              key={s.id_setor ?? s.nome_setor}
                              onSelect={() => { 
                                setSetorFilter(s.id_setor)
                                setShowSetoresDropdown(false)
                                setSetorQuery('')
                              }}
                            >
                              {s.nome_setor}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="ml-4 text-xs text-muted-foreground">Competência</div>
        <div className="flex gap-2 items-center">
          {optionsCompetencias.slice(0, 5).map((opt, i) => (
            <button
              key={`${String(opt.id)}-${i}`}
              className={`rounded-full px-3 py-1 text-xs border ${isCompetenciaSelected(opt.id as any) ? 'bg-primary text-primary-foreground' : 'bg-transparent hover:bg-accent'}`}
              onClick={() => setSelectedCompetenciaId(opt.id as any)}
            >{opt.nome}</button>
          ))}
          {optionsCompetencias.length > 5 && (
            <div className="relative" ref={competenciasRef}>
              <button
                className={`rounded-full px-3 py-1 text-xs border ${showCompetenciasDropdown ? 'bg-primary text-primary-foreground' : 'bg-transparent hover:bg-accent'}`}
                onClick={() => setShowCompetenciasDropdown((v) => !v)}
              >
                ...
              </button>
              {showCompetenciasDropdown && (
                <div className="absolute z-20 mt-1 w-56 rounded-md border bg-popover shadow-xs">
                  <Command>
                    <CommandInput placeholder="Filtrar competência..." value={competenciaQuery} onValueChange={setCompetenciaQuery} />
                    <CommandList>
                      <CommandEmpty>Nenhuma competência</CommandEmpty>
                      <CommandGroup>
                        {optionsCompetencias
                          .filter(opt => opt.nome.toLowerCase().includes(competenciaQuery.toLowerCase()))
                          .map((opt) => (
                            <CommandItem 
                              key={String(opt.id)} 
                              onSelect={() => { 
                                setSelectedCompetenciaId(opt.id as any)
                                setShowCompetenciasDropdown(false)
                                setCompetenciaQuery('')
                              }}
                            >
                              {opt.nome}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardDescription>Colaboradores</CardDescription>
            <Users className="size-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between relative">
              <div className="text-3xl font-bold">{loading ? '—' : kpis.totalColab}</div>
              <div className="relative">
                <svg 
                  ref={sparklineRef}
                  width="120" 
                  height="32" 
                  className="opacity-70 cursor-pointer"
                  onMouseMove={(e) => {
                    if (!sparklineRef.current) return
                    const rect = sparklineRef.current.getBoundingClientRect()
                    const x = e.clientX - rect.left
                    const width = 120
                    const padding = 2
                    const step = (width - padding * 2) / (serieEvolucao.length - 1 || 1)
                    const index = Math.round((x - padding) / step)
                    const clampedIndex = Math.max(0, Math.min(serieEvolucao.length - 1, index))
                    const point = serieEvolucao[clampedIndex]
                    if (point) {
                      setSparklineTooltip({
                        x: e.clientX,
                        y: e.clientY,
                        label: point.dateLabel,
                        value: point.value
                      })
                    }
                  }}
                  onMouseLeave={() => setSparklineTooltip(null)}
                >
                  <path 
                    d={sparklinePath(serieEvolucao.map(p => p.value))} 
                    stroke="currentColor" 
                    className="text-blue-500" 
                    strokeWidth="2" 
                    fill="none" 
                  />
                </svg>
                {sparklineTooltip && (
                  <div
                    className="fixed z-50 px-3 py-1.5 text-xs bg-popover border rounded shadow-lg pointer-events-none whitespace-nowrap"
                    style={{
                      left: `${sparklineTooltip.x + 10}px`,
                      top: `${sparklineTooltip.y - 40}px`,
                    }}
                  >
                    <div className="font-medium">{sparklineTooltip.label}</div>
                    <div className="text-muted-foreground">{sparklineTooltip.value} colaborador{sparklineTooltip.value !== 1 ? 'es' : ''}</div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardDescription>Equipes</CardDescription>
            <Layers className="size-5 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? '—' : kpis.totalEquipes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardDescription>Setores</CardDescription>
            <Building2 className="size-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? '—' : kpis.totalSetores}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por setor</CardTitle>
            <CardDescription>Equipes e colaboradores por setor</CardDescription>
          </CardHeader>
          <CardContent>
            <HorizontalBars data={porSetor.map(s => ({ label: s.setor.nome_setor, value: s.colaboradores }))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Equipes com mais colaboradores</CardTitle>
            <CardDescription>Top 5</CardDescription>
          </CardHeader>
          <CardContent>
            <HorizontalBars data={porEquipe.map(e => ({ label: e.equipe.nome_equipe, value: e.colaboradores }))} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Métrica: Distribuição e Cobertura de Competências</CardTitle>
            <CardDescription>Quantos colaboradores possuem cada competência e a cobertura percentual.</CardDescription>
          </CardHeader>
          <CardContent>
            <HorizontalBars data={coberturaPorCompetencia.map(({ comp, covered, pct }) => ({ label: `${comp.nome} (${pct}%)`, value: covered }))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Proficiência por competência selecionada</CardTitle>
            <CardDescription>Níveis 1 (Iniciante) a 5 (Especialista).</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedCompetenciaId === 'all' ? (
              <div className="text-sm text-muted-foreground">Selecione uma competência acima para ver a distribuição de níveis.</div>
            ) : (
              <ChartContainer config={profChartConfig} className="w-full h-80 aspect-auto text-primary">
                <BarChart 
                  data={distribuicaoProeficiencia} 
                  margin={{ left: 12, right: 12, top: 4, bottom: 4 }} 
                  barSize={28}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="nivel" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis hide tickLine={false} axisLine={false} />
                  <ChartTooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent hideLabel />} />
                  <Bar 
                    dataKey="qtd" 
                    fill="currentColor" 
                    fillOpacity={0.9} 
                    radius={[6,6,0,0]} 
                    style={{ cursor: 'pointer' }}
                    onClick={(data: any) => {
                      if (data && data.nivel !== undefined && typeof selectedCompetenciaId === 'number') {
                        const qs = new URLSearchParams()
                        qs.set('competencia', String(selectedCompetenciaId))
                        qs.set('proeficiencia', String(data.nivel))
                        navigate(`/dashboard/colaboradores?${qs.toString()}`)
                      }
                    }}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evolução de cobertura ao longo do tempo</CardTitle>
          <CardDescription>Últimos períodos ({monthsRange}m) como proxy de evolução da capacidade.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={evolChartConfig} className="w-full h-96 aspect-auto text-primary">
            <BarChart data={serieEvolucao} margin={{ left: 12, right: 12, top: 4, bottom: 4 }} barSize={28}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis hide tickLine={false} axisLine={false} />
              <ChartTooltip cursor={{ fill: 'hsl(var(--muted))' }} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="value" fill="currentColor" fillOpacity={0.9} radius={[6,6,0,0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

    </div>
  )
}



