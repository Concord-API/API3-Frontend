import { useEffect, useMemo, useState, useRef } from 'react'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
// removed unused Card imports after redesign
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { api } from '@/shared/lib/api'
import type { Colaborador, Setor, Equipe } from '@/shared/types'
import { List, LayoutGrid, Plus } from 'lucide-react'
import { CollaboratorProfileModal } from '@/features/dashboard/components/CollaboratorProfileModal'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ButtonGroup } from '@/shared/components/ui/button-group'
import { useLocation, useNavigate } from 'react-router-dom'
import { Roles } from '@/shared/constants/roles'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/shared/components/ui/command'
import { ChevronDown } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog'
import { Label } from '@/shared/components/ui/label'
import { toast } from 'sonner'
import { Item, ItemContent, ItemGroup, ItemHeader, ItemMedia, ItemTitle } from '@/shared/components/ui/item'

type Gender = 'Male' | 'Female'

function FemaleAvatarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" shapeRendering="geometricPrecision">
      <circle cx="12" cy="8" r="4" fill="currentColor" />
      <path d="M4 20a8 8 0 0 1 16 0" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function MaleAvatarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" shapeRendering="geometricPrecision">
      <circle cx="12" cy="7.5" r="3.5" fill="currentColor" />
      <path d="M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function inferGenderFromName(name: string | undefined): Gender {
  const n = (name ?? '').trim().toLowerCase()
  if (!n) return 'Male'
  const FemaleNames = new Set([
    'tainara','mariana','fernanda','patrícia','patricia'
  ])
  const MaleNames = new Set([
    'adler','richard','lucas','bruno'
  ])
  if (FemaleNames.has(n)) return 'Female'
  if (MaleNames.has(n)) return 'Male'
  if (n.endsWith('a')) return 'Female'
  return 'Male'
}

type ViewMode = 'table' | 'grid'

