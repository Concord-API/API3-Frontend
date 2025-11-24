import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { api } from '@/shared/lib/api'
import type { Colaborador, ColaboradorCompetencia, Competencia, Equipe, Setor } from '@/shared/types'
import { EvaluateCollaboratorModal } from '@/features/dashboard/components/EvaluateCollaboratorModal'
import { ViewEvaluationModal } from '@/features/dashboard/components/ViewEvaluationModal'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/shared/components/ui/command'
import { ChevronDown, Eye } from 'lucide-react'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'

type Avaliacao = {
  id: number
  id_colaborador: number
  colaborador?: Colaborador
  created_at?: string | null
  updated_at?: string | null
  resumo?: string | null
  competenciaNome?: string | null
  competenciaId?: number | null
  nota?: number | null
  publico?: boolean
}

export function Avaliacoes() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [evaluations, setEvaluations] = useState<Avaliacao[]>([])

  const [items, setItems] = useState<Colaborador[]>([])
  const [setores, setSetores] = useState<Setor[]>([])
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [competencias, setCompetencias] = useState<Competencia[]>([])
  const [competenciasByColab, setCompetenciasByColab] = useState<Record<number, ColaboradorCompetencia[]>>({})

  const [q, setQ] = useState('')
  const [evalOpen, setEvalOpen] = useState(false)
  const [viewOpen, setViewOpen] = useState(false)
  const [evaluationId, setEvaluationId] = useState<number | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [existingEvaluation, setExistingEvaluation] = useState<{
    id: number
    competenciaId: number | null
    competenciaNome: string | null
    resumo: string | null
    publico: boolean
    nota?: number
  } | null>(null)
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
  const [selectedSetor, setSelectedSetor] = useState<number | 'all'>('all')
  const [selectedEquipe, setSelectedEquipe] = useState<number | 'all'>('all')
  const [selectedColaborador, setSelectedColaborador] = useState<number | 'all'>('all')
  const [showSetor, setShowSetor] = useState(false)
  const [showEquipe, setShowEquipe] = useState(false)
  const [showColaborador, setShowColaborador] = useState(false)
  const [setorQuery, setSetorQuery] = useState('')
  const [equipeQuery, setEquipeQuery] = useState('')
  const [colaboradorQuery, setColaboradorQuery] = useState('')
  const setorRef = useRef<HTMLDivElement | null>(null)
  const equipeRef = useRef<HTMLDivElement | null>(null)
  const colaboradorRef = useRef<HTMLDivElement | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [_, c, s, e, comps] = await Promise.all([
        (async () => {
          try {
            const res = await api.get<any[]>('/avaliacoes/minhas')
            const normalized: Avaliacao[] = (res.data || []).map((it: any) => ({
              id: Number(it?.id ?? 0),
              id_colaborador: Number(it?.avaliadoId ?? it?.id_colaborador ?? it?.colaboradorId ?? 0),
              colaborador: it?.colaborador ?? undefined,
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
        api.get<any[]>('/setores'),
        api.get<any[]>('/equipes?status=all'),
        api.get<Competencia[]>('/competencias'),
      ])

      setItems(c.data)
      const mappedSetores: Setor[] = (s.data || []).map((vm: any) => ({
        id_setor: vm.id ?? vm.id_setor,
        nome_setor: vm.nome ?? vm.nome_setor,
        desc_setor: vm.descricao ?? vm.desc_setor,
        status: vm.status ?? true,
        id_diretor: vm.diretorId ?? vm.id_diretor,
      }))
      setSetores(mappedSetores)
      const mappedEquipes: Equipe[] = (e.data || []).map((vm: any) => ({
        id_equipe: vm.id ?? vm.id_equipe,
        nome_equipe: vm.nome ?? vm.nome_equipe,
        id_setor: vm.setorId ?? vm.id_setor,
        status: vm.status ?? true,
        setor: vm.setor ?? undefined,
      }))
      setEquipes(mappedEquipes)
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
      const clickedInsideSetor = setorRef.current?.contains(target) ?? false
      const clickedInsideEquipe = equipeRef.current?.contains(target) ?? false
      const clickedInsideColaborador = colaboradorRef.current?.contains(target) ?? false
      if (!clickedInsideSetor) setShowSetor(false)
      if (!clickedInsideEquipe) setShowEquipe(false)
      if (!clickedInsideColaborador) setShowColaborador(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  const loadCompetenciasByColab = async () => {
    const map: Record<number, ColaboradorCompetencia[]> = {}
    for (const c of items) {
      const id = (c as any).id_colaborador ?? (c as any).id
      if (!id) continue
      try {
        const res = await api.get<ColaboradorCompetencia[]>(`/colaboradores/${encodeURIComponent(id)}/competencias`)
        map[id] = res.data || []
      } catch {
        map[id] = []
      }
    }
    setCompetenciasByColab(map)
  }

  useEffect(() => {
    if (!items.length || !competencias.length) return
    loadCompetenciasByColab()
  }, [items, competencias])

  const avaliacoesGerais = useMemo(() => {
    return evaluations.filter(ev => !ev.competenciaId)
  }, [evaluations])

  const avaliacoesPorCompetencia = useMemo(() => {
    return evaluations.filter(ev => ev.competenciaId != null)
  }, [evaluations])

  const filteredGerais = useMemo(() => {
    const t = q.trim().toLowerCase()
    let base = avaliacoesGerais.slice()

    base = base.filter(ev => {
      const colabId = String(ev.id_colaborador ?? '')
      const currentUserId = String(user?.id ?? '')
      return colabId !== currentUserId
    })

    if (selectedSetor !== 'all') {
      base = base.filter(ev => {
        const c = items.find(it => ((it as any).id_colaborador ?? (it as any).id) === ev.id_colaborador)
        const setorId = (c as any)?.idSetor ?? c?.equipe?.setor?.id_setor ?? (c as any)?.id_setor
        return setorId === selectedSetor
      })
    }
    if (selectedEquipe !== 'all') {
      base = base.filter(ev => {
        const c = items.find(it => ((it as any).id_colaborador ?? (it as any).id) === ev.id_colaborador)
        const equipeId = (c as any)?.idEquipe ?? c?.equipe?.id_equipe ?? (c as any)?.id_equipe
        return equipeId === selectedEquipe
      })
    }
    if (selectedColaborador !== 'all') {
      base = base.filter(ev => ev.id_colaborador === selectedColaborador)
    }

    if (!t) return base
    return base.filter(ev => {
      const c = items.find(it => ((it as any).id_colaborador ?? (it as any).id) === ev.id_colaborador)
      const nome = c ? `${c.nome} ${c.sobrenome}`.toLowerCase() : ''
      const email = (c as any)?.email?.toLowerCase?.() ?? ''
      return nome.includes(t) || email.includes(t)
    })
  }, [q, avaliacoesGerais, items, selectedSetor, selectedEquipe, selectedColaborador, user?.id])

  const filteredCompetencias = useMemo(() => {
    const t = q.trim().toLowerCase()
    let base = avaliacoesPorCompetencia.slice()

    base = base.filter(ev => {
      const colabId = String(ev.id_colaborador ?? '')
      const currentUserId = String(user?.id ?? '')
      return colabId !== currentUserId
    })

    if (selectedSetor !== 'all') {
      base = base.filter(ev => {
        const c = items.find(it => ((it as any).id_colaborador ?? (it as any).id) === ev.id_colaborador)
        const setorId = (c as any)?.idSetor ?? c?.equipe?.setor?.id_setor ?? (c as any)?.id_setor
        return setorId === selectedSetor
      })
    }
    if (selectedEquipe !== 'all') {
      base = base.filter(ev => {
        const c = items.find(it => ((it as any).id_colaborador ?? (it as any).id) === ev.id_colaborador)
        const equipeId = (c as any)?.idEquipe ?? c?.equipe?.id_equipe ?? (c as any)?.id_equipe
        return equipeId === selectedEquipe
      })
    }
    if (selectedColaborador !== 'all') {
      base = base.filter(ev => ev.id_colaborador === selectedColaborador)
    }

    if (!t) return base
    return base.filter(ev => {
      const c = items.find(it => ((it as any).id_colaborador ?? (it as any).id) === ev.id_colaborador)
      const nome = c ? `${c.nome} ${c.sobrenome}`.toLowerCase() : ''
      const email = (c as any)?.email?.toLowerCase?.() ?? ''
      const compNome = ev.competenciaNome?.toLowerCase() ?? ''
      return nome.includes(t) || email.includes(t) || compNome.includes(t)
    })
  }, [q, avaliacoesPorCompetencia, items, selectedSetor, selectedEquipe, selectedColaborador, user?.id])

  async function openEvaluate(colabId: number, evaluation?: Avaliacao) {
    if (evaluation) {
      setIsEditMode(true)
      setExistingEvaluation({
        id: evaluation.id,
        competenciaId: evaluation.competenciaId ?? null,
        competenciaNome: evaluation.competenciaNome ?? null,
        resumo: evaluation.resumo ?? null,
        publico: true,
        nota: undefined,
      })
    } else {
      setIsEditMode(false)
      setExistingEvaluation(null)
    }
    setEvaluationId(colabId)
    setEvalOpen(true)
  }

  const filteredIds = useMemo(() => {
    return items
      .filter(c => {
        const colabId = String((c as any).id_colaborador ?? (c as any).id)
        const currentUserId = String(user?.id ?? '')
        return colabId !== currentUserId
      })
      .map(c => (c as any).id_colaborador ?? (c as any).id)
  }, [items, user?.id])

  const renderTable = (data: Avaliacao[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            <th className="py-2 pr-4">Colaborador</th>
            <th className="py-2 pr-4">Tipo</th>
            <th className="py-2 pr-4">Criada em</th>
            <th className="py-2 pr-4">Atualizada em</th>
            <th className="py-2 pr-2 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {data.map(ev => {
            const c = items.find(it => ((it as any).id_colaborador ?? (it as any).id) === ev.id_colaborador)
            const id = (c as any)?.id_colaborador ?? (c as any)?.id ?? ev.id_colaborador
            const foto = c ? (((c as any).foto_url ?? (c as any).avatar) as unknown) : undefined
            const src = (() => {
              if (!foto) return ''
              const s = String(foto)
              return s.startsWith('data:') ? s : `data:image/png;base64,${s}`
            })()
            const initial = (c?.nome?.[0] ?? (c as any)?.email?.[0] ?? '?').toUpperCase()
            return (
              <tr key={ev.id} className="border-t hover:bg-muted/60 transition-colors">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8">
                      <AvatarImage src={src || undefined} alt="" />
                      <AvatarFallback className="text-xs font-semibold">{initial}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{c ? `${c.nome} ${c.sobrenome}` : '—'}</div>
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
                <td className="py-3 pr-4 text-muted-foreground">{ev.created_at ? new Date(ev.created_at).toLocaleString() : '—'}</td>
                <td className="py-3 pr-4 text-muted-foreground">{ev.updated_at ? new Date(ev.updated_at).toLocaleString() : '—'}</td>
                <td className="py-3 pr-2 text-right">
                  <div className="inline-flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setViewEvaluation({
                          colaboradorNome: c ? `${c.nome} ${c.sobrenome}` : 'Colaborador',
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
                    <Button size="sm" variant="outline" onClick={() => openEvaluate(id, ev)}>
                      Editar
                    </Button>
                  </div>
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
            placeholder="Buscar colaborador..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-64"
          />
          <div className="relative" ref={setorRef}>
            <div className="inline-flex h-8 items-center gap-2 rounded-md border px-3 text-sm cursor-pointer" onClick={() => { setShowSetor((v) => !v); setShowEquipe(false); setShowColaborador(false) }}>
              <span className="truncate max-w-[12rem]">{selectedSetor === 'all' ? 'Todos os setores' : setores.find(s => s.id_setor === selectedSetor)?.nome_setor ?? 'Setor'}</span>
              <ChevronDown className="size-4 opacity-60" />
            </div>
            {showSetor && (
              <div className="absolute z-20 mt-1">
                <ScrollArea className="h-64 w-56 rounded-md border bg-popover shadow-xs">
                  <Command>
                    <CommandInput placeholder="Filtrar setor..." value={setorQuery} onValueChange={setSetorQuery} />
                    <CommandList className="max-h-none overflow-visible">
                      <CommandEmpty>Nenhum setor</CommandEmpty>
                      <CommandGroup>
                        <CommandItem onSelect={() => {
                          setSelectedSetor('all')
                          setSelectedEquipe('all')
                          setSelectedColaborador('all')
                          setShowSetor(false)
                          setSetorQuery('')
                        }}>Todos</CommandItem>
                        {setores
                          .filter(s => s.nome_setor.toLowerCase().includes(setorQuery.toLowerCase()))
                          .map(s => (
                            <CommandItem key={s.id_setor} onSelect={() => {
                              setSelectedSetor(s.id_setor)
                              setSelectedEquipe('all')
                              setSelectedColaborador('all')
                              setShowSetor(false)
                              setSetorQuery('')
                            }}>{s.nome_setor}</CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </ScrollArea>
              </div>
            )}
          </div>
          <div className="relative" ref={equipeRef}>
            <div className="inline-flex h-8 items-center gap-2 rounded-md border px-3 text-sm cursor-pointer" onClick={() => { setShowEquipe((v) => !v); setShowSetor(false); setShowColaborador(false) }}>
              <span className="truncate max-w-[12rem]">{selectedEquipe === 'all' ? 'Todas as equipes' : equipes.find(e => e.id_equipe === selectedEquipe)?.nome_equipe ?? 'Equipe'}</span>
              <ChevronDown className="size-4 opacity-60" />
            </div>
            {showEquipe && (
              <div className="absolute z-20 mt-1">
                <ScrollArea className="h-64 w-56 rounded-md border bg-popover shadow-xs">
                  <Command>
                    <CommandInput placeholder="Filtrar equipe..." value={equipeQuery} onValueChange={setEquipeQuery} />
                    <CommandList className="max-h-none overflow-visible">
                      <CommandEmpty>Nenhuma equipe</CommandEmpty>
                      <CommandGroup>
                        <CommandItem onSelect={() => {
                          setSelectedEquipe('all')
                          setSelectedColaborador('all')
                          setShowEquipe(false)
                          setEquipeQuery('')
                        }}>Todas</CommandItem>
                        {(selectedSetor === 'all' ? equipes : equipes.filter(e => e.id_setor === selectedSetor))
                          .filter(e => e.nome_equipe.toLowerCase().includes(equipeQuery.toLowerCase()))
                          .map(e => (
                            <CommandItem key={e.id_equipe} onSelect={() => {
                              setSelectedEquipe(e.id_equipe)
                              setSelectedColaborador('all')
                              setShowEquipe(false)
                              setEquipeQuery('')
                            }}>{e.nome_equipe}</CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </ScrollArea>
              </div>
            )}
          </div>
          <div className="relative" ref={colaboradorRef}>
            <div className="inline-flex h-8 items-center gap-2 rounded-md border px-3 text-sm cursor-pointer" onClick={() => { setShowColaborador((v) => !v); setShowSetor(false); setShowEquipe(false) }}>
              <span className="truncate max-w-[12rem]">{selectedColaborador === 'all' ? 'Todos os colaboradores' : (() => {
                const c = items.find(it => ((it as any).id_colaborador ?? (it as any).id) === selectedColaborador)
                return c ? `${c.nome} ${c.sobrenome}` : 'Colaborador'
              })()}</span>
              <ChevronDown className="size-4 opacity-60" />
            </div>
            {showColaborador && (
              <div className="absolute z-20 mt-1">
                <ScrollArea className="h-72 w-64 rounded-md border bg-popover shadow-xs">
                  <Command>
                    <CommandInput placeholder="Filtrar colaborador..." value={colaboradorQuery} onValueChange={setColaboradorQuery} />
                    <CommandList className="max-h-none overflow-visible">
                      <CommandEmpty>Nenhum colaborador</CommandEmpty>
                      <CommandGroup>
                        <CommandItem onSelect={() => {
                          setSelectedColaborador('all')
                          setShowColaborador(false)
                          setColaboradorQuery('')
                        }}>Todos</CommandItem>
                        {items
                          .filter(c => {
                            const colabId = String((c as any).id_colaborador ?? (c as any).id)
                            const currentUserId = String(user?.id ?? '')
                            if (colabId === currentUserId) return false
                            
                            if (selectedSetor !== 'all') {
                              const setorId = (c as any).idSetor ?? c.equipe?.setor?.id_setor ?? (c as any).id_setor
                              if (setorId !== selectedSetor) return false
                            }
                            if (selectedEquipe !== 'all') {
                              const equipeId = (c as any).idEquipe ?? c.equipe?.id_equipe ?? (c as any).id_equipe
                              if (equipeId !== selectedEquipe) return false
                            }
                            const t = colaboradorQuery.trim().toLowerCase()
                            if (!t) return true
                            const nome = `${c.nome} ${c.sobrenome}`.toLowerCase()
                            const email = (c as any)?.email?.toLowerCase?.() ?? ''
                            return nome.includes(t) || email.includes(t)
                          })
                          .map(c => {
                            const id = (c as any).id_colaborador ?? (c as any).id
                            return (
                              <CommandItem key={id} onSelect={() => {
                                setSelectedColaborador(id)
                                setShowColaborador(false)
                                setColaboradorQuery('')
                              }}>{c.nome} {c.sobrenome}</CommandItem>
                            )
                          })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </ScrollArea>
              </div>
            )}
          </div>
        </div>
        <div>
          <Button size="sm" onClick={() => navigate('/dashboard/colaboradores')}>
            Avaliar novo colaborador
          </Button>
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

      <EvaluateCollaboratorModal
        open={evalOpen}
        onOpenChange={setEvalOpen}
        evaluationId={evaluationId}
        setEvaluationId={setEvaluationId}
        items={items}
        filteredIds={filteredIds}
        competenciasByColab={competenciasByColab}
        setores={setores}
        equipes={equipes}
        isEditMode={isEditMode}
        existingEvaluation={existingEvaluation}
        onSave={() => {
          loadData()
          setEvalOpen(false)
          setExistingEvaluation(null)
          setIsEditMode(false)
        }}
      />

      <ViewEvaluationModal
        open={viewOpen}
        onOpenChange={setViewOpen}
        evaluation={viewEvaluation}
      />
    </div>
  )
}
