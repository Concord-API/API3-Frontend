import { useEffect, useMemo, useState, useRef } from 'react'
import { Input } from '@/shared/components/ui/input'
import { api } from '@/shared/lib/api'
import type { Equipe, Colaborador } from '@/shared/types'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronRight, List, LayoutGrid, ChevronDown } from 'lucide-react'
import { Card } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import type { Setor } from '@/shared/types'
import { ButtonGroup } from '@/shared/components/ui/button-group'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/shared/components/ui/command'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog'
import { Label } from '@/shared/components/ui/label'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Item, ItemContent, ItemGroup, ItemHeader, ItemTitle } from '@/shared/components/ui/item'
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/components/ui/avatar'

export function Equipes() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const setorParam = params.get('setor')
  const filterSetorFromUrl = setorParam ? Number(setorParam) : NaN

  const [q, setQ] = useState('')
  const [items, setItems] = useState<Equipe[]>([])
  const [myTeamId, setMyTeamId] = useState<number | null>(null)
  const [mySetorId, setMySetorId] = useState<number | null>(null)
  const [setores, setSetores] = useState<Setor[]>([])
  const [selectedSetor, setSelectedSetor] = useState<number | 'all'>(isFinite(filterSetorFromUrl) ? filterSetorFromUrl : 'all')
  const [mode, setMode] = useState<'table' | 'grid'>('grid')
  const [gestoresByEquipe, setGestoresByEquipe] = useState<Record<number, Colaborador | undefined>>({})
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [setorOpen, setSetorOpen] = useState(false)
  const [setorQuery, setSetorQuery] = useState('')
  const setorRef = useRef<HTMLDivElement | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novoSetor, setNovoSetor] = useState<number | 'none'>('none')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const target = e.target as Node | null
      if (!setorRef.current || !target) return
      if (!setorRef.current.contains(target)) setSetorOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  useEffect(() => {
    api.get<Equipe[]>('/equipes').then((res) => setItems(res.data))
    api.get<Setor[]>('/setores').then((res) => setSetores(res.data as any))
    // carrega colaboradores para mapear gestores por equipe (para Diretor)
    api.get<Colaborador[]>('/colaboradores').then((res) => {
      const map: Record<number, Colaborador | undefined> = {}
      const list = Array.isArray(res.data) ? res.data : []
      setColaboradores(list as any)
      for (const c of list) {
        if ((c as any).role === 'Gestor') {
          const teamId = (c as any).id_equipe ?? c.equipe?.id_equipe
          if (teamId != null && map[teamId] == null) map[teamId] = c
        }
      }
      setGestoresByEquipe(map)
    })
  }, [])

  useEffect(() => {
    if (!user?.id) return
    api.get(`/perfil?id=${encodeURIComponent(user.id)}`).then((res) => {
      setMyTeamId(res.data?.equipe?.id_equipe ?? null)
      setMySetorId(res.data?.equipe?.setor?.id_setor ?? null)
    })
  }, [user?.id])

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    let base = items
    if (user?.role === 'Gestor' as any) {
      if (mySetorId != null) base = base.filter(e => e.id_setor === mySetorId)
      if (myTeamId != null) base = base.filter(e => e.id_equipe === myTeamId)
    } else {
      if (selectedSetor !== 'all') base = base.filter(e => e.id_setor === selectedSetor)
    }
    if (!t) return base
    return base.filter(e => e.nome_equipe.toLowerCase().includes(t) || (e.setor?.nome_setor ?? '').toLowerCase().includes(t))
  }, [q, items, user?.role, myTeamId, mySetorId, selectedSetor])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-full max-w-xs">
          <Input placeholder="Buscar equipe..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {user?.role !== 'Gestor' as any && (
          <div className="relative" ref={setorRef}>
            <div
              className="inline-flex h-8 items-center gap-2 rounded-md border px-3 text-sm cursor-pointer"
              onClick={() => setSetorOpen((v) => !v)}
            >
              <span className="truncate max-w-[12rem]">{selectedSetor === 'all' ? 'Todos os setores' : setores.find(s => s.id_setor === selectedSetor)?.nome_setor ?? 'Setor'}</span>
              <ChevronDown className="size-4 opacity-60" />
            </div>
            {setorOpen && (
              <div className="absolute z-20 mt-1 w-56 rounded-md border bg-popover shadow-xs">
                <Command>
                  <CommandInput placeholder="Filtrar setor..." value={setorQuery} onValueChange={setSetorQuery} />
                  <CommandList>
                    <CommandEmpty>Nenhum setor</CommandEmpty>
                    <CommandGroup>
                      <CommandItem onSelect={() => { setSelectedSetor('all'); setSetorOpen(false); setSetorQuery(''); navigate('/dashboard/equipes') }}>Todos</CommandItem>
                      {setores.filter(s => s.nome_setor.toLowerCase().includes(setorQuery.toLowerCase())).map(s => (
                        <CommandItem key={s.id_setor} onSelect={() => { setSelectedSetor(s.id_setor); setSetorOpen(false); setSetorQuery(''); navigate(`/dashboard/equipes?setor=${s.id_setor}`) }}>{s.nome_setor}</CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
            )}
          </div>
        )}
        <div className="ml-auto">
          <div className="flex items-center gap-2">
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button size="icon" className="fixed bottom-6 right-6 h-10 p-4 w-auto rounded-lg   shadow-lg">
                  <Plus className="size-5" />
                  <p>Nova equipe</p>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova equipe</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                  <div className="grid gap-1">
                    <Label htmlFor="nome-equipe">Nome</Label>
                    <Input id="nome-equipe" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Ex.: Desenvolvimento" />
                  </div>
                  <div className="grid gap-1">
                    <Label>Setor</Label>
                    <div className="relative">
                      <select
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={novoSetor === 'none' ? '' : String(novoSetor)}
                        onChange={(e) => setNovoSetor(e.target.value ? Number(e.target.value) : 'none')}
                      >
                        <option value="">Selecione um setor</option>
                        {setores.map(s => (
                          <option key={s.id_setor} value={s.id_setor}>{s.nome_setor}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    disabled={saving || novoNome.trim().length === 0 || novoSetor === 'none'}
                    onClick={async () => {
                      const nome = novoNome.trim()
                      if (!nome || novoSetor === 'none') return
                      setSaving(true)
                      try {
                        const { data } = await api.post<Equipe>('/equipes', { nome_equipe: nome, id_setor: novoSetor, status: true })
                        setItems((prev) => [...prev, data])
                        toast.success('Equipe criada')
                        setAddOpen(false)
                        setNovoNome('')
                        setNovoSetor('none')
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
      </div>

      {mode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="py-2 pr-4">Equipe</th>
                <th className="py-2 pr-4">Setor</th>
                {user?.role === 'Diretor' && <th className="py-2 pr-4">Responsável</th>}
                {user?.role === 'Gestor' && <th className="py-2 pr-4">Minha equipe</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(eq => {
                const setorName = eq.setor?.nome_setor ?? setores.find(s => s.id_setor === (eq.setor?.id_setor ?? (eq as any).id_setor ?? eq.id_setor))?.nome_setor ?? '—'
                const setorId = eq.setor?.id_setor ?? (eq as any).id_setor ?? eq.id_setor
                return (
                <tr key={eq.id_equipe} className="border-t hover:bg-accent/40 cursor-pointer" onClick={() => navigate(`/dashboard/colaboradores?setor=${setorId}&equipe=${eq.id_equipe}`)}>
                  <td className="py-3 pr-4 font-medium">{eq.nome_equipe}</td>
                  <td className="py-3 pr-4">{setorName}</td>
                  {user?.role === 'Diretor' && (
                    <td className="py-3 pr-4">{(() => { const g = gestoresByEquipe[eq.id_equipe]; return g ? `${g.nome} ${g.sobrenome}`.trim() : '—' })()}</td>
                  )}
                  {user?.role === 'Gestor' && (
                    <td className="py-3 pr-4">
                      {eq.id_equipe === myTeamId ? (
                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]">Sua equipe</span>
                      ) : null}
                    </td>
                  )}
                </tr>)
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(eq => {
            const setorName = eq.setor?.nome_setor ?? setores.find(s => s.id_setor === (eq.setor?.id_setor ?? (eq as any).id_setor ?? eq.id_setor))?.nome_setor ?? '—'
            return (
              <button
                key={eq.id_equipe}
                className="group relative flex flex-col rounded-lg border bg-card p-4 text-left transition hover:bg-accent/50 cursor-pointer"
                onClick={() => {
                  const qs = new URLSearchParams()
                  qs.set('equipe', String(eq.id_equipe))
                  qs.set('setor', String(eq.setor?.id_setor ?? eq.id_setor))
                  navigate(`/dashboard/colaboradores?${qs.toString()}`)
                }}
              >
                <ItemGroup>
                  <ItemHeader>
                    <ItemTitle>
                      <span className="truncate">{eq.nome_equipe}</span>
                    </ItemTitle>
                    <ChevronRight className="size-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                  </ItemHeader>
                  {user?.role === 'Gestor' && eq.id_equipe === myTeamId && (
                    <div className="absolute top-3 right-10 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] bg-card/90 backdrop-blur-sm">Sua equipe</div>
                  )}
                  <Item className="mt-2" variant="muted" size="sm">
                    <ItemContent>
                      <div className="text-[11px] text-muted-foreground">Gestor</div>
                      <div className="flex items-center gap-2 text-sm font-medium truncate">
                        <Avatar className="size-6">
                          <AvatarImage src={(gestoresByEquipe[eq.id_equipe] as any)?.avatar ?? undefined} alt="" />
                          <AvatarFallback>G</AvatarFallback>
                        </Avatar>
                        <span className="truncate">{(() => { const g = gestoresByEquipe[eq.id_equipe]; return g ? `${g.nome} ${g.sobrenome}`.trim() : '—' })()}</span>
                      </div>
                    </ItemContent>
                  </Item>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Item variant="outline" size="sm">
                      <ItemContent>
                        <div className="text-[11px] text-muted-foreground">Setor</div>
                        <div className="text-sm font-medium truncate">{setorName}</div>
                      </ItemContent>
                    </Item>
                    <Item variant="outline" size="sm">
                      <ItemContent>
                        <div className="text-[11px] text-muted-foreground">Colaboradores</div>
                        <div className="text-lg font-semibold">{colaboradores.filter(c => (c.id_equipe ?? (c as any).equipe?.id_equipe) === eq.id_equipe).length}</div>
                      </ItemContent>
                    </Item>
                  </div>
                </ItemGroup>
              </button>
            )
          })}
          {filtered.length === 0 && (
            <Card className="px-4 py-10 text-center text-sm text-muted-foreground">Nenhuma equipe encontrada.</Card>
          )}
        </div>
      )}
    </div>
  )
}