export function Colaboradores() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const params = new URLSearchParams(location.search)
  const setorParam = params.get('setor')
  const equipeParam = params.get('equipe')
  const filterSetorFromUrl = setorParam ? Number(setorParam) : NaN
  const filterEquipeFromUrl = equipeParam ? Number(equipeParam) : NaN

  const [mode, setMode] = useState<ViewMode>('table')
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Colaborador[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [myTeamId, setMyTeamId] = useState<number | null>(null)
  const [setores, setSetores] = useState<Setor[]>([])
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [selectedSetor, setSelectedSetor] = useState<number | 'all'>(isFinite(filterSetorFromUrl) ? filterSetorFromUrl : 'all')
  const [selectedEquipe, setSelectedEquipe] = useState<number | 'all'>(isFinite(filterEquipeFromUrl) ? filterEquipeFromUrl : 'all')
  const [showSetor, setShowSetor] = useState(false)
  const [showEquipe, setShowEquipe] = useState(false)
  const [setorQuery, setSetorQuery] = useState('')
  const [equipeQuery, setEquipeQuery] = useState('')
  const setorRef = useRef<HTMLDivElement | null>(null)
  const equipeRef = useRef<HTMLDivElement | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novoSobrenome, setNovoSobrenome] = useState('')
  const [novoEmail, setNovoEmail] = useState('')
  const [novoEquipe, setNovoEquipe] = useState<number | 'none'>('none')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const target = e.target as Node | null
      const clickedInsideSetor = setorRef.current?.contains(target as Node) ?? false
      const clickedInsideEquipe = equipeRef.current?.contains(target as Node) ?? false
      if (!clickedInsideSetor) setShowSetor(false)
      if (!clickedInsideEquipe) setShowEquipe(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  useEffect(() => {
    api.get<Colaborador[]>('/colaboradores').then((res) => setItems(res.data))
    api.get<Setor[]>('/setores').then((res) => setSetores(res.data as any))
    api.get<Equipe[]>('/equipes').then((res) => setEquipes(res.data as any))
  }, [])

  useEffect(() => {
    if (!user?.id) return
    api.get<Colaborador>(`/perfil?id=${encodeURIComponent(user.id)}`).then((res) => {
      setMyTeamId(res.data?.equipe?.id_equipe ?? null)
    })
  }, [user?.id])

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    let base = items

    if (user?.role === Roles.Gestor) {
      if (myTeamId != null) base = base.filter(c => (c.equipe?.id_equipe ?? (c as any).id_equipe) === myTeamId)
    } else {
      if (selectedSetor !== 'all') base = base.filter(c => (c.equipe?.setor?.id_setor ?? (c as any).id_setor) === selectedSetor)
      if (selectedEquipe !== 'all') base = base.filter(c => (c.equipe?.id_equipe ?? (c as any).id_equipe) === selectedEquipe)
    }

    if (!t) return base
    return base.filter(c => `${c.nome} ${c.sobrenome}`.toLowerCase().includes(t) || (c as any).email?.toLowerCase()?.includes(t))
  }, [q, items, user?.role, myTeamId, selectedSetor, selectedEquipe])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-full max-w-sm">
          <Input placeholder="Buscar colaborador..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {user?.role === Roles.Diretor && (
          <>
            {/* Combobox Setor */}
            <div className="relative" ref={setorRef}>
              <div className="inline-flex h-8 items-center gap-2 rounded-md border px-3 text-sm cursor-pointer" onClick={() => { setShowSetor((v) => !v); setShowEquipe(false) }}>
                <span className="truncate max-w-[12rem]">{selectedSetor === 'all' ? 'Todos os setores' : setores.find(s => s.id_setor === selectedSetor)?.nome_setor ?? 'Setor'}</span>
                <ChevronDown className="size-4 opacity-60" />
              </div>
              {showSetor && (
                <div className="absolute z-20 mt-1 w-56 rounded-md border bg-popover shadow-xs">
                  <Command>
                    <CommandInput placeholder="Filtrar setor..." value={setorQuery} onValueChange={setSetorQuery} />
                    <CommandList>
                      <CommandEmpty>Nenhum setor</CommandEmpty>
                      <CommandGroup>
                        <CommandItem onSelect={() => { setSelectedSetor('all'); setSelectedEquipe('all'); setShowSetor(false); setSetorQuery(''); navigate('/dashboard/colaboradores') }}>Todos</CommandItem>
                        {setores.filter(s => s.nome_setor.toLowerCase().includes(setorQuery.toLowerCase())).map(s => (
                          <CommandItem key={s.id_setor} onSelect={() => { setSelectedSetor(s.id_setor); setSelectedEquipe('all'); setShowSetor(false); setSetorQuery(''); navigate(`/dashboard/colaboradores?setor=${s.id_setor}`) }}>{s.nome_setor}</CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
              )}
            </div>
            {/* Combobox Equipe */}
            <div className="relative" ref={equipeRef}>
              <div className="inline-flex h-8 items-center gap-2 rounded-md border px-3 text-sm cursor-pointer" onClick={() => { setShowEquipe((v) => !v); setShowSetor(false) }}>
                <span className="truncate max-w-[12rem]">{selectedEquipe === 'all' ? 'Todas as equipes' : equipes.find(e => e.id_equipe === selectedEquipe)?.nome_equipe ?? 'Equipe'}</span>
                <ChevronDown className="size-4 opacity-60" />
              </div>
              {showEquipe && (
                <div className="absolute z-20 mt-1 w-56 rounded-md border bg-popover shadow-xs">
                  <Command>
                    <CommandInput placeholder="Filtrar equipe..." value={equipeQuery} onValueChange={setEquipeQuery} />
                    <CommandList>
                      <CommandEmpty>Nenhuma equipe</CommandEmpty>
                      <CommandGroup>
                        <CommandItem onSelect={() => { setSelectedEquipe('all'); setShowEquipe(false); setEquipeQuery(''); navigate(selectedSetor === 'all' ? '/dashboard/colaboradores' : `/dashboard/colaboradores?setor=${selectedSetor}`) }}>Todas</CommandItem>
                        {(selectedSetor === 'all' ? equipes : equipes.filter(e => e.id_setor === selectedSetor))
                          .filter(e => e.nome_equipe.toLowerCase().includes(equipeQuery.toLowerCase()))
                          .map(e => (
                            <CommandItem key={e.id_equipe} onSelect={() => { setSelectedEquipe(e.id_equipe); setShowEquipe(false); setEquipeQuery(''); const qs = new URLSearchParams(); if (selectedSetor !== 'all') qs.set('setor', String(selectedSetor)); qs.set('equipe', String(e.id_equipe)); navigate(`/dashboard/colaboradores?${qs.toString()}`) }}>{e.nome_equipe}</CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
              )}
            </div>
          </>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="icon" className="fixed bottom-6 right-6 h-10 p-4 w-auto rounded-lg   shadow-lg">
                <Plus className="size-5" />
                <p>Novo colaborador</p>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo colaborador</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="grid gap-1">
                  <Label htmlFor="nome-colab">Nome</Label>
                  <Input id="nome-colab" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="sobrenome-colab">Sobrenome</Label>
                  <Input id="sobrenome-colab" value={novoSobrenome} onChange={(e) => setNovoSobrenome(e.target.value)} />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="email-colab">Email</Label>
                  <Input id="email-colab" type="email" value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} />
                </div>
                <div className="grid gap-1">
                  <Label>Equipe</Label>
                  <div className="relative">
                    <select
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={novoEquipe === 'none' ? '' : String(novoEquipe)}
                      onChange={(e) => setNovoEquipe(e.target.value ? Number(e.target.value) : 'none')}
                    >
                      <option value="">Selecione uma equipe</option>
                      {equipes.map(eq => (
                        <option key={eq.id_equipe} value={eq.id_equipe}>{eq.nome_equipe}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  disabled={saving || novoNome.trim().length === 0 || !novoEmail.trim() || novoEquipe === 'none'}
                  onClick={async () => {
                    const nome = novoNome.trim()
                    const sobrenome = novoSobrenome.trim()
                    const email = novoEmail.trim()
                    if (!nome || !email || novoEquipe === 'none') return
                    setSaving(true)
                    try {
                      const payload: Partial<Colaborador> = {
                        nome,
                        sobrenome,
                        email,
                        id_equipe: novoEquipe as number,
                        status: true as any,
                        role: Roles.Colaborador as any,
                        senha: '12345678' as any,
                        genero: true as any,
                        id_cargo: 1 as any,
                      }
                      const { data } = await api.post<Colaborador>('/colaboradores', payload)
                      setItems((prev) => [...prev, data])
                      toast.success('Colaborador criado')
                      setAddOpen(false)
                      setNovoNome('')
                      setNovoSobrenome('')
                      setNovoEmail('')
                      setNovoEquipe('none')
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
            <Button
              variant={mode === 'table' ? 'default' : 'outline'}
              size="icon"
              className="transition-none"
              onClick={() => setMode('table')}
            >
              <List size={20} strokeWidth={2} absoluteStrokeWidth shapeRendering="geometricPrecision" />
            </Button>
            <Button
              variant={mode === 'grid' ? 'default' : 'outline'}
              size="icon"
              className="transition-none"
              onClick={() => setMode('grid')}
            >
              <LayoutGrid size={20} strokeWidth={2} absoluteStrokeWidth shapeRendering="geometricPrecision" />
            </Button>
          </ButtonGroup>
        </div>
      </div>

      {mode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="py-2 pr-4">Colaborador</th>
                <th className="py-2 pr-4">Cargo</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id_colaborador} className="border-t hover:bg-muted/60 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-8">
                        <AvatarImage src={(c as any).foto_url ?? (c as any).avatar ?? undefined} alt="" />
                        <AvatarFallback className="text-[0px]">
                          {inferGenderFromName(c.nome) === 'Female' ? (
                            <span className="text-pink-600">
                              <FemaleAvatarIcon />
                            </span>
                          ) : (
                            <span className="text-blue-600">
                              <MaleAvatarIcon />
                            </span>
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex items-center gap-2">
                        <div className="font-medium truncate">{c.nome} {c.sobrenome}</div>
                        {String(c.id_colaborador) === (user?.id ?? '') && (
                          <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]">Você</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4">{c.cargo?.nome_cargo ?? '—'}</td>
                  <td className="py-3 pr-4">{(c as any).email ?? '—'}</td>
                  <td className="py-3 pr-2 text-right">
                    <Button size="sm" variant="outline" onClick={() => setSelectedId(c.id_colaborador)}>Ver perfil</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(c => (
            <button key={c.id_colaborador} className="group relative flex flex-col rounded-xl border bg-card p-4 text-left transition hover:bg-accent/50 cursor-pointer" onClick={() => setSelectedId(c.id_colaborador)}>
              <ItemGroup>
                <ItemHeader>
                  <ItemTitle>
                    <ItemMedia variant="image">
                      <img src={(c as any).foto_url ?? (c as any).avatar ?? ''} alt="" />
                    </ItemMedia>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate font-semibold">{c.nome} {c.sobrenome}</span>
                      {String(c.id_colaborador) === (user?.id ?? '') && (
                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]">Você</span>
                      )}
                    </div>
                  </ItemTitle>
                </ItemHeader>
                <Item className="mt-2" variant="outline" size="sm">
                  <ItemContent>
                    <div className="text-[11px] text-muted-foreground">Cargo</div>
                    <div className="text-sm font-medium truncate">{c.cargo?.nome_cargo ?? '—'}</div>
                  </ItemContent>
                </Item>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Item variant="outline" size="sm">
                    <ItemContent>
                      <div className="text-[11px] text-muted-foreground">Setor</div>
                      <div className="text-sm font-medium truncate">{c.equipe?.setor?.nome_setor ?? '—'}</div>
                    </ItemContent>
                  </Item>
                  <Item variant="outline" size="sm">
                    <ItemContent>
                      <div className="text-[11px] text-muted-foreground">Equipe</div>
                      <div className="text-sm font-medium truncate">{c.equipe?.nome_equipe ?? '—'}</div>
                    </ItemContent>
                  </Item>
                </div>
                <Item className="mt-2" variant="outline" size="sm">
                  <ItemContent>
                    <div className="text-[11px] text-muted-foreground">Email</div>
                    <div className="text-sm font-medium truncate">{(c as any).email ?? '—'}</div>
                  </ItemContent>
                </Item>
              </ItemGroup>
            </button>
          ))}
        </div>
      )}

      <CollaboratorProfileModal idColaborador={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}

