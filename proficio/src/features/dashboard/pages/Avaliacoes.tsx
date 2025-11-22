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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/shared/components/ui/command'
import { ChevronDown } from 'lucide-react'
import { ScrollArea } from '@/shared/components/ui/scroll-area'

type Avaliacao = {
  id: number
  id_colaborador: number
  colaborador?: Colaborador
  created_at?: string | null
  updated_at?: string | null
  resumo?: string | null
  competenciaNome?: string | null
}

export function Avaliacoes() {
  const { } = useAuth()
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
  const [evaluationId, setEvaluationId] = useState<number | null>(null)
  const [existingEvaluation, setExistingEvaluation] = useState<{
    id: number
    competenciaId: number
    competenciaNome: string
    resumo: string | null
    publico: boolean
    nota?: number
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
        id_competencia: vm.id ?? vm.id_competencia ?? vm.idCompetencia ?? 0,
        nome: vm.nome ?? vm.name ?? '',
        tipo: Number(vm.tipo ?? 0) as 0 | 1,
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
      const clickedInsideSetor = setorRef.current?.contains(target as Node) ?? false
      const clickedInsideEquipe = equipeRef.current?.contains(target as Node) ?? false
      const clickedInsideColaborador = colaboradorRef.current?.contains(target as Node) ?? false
      if (!clickedInsideSetor) setShowSetor(false)
      if (!clickedInsideEquipe) setShowEquipe(false)
      if (!clickedInsideColaborador) setShowColaborador(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  useEffect(() => {
    async function loadCompetenciasByColab() {
      if (!items.length || !competencias.length) return
      try {
        const nameToId = new Map<string, number>()
        for (const c of competencias) nameToId.set(String(c.nome).toLowerCase(), c.id_competencia)

        const pairs = await Promise.all(
          items.map(async (col) => {
            const colabId = (col as any).id_colaborador ?? (col as any).id
            if (!colabId || !Number.isFinite(Number(colabId))) {
              return [colabId, []] as const
            }
            try {
              const perfil = await api.get<any>(`/colaboradores/${encodeURIComponent(colabId)}/perfil`)
              const raw = Array.isArray(perfil.data?.competencias) ? perfil.data.competencias : []
              const normalized: ColaboradorCompetencia[] = raw.map((it: any) => ({
                id: Number(it?.id ?? 0),
                id_colaborador: Number(colabId),
                id_competencia: Number(it?.id_competencia ?? it?.competencia?.id_competencia ?? it?.competenciaId ?? 0),
                proeficiencia: Number(it?.proeficiencia ?? 0),
                ordem: it?.ordem ?? (null as unknown as number),
                competencia: competencias.find(c => c.id_competencia === Number(it?.id_competencia ?? it?.competencia?.id_competencia ?? it?.competenciaId ?? 0)),
              }))
              return [colabId, normalized] as const
            } catch {
              try {
                const res = await api.get<any[]>(`/colaboradores/${encodeURIComponent(colabId)}/competencias`)
                const raw = Array.isArray(res.data) ? res.data : []
                const normalized: ColaboradorCompetencia[] = []
                for (const it of raw) {
                  const maybeId: number | undefined = it?.id_competencia ?? it?.competencia?.id_competencia ?? nameToId.get(String(it?.nome ?? '').toLowerCase())
                  if (!maybeId) continue
                  normalized.push({
                    id: Number(it?.id ?? 0),
                    id_colaborador: Number(colabId),
                    id_competencia: Number(maybeId),
                    proeficiencia: Number(it?.proeficiencia ?? 0),
                    ordem: it?.ordem ?? (null as unknown as number),
                    competencia: competencias.find(c => c.id_competencia === Number(maybeId)),
                  })
                }
                return [colabId, normalized] as const
              } catch {
                return [colabId, []] as const
              }
            }
          })
        )
        const map: Record<number, ColaboradorCompetencia[]> = {}
        for (const [id, list] of pairs) {
          if (id && Number.isFinite(Number(id))) {
            map[Number(id)] = [...list]
          }
        }
        setCompetenciasByColab(map)
      } catch {}
    }
    loadCompetenciasByColab()
  }, [items, competencias])

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    let base = evaluations.slice()

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
  }, [q, evaluations, items, selectedSetor, selectedEquipe, selectedColaborador])

  async function openEvaluate(colabId: number, evaluation?: Avaliacao) {
    setEvaluationId(colabId)
    if (evaluation) {
      try {
        const res = await api.get(`/avaliacoes/${evaluation.id}`)
        const data = res.data
        setExistingEvaluation({
          id: data.id,
          competenciaId: data.competenciaId || 0,
          competenciaNome: data.competenciaNome || '',
          resumo: data.resumo || '',
          publico: data.publico ?? true,
          nota: data.nota ?? data.rating ?? undefined,
        })
      } catch (error) {
        console.error('Erro ao buscar avaliação:', error)
        setExistingEvaluation(null)
      }
    } else {
      setExistingEvaluation(null)
    }
    setEvalOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-full max-w-sm">
          <Input placeholder="Buscar avaliação por colaborador..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="inline-flex items-center gap-2">
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
                        {setores.filter(s => s.nome_setor.toLowerCase().includes(setorQuery.toLowerCase())).map(s => (
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
        <div className="ml-auto">
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="py-2 pr-4">Colaborador</th>
                <th className="py-2 pr-4">Competência</th>
                <th className="py-2 pr-4">Criada em</th>
                <th className="py-2 pr-4">Atualizada em</th>
                <th className="py-2 pr-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ev => {
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
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        {ev.competenciaNome ?? '—'}
                      </span>
                    </td>
                    <td className="py-3 pr-4">{ev.created_at ? new Date(ev.created_at).toLocaleString() : '—'}</td>
                    <td className="py-3 pr-4">{ev.updated_at ? new Date(ev.updated_at).toLocaleString() : '—'}</td>
                    <td className="py-3 pr-2 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEvaluate(Number(id), ev)}>Editar</Button>
                        <Button size="sm" onClick={() => openEvaluate(Number(id))}>Avaliar novamente</Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                    Nenhuma avaliação encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <EvaluateCollaboratorModal
        open={evalOpen}
        onOpenChange={setEvalOpen}
        evaluationId={evaluationId}
        setEvaluationId={(id) => setEvaluationId(id)}
        items={items}
        filteredIds={items.map(it => ((it as any).id_colaborador ?? (it as any).id) as number)}
        competenciasByColab={competenciasByColab}
        setores={setores}
        equipes={equipes}
        onSave={loadData}
        existingEvaluation={existingEvaluation}
      />
    </div>
  )
}


