import { useEffect, useMemo, useState } from 'react'
import { Input } from '@/shared/components/ui/input'
import { api } from '@/shared/lib/api'
import type { Squad, Colaborador, Setor, Equipe } from '@/shared/types'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ButtonGroup } from '@/shared/components/ui/button-group'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog'
import { Label } from '@/shared/components/ui/label'
import { toast } from 'sonner'
import { List, LayoutGrid, Plus, ChevronDown, ChevronRight, SquarePen } from 'lucide-react'
import { Card } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Roles } from '@/shared/constants/roles'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/shared/components/ui/command'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { useNavigate } from 'react-router-dom'
import { ItemGroup, ItemHeader, ItemTitle } from '@/shared/components/ui/item'

type ViewMode = 'table' | 'grid'

export function Squads() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<ViewMode>('grid')
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Squad[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [setores, setSetores] = useState<Setor[]>([])
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [initialLoading, setInitialLoading] = useState(true)

  const [addOpen, setAddOpen] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novaDesc, setNovaDesc] = useState('')
  const [selectedLeader, setSelectedLeader] = useState<number | 'none'>('none')
  const [saving, setSaving] = useState(false)
  const [leaderOpen, setLeaderOpen] = useState(false)
  const [leaderQuery, setLeaderQuery] = useState('')
  const [memberQuery, setMemberQuery] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<Set<number>>(new Set())
  const [filterSetor, setFilterSetor] = useState<number | 'all'>('all')
  const [filterEquipe, setFilterEquipe] = useState<number | 'all'>('all')

  const [showSetor, setShowSetor] = useState(false)
  const [showEquipe, setShowEquipe] = useState(false)
  const [setorQuery, setSetorQuery] = useState('')
  const [equipeQuery, setEquipeQuery] = useState('')

  const [leaderFilterSetor, setLeaderFilterSetor] = useState<number | 'all'>('all')
  const [leaderFilterEquipe, setLeaderFilterEquipe] = useState<number | 'all'>('all')
  const [leaderShowSetor, setLeaderShowSetor] = useState(false)
  const [leaderShowEquipe, setLeaderShowEquipe] = useState(false)
  const [leaderSetorQuery, setLeaderSetorQuery] = useState('')
  const [leaderEquipeQuery, setLeaderEquipeQuery] = useState('')

  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Squad | null>(null)
  const [editNome, setEditNome] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editLeader, setEditLeader] = useState<number | 'none'>('none')
  const [editMemberQuery, setEditMemberQuery] = useState('')
  const [editSelectedMembers, setEditSelectedMembers] = useState<Set<number>>(new Set())
  const [editInitialMembers, setEditInitialMembers] = useState<Set<number>>(new Set())
  const [editFilterSetor, setEditFilterSetor] = useState<number | 'all'>('all')
  const [editFilterEquipe, setEditFilterEquipe] = useState<number | 'all'>('all')
  const [editMembersShowSetor, setEditMembersShowSetor] = useState(false)
  const [editMembersShowEquipe, setEditMembersShowEquipe] = useState(false)
  const [editMembersSetorQuery, setEditMembersSetorQuery] = useState('')
  const [editMembersEquipeQuery, setEditMembersEquipeQuery] = useState('')
  const [editLeaderOpen, setEditLeaderOpen] = useState(false)
  const [editLeaderQuery, setEditLeaderQuery] = useState('')
  const [editLeaderFilterSetor, setEditLeaderFilterSetor] = useState<number | 'all'>('all')
  const [editLeaderFilterEquipe, setEditLeaderFilterEquipe] = useState<number | 'all'>('all')
  const [editLeaderShowSetor, setEditLeaderShowSetor] = useState(false)
  const [editLeaderShowEquipe, setEditLeaderShowEquipe] = useState(false)
  const [editLeaderSetorQuery, setEditLeaderSetorQuery] = useState('')
  const [editLeaderEquipeQuery, setEditLeaderEquipeQuery] = useState('')

  useEffect(() => {
    setInitialLoading(true)
    Promise.all([
      api.get<any[]>('/squads?status=all'),
      api.get('/colaboradores'),
      api.get<any[]>('/setores'),
      api.get<any[]>('/equipes?status=all'),
    ])
      .then(([sq, col, st, eq]) => {
        const mapped: Squad[] = (Array.isArray(sq.data) ? sq.data : []).map((vm: any) => ({
          id: vm.id ?? vm.id_squad ?? 0,
          nome: vm.nome ?? vm.nome_squad ?? '',
          descricao: vm.descricao ?? vm.desc_squad ?? null,
          status: vm.status ?? true,
          membrosCount: vm.membrosCount ?? 0,
          liderId: vm.liderId ?? null,
        }))
        setItems(mapped)
        setColaboradores((Array.isArray(col.data) ? col.data : []) as any)
        const mappedSetores: Setor[] = (Array.isArray(st.data) ? st.data : []).map((vm: any) => ({
          id_setor: vm.id ?? vm.id_setor,
          nome_setor: vm.nome ?? vm.nome_setor,
          desc_setor: vm.descricao ?? vm.desc_setor ?? null,
          status: vm.status ?? true,
          id_diretor: vm.diretorId ?? vm.id_diretor ?? null,
          diretor: null,
        }))
        setSetores(mappedSetores)
        const mappedEquipes: Equipe[] = (Array.isArray(eq.data) ? eq.data : []).map((vm: any) => ({
          id_equipe: vm.id ?? vm.id_equipe,
          nome_equipe: vm.nome ?? vm.nome_equipe,
          id_setor: vm.setorId ?? vm.id_setor ?? vm.setor?.id_setor,
          status: vm.status ?? true,
          setor: vm.setor ?? undefined,
        }))
        setEquipes(mappedEquipes)
      })
      .finally(() => setInitialLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return items
    return items.filter(s => (s.nome || '').toLowerCase().includes(t))
  }, [items, q])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-full max-w-xs">
          <Input placeholder="Buscar squad..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          {user?.role === Roles.Diretor && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="icon" className="fixed bottom-6 right-6 h-10 p-4 w-auto rounded-lg   shadow-lg">
                <Plus className="size-5" />
                <p>Novo squad</p>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[980px]">
              <DialogHeader>
                <DialogTitle>Novo squad</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="geral">
                <TabsList className="mb-3">
                  <TabsTrigger value="geral">Geral</TabsTrigger>
                  <TabsTrigger value="membros">Membros</TabsTrigger>
                </TabsList>
                <TabsContent value="geral" className="min-h-[520px]">
                  <div className="grid gap-4 py-2 lg:grid-cols-[1fr_minmax(260px,320px)]">
                    <div className="grid gap-3">
                      <div className="grid gap-1">
                        <Label htmlFor="nome-squad">Nome <span className="text-destructive">*</span></Label>
                        <Input
                          id="nome-squad"
                          value={novoNome}
                          onChange={(e) => setNovoNome(e.target.value.slice(0, 50))}
                          placeholder="Ex.: Squad Phoenix"
                        />
                        <div className="text-xs text-muted-foreground">{novoNome.length}/50</div>
                      </div>
                      <div className="grid gap-1">
                        <Label htmlFor="desc-squad">Descrição</Label>
                        <textarea
                          id="desc-squad"
                          rows={5}
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-y"
                          value={novaDesc}
                          onChange={(e) => setNovaDesc(e.target.value.slice(0, 100))}
                          placeholder="Contexto/propósito do squad (até 100 caracteres)"
                        />
                        <div className="text-xs text-muted-foreground">{(novaDesc ?? '').length}/100</div>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <div className="text-xs font-semibold text-muted-foreground">Pré-visualização</div>
                      <Card className="p-3">
                        <div className="font-semibold truncate">{novoNome || 'Nome do squad'}</div>
                        <div className="text-xs text-muted-foreground mt-1 leading-snug break-words">{novaDesc || 'Descrição breve do propósito do squad.'}</div>
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <Card className="px-3 py-2">
                            <div className="text-[11px] text-muted-foreground">Membros</div>
                            <div className="text-sm font-medium">{(selectedLeader === 'none' ? 0 : 1) + selectedMembers.size}</div>
                          </Card>
                          <Card className="px-3 py-2">
                            <div className="text-[11px] text-muted-foreground">Líder</div>
                            <div className="text-sm font-medium truncate">
                              {(() => {
                                if (selectedLeader === 'none') return '—'
                                const lead = colaboradores.find(c => ((c as any).id ?? (c as any).id_colaborador) === selectedLeader)
                                return lead ? `${lead.nome} ${lead.sobrenome}`.trim() : '—'
                              })()}
                            </div>
                          </Card>
                        </div>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="membros" className="min-h-[520px]">
                  <div className="grid gap-4 py-2">
                    <div className="grid gap-1">
                      <Label>Líder do squad <span className="text-destructive">*</span></Label>
                      <div className="relative">
                        <div
                          className="inline-flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm cursor-pointer"
                          onClick={() => setLeaderOpen((v) => !v)}
                        >
                          <span className="truncate">
                            {(() => {
                              if (selectedLeader === 'none') return 'Selecione um líder'
                              const lead = colaboradores.find(c => ((c as any).id ?? (c as any).id_colaborador) === selectedLeader)
                              return lead ? `${lead.nome} ${lead.sobrenome}`.trim() : 'Selecione um líder'
                            })()}
                          </span>
                          <ChevronDown className="size-4 opacity-60" />
                        </div>
                        {leaderOpen && (
                          <div className="absolute z-20 mt-1">
                            <div className="w-[420px] rounded-md border bg-popover shadow-xs">
                              <div className="p-2 border-b bg-background/60">
                                <div className="flex items-center gap-2">
                                  {/* Filtros de líder (comboboxes pesquisáveis) */}
                                  <div className="relative">
                                    <div className="inline-flex h-8 items-center gap-2 rounded-md border px-2 text-xs cursor-pointer" onClick={() => { setLeaderShowSetor((v) => !v); setLeaderShowEquipe(false) }}>
                                      <span className="truncate max-w-[8rem]">{leaderFilterSetor === 'all' ? 'Todos os setores' : setores.find(s => s.id_setor === leaderFilterSetor)?.nome_setor ?? 'Setor'}</span>
                                      <ChevronDown className="size-3 opacity-60" />
                                    </div>
                                    {leaderShowSetor && (
                                      <div className="absolute z-30 mt-1 w-56 rounded-md border bg-popover shadow-xs">
                                        <Command>
                                          <CommandInput placeholder="Filtrar setor..." value={leaderSetorQuery} onValueChange={setLeaderSetorQuery} />
                                          <CommandList>
                                            <CommandEmpty>Nenhum setor</CommandEmpty>
                                            <CommandGroup>
                                              <CommandItem onSelect={() => { setLeaderFilterSetor('all'); setLeaderShowSetor(false); setLeaderSetorQuery(''); setLeaderFilterEquipe('all') }}>Todos</CommandItem>
                                              {setores.filter(s => s.nome_setor.toLowerCase().includes(leaderSetorQuery.toLowerCase())).map(s => (
                                                <CommandItem key={s.id_setor} onSelect={() => { setLeaderFilterSetor(s.id_setor); setLeaderShowSetor(false); setLeaderSetorQuery(''); setLeaderFilterEquipe('all') }}>{s.nome_setor}</CommandItem>
                                              ))}
                                            </CommandGroup>
                                          </CommandList>
                                        </Command>
                                      </div>
                                    )}
                                  </div>
                                  <div className="relative">
                                    <div className="inline-flex h-8 items-center gap-2 rounded-md border px-2 text-xs cursor-pointer" onClick={() => { setLeaderShowEquipe((v) => !v); setLeaderShowSetor(false) }}>
                                      <span className="truncate max-w-[8rem]">{leaderFilterEquipe === 'all' ? 'Todas as equipes' : equipes.find(e => e.id_equipe === leaderFilterEquipe)?.nome_equipe ?? 'Equipe'}</span>
                                      <ChevronDown className="size-3 opacity-60" />
                                    </div>
                                    {leaderShowEquipe && (
                                      <div className="absolute z-30 mt-1 w-56 rounded-md border bg-popover shadow-xs">
                                        <Command>
                                          <CommandInput placeholder="Filtrar equipe..." value={leaderEquipeQuery} onValueChange={setLeaderEquipeQuery} />
                                          <CommandList>
                                            <CommandEmpty>Nenhuma equipe</CommandEmpty>
                                            <CommandGroup>
                                              <CommandItem onSelect={() => { setLeaderFilterEquipe('all'); setLeaderShowEquipe(false); setLeaderEquipeQuery('') }}>Todas</CommandItem>
                                              {(leaderFilterSetor === 'all' ? equipes : equipes.filter(e => e.id_setor === leaderFilterSetor))
                                                .filter(e => e.nome_equipe.toLowerCase().includes(leaderEquipeQuery.toLowerCase()))
                                                .map(e => (
                                                  <CommandItem key={e.id_equipe} onSelect={() => { setLeaderFilterEquipe(e.id_equipe); setLeaderShowEquipe(false); setLeaderEquipeQuery('') }}>{e.nome_equipe}</CommandItem>
                                                ))}
                                            </CommandGroup>
                                          </CommandList>
                                        </Command>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <ScrollArea className="h-72">
                                <Command>
                                  <div className="p-2">
                                    <CommandInput placeholder="Buscar colaborador..." value={leaderQuery} onValueChange={setLeaderQuery} />
                                  </div>
                                  <CommandList className="max-h-none overflow-visible">
                                    <CommandEmpty>Nenhum colaborador</CommandEmpty>
                                    <CommandGroup>
                                      {colaboradores
                                        .filter(c => {
                                          if (leaderFilterSetor !== 'all') {
                                            const sid = (c as any).idSetor ?? c.equipe?.setor?.id_setor ?? (c as any).id_setor
                                            if (sid !== leaderFilterSetor) return false
                                          }
                                          if (leaderFilterEquipe !== 'all') {
                                            const eid = (c as any).idEquipe ?? c.equipe?.id_equipe ?? (c as any).id_equipe
                                            if (eid !== leaderFilterEquipe) return false
                                          }
                                          const t = leaderQuery.trim().toLowerCase()
                                          if (!t) return true
                                          const nome = `${c.nome} ${c.sobrenome}`.toLowerCase()
                                          const email = (c as any)?.email?.toLowerCase?.() ?? ''
                                          return nome.includes(t) || email.includes(t)
                                        })
                                        .map(c => {
                                          const id = (c as any).id ?? (c as any).id_colaborador
                                          const foto = (c as any).avatar as unknown
                                          const src = (() => {
                                            if (!foto) return ''
                                            const s = String(foto)
                                            return s.startsWith('data:') ? s : `data:image/png;base64,${s}`
                                          })()
                                          return (
                                            <CommandItem
                                              key={id}
                                              onSelect={() => { setSelectedLeader(id); setLeaderOpen(false); setLeaderQuery('') }}
                                            >
                                              <div className="flex items-center gap-2">
                                                <Avatar className="size-6">
                                                  <AvatarImage src={src || undefined} alt="" />
                                                  <AvatarFallback className="text-[10px]">{(c.nome?.[0] ?? '?').toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <span className="truncate">{c.nome} {c.sobrenome}</span>
                                              </div>
                                            </CommandItem>
                                          )
                                        })}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </ScrollArea>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">O líder também será membro do squad automaticamente.</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Combobox Setor */}
                      <div className="relative">
                        <div className="inline-flex h-8 items-center gap-2 rounded-md border px-3 text-sm cursor-pointer" onClick={() => { setShowSetor((v) => !v); setShowEquipe(false) }}>
                          <span className="truncate max-w-[12rem]">{filterSetor === 'all' ? 'Todos os setores' : setores.find(s => s.id_setor === filterSetor)?.nome_setor ?? 'Setor'}</span>
                          <ChevronDown className="size-4 opacity-60" />
                        </div>
                        {showSetor && (
                          <div className="absolute z-20 mt-1 w-56 rounded-md border bg-popover shadow-xs">
                            <Command>
                              <CommandInput placeholder="Filtrar setor..." value={setorQuery} onValueChange={setSetorQuery} />
                              <CommandList>
                                <CommandEmpty>Nenhum setor</CommandEmpty>
                                <CommandGroup>
                                  <CommandItem onSelect={() => { setFilterSetor('all'); setFilterEquipe('all'); setShowSetor(false); setSetorQuery('') }}>Todos</CommandItem>
                                  {setores.filter(s => s.nome_setor.toLowerCase().includes(setorQuery.toLowerCase())).map(s => (
                                    <CommandItem key={s.id_setor} onSelect={() => { setFilterSetor(s.id_setor); setFilterEquipe('all'); setShowSetor(false); setSetorQuery('') }}>{s.nome_setor}</CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </div>
                        )}
                      </div>
                      {/* Combobox Equipe */}
                      <div className="relative">
                        <div className="inline-flex h-8 items-center gap-2 rounded-md border px-3 text-sm cursor-pointer" onClick={() => { setShowEquipe((v) => !v); setShowSetor(false) }}>
                          <span className="truncate max-w-[12rem]">{filterEquipe === 'all' ? 'Todas as equipes' : equipes.find(e => e.id_equipe === filterEquipe)?.nome_equipe ?? 'Equipe'}</span>
                          <ChevronDown className="size-4 opacity-60" />
                        </div>
                        {showEquipe && (
                          <div className="absolute z-20 mt-1 w-56 rounded-md border bg-popover shadow-xs">
                            <Command>
                              <CommandInput placeholder="Filtrar equipe..." value={equipeQuery} onValueChange={setEquipeQuery} />
                              <CommandList>
                                <CommandEmpty>Nenhuma equipe</CommandEmpty>
                                <CommandGroup>
                                  <CommandItem onSelect={() => { setFilterEquipe('all'); setShowEquipe(false); setEquipeQuery('') }}>Todas</CommandItem>
                                  {(filterSetor === 'all' ? equipes : equipes.filter(e => e.id_setor === filterSetor))
                                    .filter(e => e.nome_equipe.toLowerCase().includes(equipeQuery.toLowerCase()))
                                    .map(e => (
                                      <CommandItem key={e.id_equipe} onSelect={() => { setFilterEquipe(e.id_equipe); setShowEquipe(false); setEquipeQuery('') }}>{e.nome_equipe}</CommandItem>
                                    ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </div>
                        )}
                      </div>
                      <div className="w-full max-w-sm ml-auto">
                        <Input
                          placeholder="Buscar colaborador por nome ou email..."
                          value={memberQuery}
                          onChange={(e) => setMemberQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    <ScrollArea className="h-64 rounded-md border">
                      <div className="p-2 space-y-1">
                        {colaboradores
                          .filter(c => {
                            if (filterSetor !== 'all') {
                              const sid = (c as any).idSetor ?? c.equipe?.setor?.id_setor ?? (c as any).id_setor
                              if (sid !== filterSetor) return false
                            }
                            if (filterEquipe !== 'all') {
                              const eid = (c as any).idEquipe ?? c.equipe?.id_equipe ?? (c as any).id_equipe
                              if (eid !== filterEquipe) return false
                            }
                            const t = memberQuery.trim().toLowerCase()
                            if (!t) return true
                            const nome = `${c.nome} ${c.sobrenome}`.toLowerCase()
                            const email = (c as any)?.email?.toLowerCase?.() ?? ''
                            return nome.includes(t) || email.includes(t)
                          })
                          .map(c => {
                            const id = Number((c as any).id ?? (c as any).id_colaborador)
                            const isLeader = (selectedLeader !== 'none' && id === Number(selectedLeader))
                            const checked = selectedMembers.has(id)
                            return (
                              <label key={id} className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm ${isLeader ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:bg-accent/60'}`}>
                                <Checkbox
                                  disabled={isLeader}
                                  checked={checked || isLeader}
                                  onCheckedChange={(v) => {
                                    const next = new Set(selectedMembers)
                                    if (v === true) next.add(id); else next.delete(id)
                                    setSelectedMembers(next)
                                  }}
                                />
                                <span className="truncate">{c.nome} {c.sobrenome}</span>
                              </label>
                            )
                          })}
                      </div>
                    </ScrollArea>
                    <div className="text-xs text-muted-foreground">
                      Selecionados: {selectedMembers.size + (selectedLeader === 'none' ? 0 : 1)}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              <DialogFooter>
                <Button
                  disabled={saving || novoNome.trim().length === 0 || selectedLeader === 'none'}
                  onClick={async () => {
                    const nome = novoNome.trim()
                    if (!nome || selectedLeader === 'none') return
                    setSaving(true)
                    try {
                    const payload: any = { nome, descricao: (novaDesc || null), liderId: selectedLeader }
                      const { data } = await api.post<any>('/squads', payload)
                      const vm: any = data
                      const created: Squad = {
                        id: vm.id ?? 0,
                        nome: vm.nome ?? nome,
                        descricao: vm.descricao ?? (novaDesc || null),
                        status: vm.status ?? true,
                      membrosCount: vm.membrosCount ?? 0,
                      liderId: vm.liderId ?? selectedLeader,
                      }
                      setItems(prev => [...prev, created])
                      const targetId = vm.id ?? created.id
                      const toAdd = Array.from(selectedMembers).filter(mid => mid !== selectedLeader)
                      for (const mid of toAdd) {
                        try { await api.post(`/squads/${encodeURIComponent(targetId)}/colaboradores`, { colaboradorId: mid }) } catch {}
                      }
                      if (toAdd.length > 0) {
                        setItems(prev => prev.map(s => s.id === targetId ? { ...s, membrosCount: (s.membrosCount ?? 0) + toAdd.length } : s))
                      }
                      toast.success('Squad criado')
                      setAddOpen(false)
                      setNovoNome('')
                      setNovaDesc('')
                      setSelectedLeader('none')
                      setSelectedMembers(new Set())
                      setFilterSetor('all')
                      setFilterEquipe('all')
                      setMemberQuery('')
                    } finally {
                      setSaving(false)
                    }
                  }}
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          )}
          <ButtonGroup>
            <Button variant={mode === 'table' ? 'default' : 'outline'} size="icon" className="transition-none" onClick={() => setMode('table')}>
              <List size={20} strokeWidth={2} absoluteStrokeWidth shapeRendering="geometricPrecision" />
            </Button>
            <Button variant={mode === 'grid' ? 'default' : 'outline'} size="icon" className="transition-none" onClick={() => setMode('grid')}>
              <LayoutGrid size={20} strokeWidth={2} absoluteStrokeWidth shapeRendering="geometricPrecision" />
            </Button>
          </ButtonGroup>
        </div>
      </div>

      {initialLoading ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-full max-w-sm">
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Skeleton className="h-8 w-24" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, idx) => (
                <div key={idx} className="rounded-lg border p-4">
                  <Skeleton className="h-5 w-40" />
                  <div className="mt-2 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <div className="grid grid-cols-2 gap-2">
                      <Skeleton className="h-14 w-full" />
                      <Skeleton className="h-14 w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : mode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="py-2 pr-4">Squad</th>
                <th className="py-2 pr-4">Membros</th>
                <th className="py-2 pr-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={3} className="pt-4 pb-2 text-xs font-semibold text-muted-foreground">Ativos</td>
              </tr>
              {filtered.filter(s => s.status !== false).map(sq => (
                <tr key={sq.id} className="border-t hover:bg-accent/40">
                  <td className="py-3 pr-4 font-medium">{sq.nome}</td>
                  <td className="py-3 pr-4">{sq.membrosCount ?? 0}</td>
                  <td className="py-3 pr-2 text-right">
                    <div className="inline-flex items-center gap-2">
                      {user?.role === Roles.Diretor && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditTarget(sq)
                              setEditNome(sq.nome)
                              setEditDesc(sq.descricao || '')
                              setEditLeader((sq.liderId ?? null) == null ? 'none' : Number(sq.liderId))
                              ;(async () => {
                                try {
                                  const res = await api.get<any[]>(`/squads/${encodeURIComponent(sq.id)}/colaboradores`)
                                  const ids = new Set<number>()
                                  const raw = Array.isArray(res.data) ? res.data : []
                                  for (const it of raw) {
                                    const idValue = (typeof it === 'object') ? ((it as any).id ?? (it as any).id_colaborador) : it
                                    const idNum = Number(idValue)
                                    if (Number.isFinite(idNum)) ids.add(idNum)
                                  }
                                  setEditInitialMembers(new Set(ids))
                                  const leaderId = (sq.liderId ?? null) == null ? null : Number(sq.liderId)
                                  const withoutLeader = new Set<number>(Array.from(ids).filter(id => id !== leaderId))
                                  setEditSelectedMembers(withoutLeader)
                                } catch {
                                  setEditInitialMembers(new Set())
                                  setEditSelectedMembers(new Set())
                                }
                                setEditFilterSetor('all')
                                setEditFilterEquipe('all')
                                setEditMemberQuery('')
                              })()
                              setEditOpen(true)
                            }}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                await api.delete(`/squads/${encodeURIComponent(sq.id)}`)
                                setItems(prev => prev.map(it => it.id === sq.id ? { ...it, status: false } : it))
                                toast.success('Squad desativado')
                              } catch {}
                            }}
                          >
                            Desativar
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.some(s => s.status === false) && (
                <tr>
                  <td colSpan={3} className="pt-6 pb-2 text-xs font-semibold text-muted-foreground">Inativos</td>
                </tr>
              )}
              {filtered.filter(s => s.status === false).map(sq => (
                <tr key={sq.id} className="border-t opacity-70">
                  <td className="py-3 pr-4 font-medium">{sq.nome}</td>
                  <td className="py-3 pr-4">{sq.membrosCount ?? 0}</td>
                  <td className="py-3 pr-2 text-right">
                    <div className="inline-flex items-center gap-2">
                      {user?.role === Roles.Diretor && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditTarget(sq)
                              setEditNome(sq.nome)
                              setEditDesc(sq.descricao || '')
                              setEditLeader((sq.liderId ?? null) == null ? 'none' : Number(sq.liderId))
                              setEditOpen(true)
                            }}
                          >
                            Editar
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <div className="mb-2 text-xs font-semibold text-muted-foreground">Ativos</div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.filter(s => s.status !== false).map(sq => (
                <div
                  key={sq.id}
                  className="group relative flex flex-col rounded-lg border bg-card p-4 text-left transition hover:bg-accent/50 cursor-pointer"
                  onClick={() => {
                    navigate(`/dashboard/colaboradores?squad=${encodeURIComponent(sq.id)}`)
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      navigate(`/dashboard/colaboradores?squad=${encodeURIComponent(sq.id)}`)
                    }
                  }}
                >
                  <ItemGroup>
                    <ItemHeader>
                      <ItemTitle>
                        <span className="truncate">{sq.nome}</span>
                      </ItemTitle>
                      <div className="flex items-center gap-1">
                        {user?.role === Roles.Diretor && (
                          <button
                            type="button"
                            className="inline-flex items-center p-0.5 text-muted-foreground opacity-70 hover:opacity-100 hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditTarget(sq)
                              setEditNome(sq.nome)
                              setEditDesc(sq.descricao || '')
                              setEditLeader((sq.liderId ?? null) == null ? 'none' : Number(sq.liderId))
                              setEditOpen(true)
                            }}
                            aria-label="Editar squad"
                          >
                            <SquarePen className="size-3.5" />
                          </button>
                        )}
                        <ChevronRight className="size-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </ItemHeader>
                    {sq.descricao && (
                      <div className="text-xs text-muted-foreground mt-1 leading-snug break-words" title={sq.descricao || undefined}>{sq.descricao}</div>
                    )}
                  </ItemGroup>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <Card className="px-3 py-2">
                      <div className="text-[11px] text-muted-foreground">Membros</div>
                      <div className="text-sm font-medium truncate">{sq.membrosCount ?? 0}</div>
                    </Card>
                    <Card className="px-3 py-2">
                      <div className="text-[11px] text-muted-foreground">Líder</div>
                      <div className="text-sm font-medium truncate">
                        {(() => {
                          const lead = colaboradores.find(c => ((c as any).id ?? (c as any).id_colaborador) === (sq.liderId ?? -1))
                          return lead ? `${lead.nome} ${lead.sobrenome}`.trim() : '—'
                        })()}
                      </div>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {filtered.some(s => s.status === false) && (
            <div>
              <div className="mb-2 text-xs font-semibold text-muted-foreground">Inativos</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.filter(s => s.status === false).map(sq => (
                  <div
                    key={sq.id}
                    className="group relative flex flex-col rounded-lg border bg-card p-4 text-left transition hover:bg-accent/50 cursor-pointer opacity-75"
                    onClick={() => {
                      navigate(`/dashboard/colaboradores?squad=${encodeURIComponent(sq.id)}`)
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        navigate(`/dashboard/colaboradores?squad=${encodeURIComponent(sq.id)}`)
                      }
                    }}
                  >
                    <ItemGroup>
                      <ItemHeader>
                        <ItemTitle>
                          <span className="truncate">{sq.nome}</span>
                        </ItemTitle>
                        <div className="flex items-center gap-1">
                          {user?.role === Roles.Diretor && (
                            <button
                              type="button"
                              className="inline-flex items-center p-0.5 text-muted-foreground opacity-70 hover:opacity-100 hover:text-foreground"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditTarget(sq)
                                setEditNome(sq.nome)
                                setEditDesc(sq.descricao || '')
                                setEditLeader((sq.liderId ?? null) == null ? 'none' : Number(sq.liderId))
                                setEditOpen(true)
                              }}
                              aria-label="Editar squad"
                            >
                              <SquarePen className="size-3.5" />
                            </button>
                          )}
                          <ChevronRight className="size-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </ItemHeader>
                      {sq.descricao && (
                        <div className="text-xs text-muted-foreground mt-1 leading-snug break-words" title={sq.descricao || undefined}>{sq.descricao}</div>
                      )}
                    </ItemGroup>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <Card className="px-3 py-2">
                        <div className="text-[11px] text-muted-foreground">Membros</div>
                        <div className="text-sm font-medium truncate">{sq.membrosCount ?? 0}</div>
                      </Card>
                      <Card className="px-3 py-2">
                        <div className="text-[11px] text-muted-foreground">Líder</div>
                        <div className="text-sm font-medium truncate">
                          {(() => {
                            const lead = colaboradores.find(c => ((c as any).id ?? (c as any).id_colaborador) === (sq.liderId ?? -1))
                            return lead ? `${lead.nome} ${lead.sobrenome}`.trim() : '—'
                          })()}
                        </div>
                      </Card>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[980px]">
          <DialogHeader>
            <DialogTitle>Editar squad</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="geral">
            <TabsList className="mb-3">
              <TabsTrigger value="geral">Geral</TabsTrigger>
              <TabsTrigger value="membros">Membros</TabsTrigger>
            </TabsList>
            <TabsContent value="geral" className="min-h-[520px]">
              <div className="grid gap-4 py-2 lg:grid-cols-[1fr_minmax(260px,320px)]">
                <div className="grid gap-3">
                  <div className="grid gap-1">
                    <Label htmlFor="edit-nome-squad">Nome</Label>
                    <Input id="edit-nome-squad" value={editNome} onChange={(e) => setEditNome(e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="edit-desc-squad">Descrição</Label>
                    <textarea
                      id="edit-desc-squad"
                      rows={5}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-y"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="Opcional"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label>Líder do squad</Label>
                    <div className="relative">
                      <div
                        className="inline-flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm cursor-pointer"
                        onClick={() => setEditLeaderOpen((v) => !v)}
                      >
                        <span className="truncate">
                          {(() => {
                            if (editLeader === 'none') return 'Selecione um líder'
                            const lead = colaboradores.find(c => ((c as any).id ?? (c as any).id_colaborador) === editLeader)
                            return lead ? `${lead.nome} ${lead.sobrenome}`.trim() : 'Selecione um líder'
                          })()}
                        </span>
                        <ChevronDown className="size-4 opacity-60" />
                      </div>
                      {editLeaderOpen && (
                        <div className="absolute z-20 mt-1">
                          <div className="w-[420px] rounded-md border bg-popover shadow-xs">
                            <div className="p-2 border-b bg-background/60">
                              <div className="flex items-center gap-2">
                                <div className="relative">
                                  <div className="inline-flex h-8 items-center gap-2 rounded-md border px-2 text-xs cursor-pointer" onClick={() => { setEditLeaderShowSetor((v) => !v); setEditLeaderShowEquipe(false) }}>
                                    <span className="truncate max-w-[8rem]">{editLeaderFilterSetor === 'all' ? 'Todos os setores' : setores.find(s => s.id_setor === editLeaderFilterSetor)?.nome_setor ?? 'Setor'}</span>
                                    <ChevronDown className="size-3 opacity-60" />
                                  </div>
                                  {editLeaderShowSetor && (
                                    <div className="absolute z-30 mt-1 w-56 rounded-md border bg-popover shadow-xs">
                                      <Command>
                                        <CommandInput placeholder="Filtrar setor..." value={editLeaderSetorQuery} onValueChange={setEditLeaderSetorQuery} />
                                        <CommandList>
                                          <CommandEmpty>Nenhum setor</CommandEmpty>
                                          <CommandGroup>
                                            <CommandItem onSelect={() => { setEditLeaderFilterSetor('all'); setEditLeaderShowSetor(false); setEditLeaderSetorQuery(''); setEditLeaderFilterEquipe('all') }}>Todos</CommandItem>
                                            {setores.filter(s => s.nome_setor.toLowerCase().includes(editLeaderSetorQuery.toLowerCase())).map(s => (
                                              <CommandItem key={s.id_setor} onSelect={() => { setEditLeaderFilterSetor(s.id_setor); setEditLeaderFilterEquipe('all'); setEditLeaderShowSetor(false); setEditLeaderSetorQuery('') }}>{s.nome_setor}</CommandItem>
                                            ))}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </div>
                                  )}
                                </div>
                                <div className="relative">
                                  <div className="inline-flex h-8 items-center gap-2 rounded-md border px-2 text-xs cursor-pointer" onClick={() => { setEditLeaderShowEquipe((v) => !v); setEditLeaderShowSetor(false) }}>
                                    <span className="truncate max-w-[8rem]">{editLeaderFilterEquipe === 'all' ? 'Todas as equipes' : equipes.find(e => e.id_equipe === editLeaderFilterEquipe)?.nome_equipe ?? 'Equipe'}</span>
                                    <ChevronDown className="size-3 opacity-60" />
                                  </div>
                                  {editLeaderShowEquipe && (
                                    <div className="absolute z-30 mt-1 w-56 rounded-md border bg-popover shadow-xs">
                                      <Command>
                                        <CommandInput placeholder="Filtrar equipe..." value={editLeaderEquipeQuery} onValueChange={setEditLeaderEquipeQuery} />
                                        <CommandList>
                                          <CommandEmpty>Nenhuma equipe</CommandEmpty>
                                          <CommandGroup>
                                            <CommandItem onSelect={() => { setEditLeaderFilterEquipe('all'); setEditLeaderShowEquipe(false); setEditLeaderEquipeQuery('') }}>Todas</CommandItem>
                                            {(editLeaderFilterSetor === 'all' ? equipes : equipes.filter(e => e.id_setor === editLeaderFilterSetor))
                                              .filter(e => e.nome_equipe.toLowerCase().includes(editLeaderEquipeQuery.toLowerCase()))
                                              .map(e => (
                                                <CommandItem key={e.id_equipe} onSelect={() => { setEditLeaderFilterEquipe(e.id_equipe); setEditLeaderShowEquipe(false); setEditLeaderEquipeQuery('') }}>{e.nome_equipe}</CommandItem>
                                              ))}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <ScrollArea className="h-72">
                              <Command>
                                <div className="p-2">
                                  <CommandInput placeholder="Buscar colaborador..." value={editLeaderQuery} onValueChange={setEditLeaderQuery} />
                                </div>
                                <CommandList className="max-h-none overflow-visible">
                                  <CommandEmpty>Nenhum colaborador</CommandEmpty>
                                  <CommandGroup>
                                    {colaboradores
                                      .filter(c => {
                                        if (editLeaderFilterSetor !== 'all') {
                                          const sid = (c as any).idSetor ?? c.equipe?.setor?.id_setor ?? (c as any).id_setor
                                          if (sid !== editLeaderFilterSetor) return false
                                        }
                                        if (editLeaderFilterEquipe !== 'all') {
                                          const eid = (c as any).idEquipe ?? c.equipe?.id_equipe ?? (c as any).id_equipe
                                          if (eid !== editLeaderFilterEquipe) return false
                                        }
                                        const t = editLeaderQuery.trim().toLowerCase()
                                        if (!t) return true
                                        const nome = `${c.nome} ${c.sobrenome}`.toLowerCase()
                                        const email = (c as any)?.email?.toLowerCase?.() ?? ''
                                        return nome.includes(t) || email.includes(t)
                                      })
                                      .map(c => {
                                        const id = (c as any).id ?? (c as any).id_colaborador
                                        const foto = (c as any).avatar as unknown
                                        const src = (() => {
                                          if (!foto) return ''
                                          const s = String(foto)
                                          return s.startsWith('data:') ? s : `data:image/png;base64,${s}`
                                        })()
                                        return (
                                          <CommandItem
                                            key={id}
                                            onSelect={() => { setEditLeader(id); setEditLeaderOpen(false); setEditLeaderQuery('') }}
                                          >
                                            <div className="flex items-center gap-2">
                                              <Avatar className="size-6">
                                                <AvatarImage src={src || undefined} alt="" />
                                                <AvatarFallback className="text-[10px]">{(c.nome?.[0] ?? '?').toUpperCase()}</AvatarFallback>
                                              </Avatar>
                                              <span className="truncate">{c.nome} {c.sobrenome}</span>
                                            </div>
                                          </CommandItem>
                                        )
                                      })}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </ScrollArea>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">O líder também será membro do squad automaticamente.</div>
                  </div>
                </div>
                <div className="grid gap-2">
                  <div className="text-xs font-semibold text-muted-foreground">Pré-visualização</div>
                  <Card className="p-3">
                    <div className="font-semibold truncate">{editNome || 'Nome do squad'}</div>
                    <div className="text-xs text-muted-foreground mt-1 leading-snug break-words">{editDesc || 'Descrição breve do propósito do squad.'}</div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <Card className="px-3 py-2">
                        <div className="text-[11px] text-muted-foreground">Membros</div>
                        <div className="text-sm font-medium">{(editSelectedMembers.size) + (editLeader === 'none' ? 0 : 1)}</div>
                      </Card>
                      <Card className="px-3 py-2">
                        <div className="text-[11px] text-muted-foreground">Líder</div>
                        <div className="text-sm font-medium truncate">
                          {(() => {
                            if (editLeader === 'none') return '—'
                            const lead = colaboradores.find(c => ((c as any).id ?? (c as any).id_colaborador) === editLeader)
                            return lead ? `${lead.nome} ${lead.sobrenome}`.trim() : '—'
                          })()}
                        </div>
                      </Card>
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="membros" className="min-h-[520px]">
              <div className="grid gap-4 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <div className="inline-flex h-8 items-center gap-2 rounded-md border px-3 text-sm cursor-pointer" onClick={() => { setEditMembersShowSetor((v) => !v); setEditMembersShowEquipe(false) }}>
                      <span className="truncate max-w-[12rem]">{editFilterSetor === 'all' ? 'Todos os setores' : setores.find(s => s.id_setor === editFilterSetor)?.nome_setor ?? 'Setor'}</span>
                      <ChevronDown className="size-4 opacity-60" />
                    </div>
                    {editMembersShowSetor && (
                      <div className="absolute z-20 mt-1 w-56 rounded-md border bg-popover shadow-xs">
                        <Command>
                          <CommandInput placeholder="Filtrar setor..." value={editMembersSetorQuery} onValueChange={setEditMembersSetorQuery} />
                          <CommandList>
                            <CommandEmpty>Nenhum setor</CommandEmpty>
                            <CommandGroup>
                              <CommandItem onSelect={() => { setEditFilterSetor('all'); setEditFilterEquipe('all'); setEditMembersShowSetor(false); setEditMembersSetorQuery('') }}>Todos</CommandItem>
                              {setores.filter(s => s.nome_setor.toLowerCase().includes(editMembersSetorQuery.toLowerCase())).map(s => (
                                <CommandItem key={s.id_setor} onSelect={() => { setEditFilterSetor(s.id_setor); setEditFilterEquipe('all'); setEditMembersShowSetor(false); setEditMembersSetorQuery('') }}>{s.nome_setor}</CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <div className="inline-flex h-8 items-center gap-2 rounded-md border px-3 text-sm cursor-pointer" onClick={() => { setEditMembersShowEquipe((v) => !v); setEditMembersShowSetor(false) }}>
                      <span className="truncate max-w-[12rem]">{editFilterEquipe === 'all' ? 'Todas as equipes' : equipes.find(e => e.id_equipe === editFilterEquipe)?.nome_equipe ?? 'Equipe'}</span>
                      <ChevronDown className="size-4 opacity-60" />
                    </div>
                    {editMembersShowEquipe && (
                      <div className="absolute z-20 mt-1 w-56 rounded-md border bg-popover shadow-xs">
                        <Command>
                          <CommandInput placeholder="Filtrar equipe..." value={editMembersEquipeQuery} onValueChange={setEditMembersEquipeQuery} />
                          <CommandList>
                            <CommandEmpty>Nenhuma equipe</CommandEmpty>
                            <CommandGroup>
                              <CommandItem onSelect={() => { setEditFilterEquipe('all'); setEditMembersShowEquipe(false); setEditMembersEquipeQuery('') }}>Todas</CommandItem>
                              {(editFilterSetor === 'all' ? equipes : equipes.filter(e => e.id_setor === editFilterSetor))
                                .filter(e => e.nome_equipe.toLowerCase().includes(editMembersEquipeQuery.toLowerCase()))
                                .map(e => (
                                  <CommandItem key={e.id_equipe} onSelect={() => { setEditFilterEquipe(e.id_equipe); setEditMembersShowEquipe(false); setEditMembersEquipeQuery('') }}>{e.nome_equipe}</CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </div>
                    )}
                  </div>
                  <div className="w-full max-w-sm ml-auto">
                    <Input
                      placeholder="Buscar colaborador por nome ou email..."
                      value={editMemberQuery}
                      onChange={(e) => setEditMemberQuery(e.target.value)}
                    />
                  </div>
                </div>
                <ScrollArea className="h-64 rounded-md border">
                  <div className="p-2 space-y-1">
                    {colaboradores
                      .filter(c => {
                        if (editFilterSetor !== 'all') {
                          const sid = (c as any).idSetor ?? c.equipe?.setor?.id_setor ?? (c as any).id_setor
                          if (sid !== editFilterSetor) return false
                        }
                        if (editFilterEquipe !== 'all') {
                          const eid = (c as any).idEquipe ?? c.equipe?.id_equipe ?? (c as any).id_equipe
                          if (eid !== editFilterEquipe) return false
                        }
                        const t = editMemberQuery.trim().toLowerCase()
                        if (!t) return true
                        const nome = `${c.nome} ${c.sobrenome}`.toLowerCase()
                        const email = (c as any)?.email?.toLowerCase?.() ?? ''
                        return nome.includes(t) || email.includes(t)
                      })
                      .map(c => {
                        const id = Number((c as any).id ?? (c as any).id_colaborador)
                        const isLeader = (editLeader !== 'none' && id === Number(editLeader))
                        const checked = editSelectedMembers.has(id) || isLeader
                        return (
                          <label key={id} className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm ${isLeader ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:bg-accent/60'}`}>
                            <Checkbox
                              disabled={isLeader}
                              checked={checked}
                              onCheckedChange={(v) => {
                                const next = new Set(editSelectedMembers)
                                if (v === true) next.add(id); else next.delete(id)
                                setEditSelectedMembers(next)
                              }}
                            />
                            <span className="truncate">{c.nome} {c.sobrenome}</span>
                          </label>
                        )
                      })}
                  </div>
                </ScrollArea>
                <div className="text-xs text-muted-foreground">
                  Selecionados: {editSelectedMembers.size + (editLeader === 'none' ? 0 : 1)}
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            {editTarget && editTarget.status && (
              <Button
                variant="outline"
                disabled={saving}
                onClick={async () => {
                  if (!editTarget) return
                  setSaving(true)
                  try {
                    await api.delete(`/squads/${encodeURIComponent(editTarget.id)}`)
                    setItems(prev => prev.map(s => s.id === editTarget.id ? { ...s, status: false } : s))
                    toast.success('Squad desativado')
                    setEditOpen(false)
                  } finally {
                    setSaving(false)
                  }
                }}
              >
                Desativar
              </Button>
            )}
            {editTarget && !editTarget.status && (
              <Button
                variant="outline"
                disabled={saving || (editNome ?? '').trim().length === 0}
                onClick={async () => {
                  if (!editTarget) return
                  const nome = (editNome ?? '').trim()
                  setSaving(true)
                  try {
                    const payload: any = { nome, descricao: editDesc || null, liderId: (editLeader === 'none' ? null : editLeader) }
                    const { data } = await api.post<any>('/squads', payload)
                    const vm: any = data
                    const reativado: Squad = {
                      id: vm.id ?? editTarget.id,
                      nome: vm.nome ?? nome,
                      descricao: vm.descricao ?? (editDesc || null),
                      status: vm.status ?? true,
                      membrosCount: vm.membrosCount ?? editTarget.membrosCount ?? 0,
                      liderId: vm.liderId ?? (editLeader === 'none' ? editTarget.liderId : editLeader),
                    }
                    setItems(prev => prev.map(s => s.id === editTarget.id ? reativado : s))
                    toast.success('Squad reativado')
                    setEditOpen(false)
                  } finally {
                    setSaving(false)
                  }
                }}
              >
                Reativar
              </Button>
            )}
            <Button
              disabled={saving || !editTarget || (editNome ?? '').trim().length === 0}
              onClick={async () => {
                if (!editTarget) return
                const nome = (editNome ?? '').trim()
                setSaving(true)
                try {
                  // Atualizar dados básicos do squad
                  const payload: any = { nome, descricao: editDesc || null, liderId: (editLeader === 'none' ? null : editLeader) }
                  const { data } = await api.put<any>(`/squads/${encodeURIComponent(editTarget.id)}`, payload)
                  const vm: any = data
                  const atualizado: Squad = {
                    id: vm.id ?? editTarget.id,
                    nome: vm.nome ?? nome,
                    descricao: vm.descricao ?? (editDesc || null),
                    status: vm.status ?? true,
                    membrosCount: vm.membrosCount ?? editTarget.membrosCount,
                    liderId: vm.liderId ?? (editLeader === 'none' ? editTarget.liderId : editLeader),
                  }
                  // Calcular diff de membros
                  const desired = new Set<number>(editSelectedMembers)
                  if (atualizado.liderId != null) desired.add(Number(atualizado.liderId))
                  const initial = new Set<number>(editInitialMembers)
                  const toAdd: number[] = []
                  const toRemove: number[] = []
                  for (const id of desired) if (!initial.has(id)) toAdd.push(id)
                  for (const id of initial) if (!desired.has(id)) toRemove.push(id)
                  // Aplicar remoções
                  for (const mid of toRemove) {
                    try { await api.delete(`/squads/${encodeURIComponent(atualizado.id)}/colaboradores/${encodeURIComponent(mid)}`) } catch {}
                  }
                  // Aplicar adições
                  for (const mid of toAdd) {
                    try { await api.post(`/squads/${encodeURIComponent(atualizado.id)}/colaboradores`, { colaboradorId: mid }) } catch {}
                  }
                  // Atualizar contagem local se houver mudanças
                  if (toAdd.length || toRemove.length) {
                    const delta = toAdd.length - toRemove.length
                    atualizado.membrosCount = (atualizado.membrosCount ?? 0) + delta
                  }
                  setItems(prev => prev.map(s => s.id === editTarget.id ? atualizado : s))
                  toast.success('Squad atualizado')
                  setEditOpen(false)
                } finally {
                  setSaving(false)
                }
              }}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


