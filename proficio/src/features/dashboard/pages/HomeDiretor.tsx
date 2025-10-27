import { useEffect, useMemo, useState } from 'react'
import { api } from '@/shared/lib/api'
import type { Colaborador, Equipe, Setor } from '@/shared/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { TrendingUp, Users, Building2, Layers, ArrowUpRight, BarChart3, ClipboardCheck, Plus } from 'lucide-react'
import { Skeleton } from '@/shared/components/ui/skeleton'

export function HomeDiretor() {
  const [setores, setSetores] = useState<Setor[]>([])
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)
  const [monthsRange, setMonthsRange] = useState<3 | 6 | 12>(6)
  const [setorFilter, setSetorFilter] = useState<number | 'all'>('all')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [s, e, c] = await Promise.all([
        api.get<Setor[]>('/setores'),
        api.get<Equipe[]>('/equipes'),
        api.get<Colaborador[]>('/colaboradores'),
      ])
      setSetores(Array.isArray(s.data) ? s.data : [])
      setEquipes(Array.isArray(e.data) ? e.data : [])
      setColaboradores(Array.isArray(c.data) ? c.data : [])
      setLoading(false)
    }
    load()
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
    const ativos = filteredColabs.filter(c => c.status).length
    return { totalColab, totalEquipes, totalSetores, ativos }
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

  // Simula evolução (últimos 6 períodos) usando criado_em
  const serieEvolucao = useMemo(() => {
    const len = monthsRange
    const buckets = Array.from({ length: len }).map((_, i) => ({ label: `${len - 1 - i}m`, value: 0 }))
    for (const c of filteredColabs) {
      const d = c.criado_em ? new Date(c.criado_em) : null
      if (!d) continue
      const diffMonths = (new Date().getFullYear() - d.getFullYear()) * 12 + (new Date().getMonth() - d.getMonth())
      const idx = len - 1 - Math.min(len - 1, Math.max(0, diffMonths))
      if (buckets[idx]) buckets[idx].value += 1
    }
    return buckets
  }, [filteredColabs, monthsRange])

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
        {[3, 6, 12].map((m) => (
          <button key={m}
            className={`rounded-full px-3 py-1 text-xs border ${monthsRange === m ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
            onClick={() => setMonthsRange(m as 3 | 6 | 12)}
          >{m}m</button>
        ))}
        <div className="ml-4 text-xs text-muted-foreground">Setor</div>
        <button
          className={`rounded-full px-3 py-1 text-xs border ${setorFilter === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
          onClick={() => setSetorFilter('all')}
        >Todos</button>
        {setores.map((s, i) => (
          <button key={s.id_setor ?? `${s.nome_setor}-${i}`}
            className={`rounded-full px-3 py-1 text-xs border ${setorFilter === s.id_setor ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
            onClick={() => setSetorFilter(s.id_setor)}
          >{s.nome_setor}</button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardDescription>Colaboradores</CardDescription>
            <Users className="size-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-bold">{loading ? '—' : kpis.totalColab}</div>
              <svg width="120" height="32" className="opacity-70">
                <path d={sparklinePath(serieEvolucao.map(p => p.value))} stroke="currentColor" className="text-blue-500" strokeWidth="2" fill="none" />
              </svg>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardDescription>Ativos</CardDescription>
            <TrendingUp className="size-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold">{loading ? '—' : kpis.ativos}</div>
              <ArrowUpRight className="size-4 text-emerald-500" />
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

      {/* Ações rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>Principais funcionalidades do seu perfil</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="gap-2"><Users className="size-4" /> Ver Equipes</Button>
            <Button variant="outline" className="gap-2"><Building2 className="size-4" /> Ver Setores</Button>
            <Button variant="outline" className="gap-2"><ClipboardCheck className="size-4" /> Realizar Avaliação</Button>
            <Button variant="outline" className="gap-2"><BarChart3 className="size-4" /> Relatórios</Button>
            <Button variant="outline" className="gap-2"><Plus className="size-4" /> Adicionar Funcionário</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



