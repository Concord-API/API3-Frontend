import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { api } from '@/shared/lib/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/shared/components/ui/command'
import { ChevronDown, Eye } from 'lucide-react'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { ViewEvaluationModal } from '@/features/dashboard/components/ViewEvaluationModal'
import type { Colaborador, Competencia } from '@/shared/types'

type Avaliacao = {
  id: number
  id_colaborador: number
  colaborador?: Colaborador
  avaliadorNome?: string | null
  created_at?: string | null
  updated_at?: string | null
  resumo?: string | null
  competenciaNome?: string | null
  competenciaId?: number | null
  nota?: number | null
  publico?: boolean
}

export function MinhasAvaliacoes() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [evaluations, setEvaluations] = useState<Avaliacao[]>([])
  const [items, setItems] = useState<Colaborador[]>([])
  const [competencias, setCompetencias] = useState<Competencia[]>([])

  const [q, setQ] = useState('')
  const [viewOpen, setViewOpen] = useState(false)
  const [viewEvaluation, setViewEvaluation] = useState<{
    colaboradorNome: string
    colaboradorEmail?: string
    competenciaNome?: string | null
    nota?: number | null
    resumo?: string | null
    criadoEm?: string | null
    atualizadoEm?: string | null
    publico?: boolean
  } | null>(null)
  const [selectedCompetencia, setSelectedCompetencia] = useState<number | 'all'>('all')
  const [selectedAvaliador, setSelectedAvaliador] = useState<string | 'all'>('all')
  const [showCompetencia, setShowCompetencia] = useState(false)
  const [showAvaliador, setShowAvaliador] = useState(false)
  const [competenciaQuery, setCompetenciaQuery] = useState('')
  const [avaliadorQuery, setAvaliadorQuery] = useState('')
  const competenciaRef = useRef<HTMLDivElement | null>(null)
  const avaliadorRef = useRef<HTMLDivElement | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [_, c, comps] = await Promise.all([
        (async () => {
          try {
            const res = await api.get<any[]>('/avaliacoes/minhas')
            const normalized: Avaliacao[] = (res.data || [])
              .filter((it: any) => it?.publico === true)
              .map((it: any) => ({
                id: Number(it?.id ?? 0),
                id_colaborador: Number(it?.avaliadorId ?? it?.id_colaborador ?? it?.colaboradorId ?? 0),
                colaborador: it?.colaborador ?? undefined,
                avaliadorNome: it?.avaliadorNome ?? null,
                created_at: it?.created_at ?? it?.criadoEm ?? null,
                updated_at: it?.updated_at ?? it?.atualizadoEm ?? null,
                resumo: it?.resumo ?? null,
                competenciaNome: it?.competenciaNome ?? null,
                competenciaId: it?.competenciaId ?? null,
                nota: it?.nota ?? null,
                publico: it?.publico ?? false,
              }))
            setEvaluations(normalized)
          } catch {
            setEvaluations([])
          }
        })(),
        api.get<Colaborador[]>('/colaboradores'),
        api.get<Competencia[]>('/competencias'),
      ])

      setItems(c.data)
      const mappedCompetencias: Competencia[] = (comps.data || []).map((vm: any) => ({
        id_competencia: vm.id ?? vm.id_competencia,
        nome: vm.nome ?? '',
        tipo: vm.tipo ?? 'Técnica',
      }))
      setCompetencias(mappedCompetencias)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const target = e.target as Node | null
      const clickedInsideCompetencia = competenciaRef.current?.contains(target) ?? false
      const clickedInsideAvaliador = avaliadorRef.current?.contains(target) ?? false
      if (!clickedInsideCompetencia) setShowCompetencia(false)
      if (!clickedInsideAvaliador) setShowAvaliador(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  const avaliadoresUnicos = useMemo(() => {
    const nomes = new Set<string>()
    evaluations.forEach(ev => {
      if (ev.avaliadorNome) {
        nomes.add(ev.avaliadorNome)
      }
    })
    return Array.from(nomes).sort()
  }, [evaluations])

  const avaliacoesGerais = useMemo(() => {
    return evaluations.filter(ev => !ev.competenciaId)
  }, [evaluations])

  const avaliacoesPorCompetencia = useMemo(() => {
    return evaluations.filter(ev => ev.competenciaId != null)
  }, [evaluations])

  const filteredGerais = useMemo(() => {
    const t = q.trim().toLowerCase()
    let base = avaliacoesGerais.slice()

    if (selectedCompetencia !== 'all') {
      // Para avaliações gerais, não há competência, então filtra vazio se selecionar uma competência
      base = []
    }
    if (selectedAvaliador !== 'all') {
      base = base.filter(ev => ev.avaliadorNome === selectedAvaliador)
    }

    if (!t) return base
    return base.filter(ev => {
      const avaliadorNome = ev.avaliadorNome?.toLowerCase() ?? ''
      return avaliadorNome.includes(t)
    })
  }, [q, avaliacoesGerais, selectedCompetencia, selectedAvaliador])

  const filteredCompetencias = useMemo(() => {
    const t = q.trim().toLowerCase()
    let base = avaliacoesPorCompetencia.slice()

    if (selectedCompetencia !== 'all') {
      base = base.filter(ev => ev.competenciaId === selectedCompetencia)
    }
    if (selectedAvaliador !== 'all') {
      base = base.filter(ev => ev.avaliadorNome === selectedAvaliador)
    }

    if (!t) return base
    return base.filter(ev => {
      const avaliadorNome = ev.avaliadorNome?.toLowerCase() ?? ''
      const compNome = ev.competenciaNome?.toLowerCase() ?? ''
      return avaliadorNome.includes(t) || compNome.includes(t)
    })
  }, [q, avaliacoesPorCompetencia, selectedCompetencia, selectedAvaliador])

  const renderTable = (data: Avaliacao[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            <th className="py-2 pr-4">Avaliador</th>
            <th className="py-2 pr-4">Tipo</th>
            <th className="py-2 pr-4">Criada em</th>
            <th className="py-2 pr-4">Atualizada em</th>
            <th className="py-2 pr-2 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {data.map(ev => {
            const c = items.find(it => ((it as any).id_colaborador ?? (it as any).id) === ev.id_colaborador)
            const foto = c ? (((c as any).foto_url ?? (c as any).avatar) as unknown) : undefined
            const src = (() => {
              if (!foto) return ''
              const s = String(foto)
              return s.startsWith('data:') ? s : `data:image/png;base64,${s}`
            })()
            const initial = (c?.nome?.[0] ?? ev.avaliadorNome?.[0] ?? '?').toUpperCase()
            const nomeExibido = c ? `${c.nome} ${c.sobrenome}` : (ev.avaliadorNome ?? '—')
            return (
              <tr key={ev.id} className="border-t hover:bg-muted/60 transition-colors">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8">
                      <AvatarImage src={src || undefined} alt="" />
                      <AvatarFallback className="text-xs font-semibold">{initial}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{nomeExibido}</div>
                      <div className="text-xs text-muted-foreground truncate">{(c as any)?.email ?? '—'}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  {ev.competenciaNome ? (
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      {ev.competenciaNome}
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                      Avaliação Geral
                    </span>
                  )}
                </td>
                <td className="py-3 pr-4 text-muted-foreground">{ev.created_at ? new Date(ev.created_at).toLocaleString('pt-BR') : '—'}</td>
                <td className="py-3 pr-4 text-muted-foreground">{ev.updated_at ? new Date(ev.updated_at).toLocaleString('pt-BR') : '—'}</td>
                <td className="py-3 pr-2 text-right">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setViewEvaluation({
                        colaboradorNome: nomeExibido,
                        colaboradorEmail: (c as any)?.email,
                        competenciaNome: ev.competenciaNome,
                        nota: ev.nota,
                        resumo: ev.resumo,
                        criadoEm: ev.created_at,
                        atualizadoEm: ev.updated_at,
                        publico: ev.publico,
                      })
                      setViewOpen(true)
                    }}
                  >
                    <Eye className="size-4" />
                    Ver
                  </Button>
                </td>
              </tr>
            )
          })}
          {data.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma avaliação encontrada.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            placeholder="Buscar avaliador ou competência..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-64"
          />
          <div className="relative" ref={competenciaRef}>
            <div className="inline-flex h-8 items-center gap-2 rounded-md border px-3 text-sm cursor-pointer" onClick={() => { setShowCompetencia((v) => !v); setShowAvaliador(false) }}>
              <span className="truncate max-w-[12rem]">{selectedCompetencia === 'all' ? 'Todas as competências' : competencias.find(c => c.id_competencia === selectedCompetencia)?.nome ?? 'Competência'}</span>
              <ChevronDown className="size-4 opacity-60" />
            </div>
            {showCompetencia && (
              <div className="absolute z-20 mt-1">
                <ScrollArea className="h-64 w-56 rounded-md border bg-popover shadow-xs">
                  <Command>
                    <CommandInput placeholder="Filtrar competência..." value={competenciaQuery} onValueChange={setCompetenciaQuery} />
                    <CommandList className="max-h-none overflow-visible">
                      <CommandEmpty>Nenhuma competência</CommandEmpty>
                      <CommandGroup>
                        <CommandItem onSelect={() => {
                          setSelectedCompetencia('all')
                          setShowCompetencia(false)
                          setCompetenciaQuery('')
                        }}>Todas</CommandItem>
                        {competencias
                          .filter(c => c.nome.toLowerCase().includes(competenciaQuery.toLowerCase()))
                          .map(c => (
                            <CommandItem key={c.id_competencia} onSelect={() => {
                              setSelectedCompetencia(c.id_competencia)
                              setShowCompetencia(false)
                              setCompetenciaQuery('')
                            }}>{c.nome}</CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </ScrollArea>
              </div>
            )}
          </div>
          <div className="relative" ref={avaliadorRef}>
            <div className="inline-flex h-8 items-center gap-2 rounded-md border px-3 text-sm cursor-pointer" onClick={() => { setShowAvaliador((v) => !v); setShowCompetencia(false) }}>
              <span className="truncate max-w-[12rem]">{selectedAvaliador === 'all' ? 'Todos os avaliadores' : selectedAvaliador}</span>
              <ChevronDown className="size-4 opacity-60" />
            </div>
            {showAvaliador && (
              <div className="absolute z-20 mt-1">
                <ScrollArea className="h-64 w-56 rounded-md border bg-popover shadow-xs">
                  <Command>
                    <CommandInput placeholder="Filtrar avaliador..." value={avaliadorQuery} onValueChange={setAvaliadorQuery} />
                    <CommandList className="max-h-none overflow-visible">
                      <CommandEmpty>Nenhum avaliador</CommandEmpty>
                      <CommandGroup>
                        <CommandItem onSelect={() => {
                          setSelectedAvaliador('all')
                          setShowAvaliador(false)
                          setAvaliadorQuery('')
                        }}>Todos</CommandItem>
                        {avaliadoresUnicos
                          .filter(nome => nome.toLowerCase().includes(avaliadorQuery.toLowerCase()))
                          .map(nome => (
                            <CommandItem key={nome} onSelect={() => {
                              setSelectedAvaliador(nome)
                              setShowAvaliador(false)
                              setAvaliadorQuery('')
                            }}>{nome}</CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </ScrollArea>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          {[...Array(6)].map((_, idx) => (
            <Skeleton key={idx} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <Tabs defaultValue="gerais" className="w-full">
          <TabsList>
            <TabsTrigger value="gerais">Avaliações Gerais ({filteredGerais.length})</TabsTrigger>
            <TabsTrigger value="competencias">Por Competência ({filteredCompetencias.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="gerais" className="mt-4">
            {renderTable(filteredGerais)}
          </TabsContent>
          <TabsContent value="competencias" className="mt-4">
            {renderTable(filteredCompetencias)}
          </TabsContent>
        </Tabs>
      )}

      <ViewEvaluationModal
        open={viewOpen}
        onOpenChange={setViewOpen}
        evaluation={viewEvaluation}
      />
    </div>
  )
}
