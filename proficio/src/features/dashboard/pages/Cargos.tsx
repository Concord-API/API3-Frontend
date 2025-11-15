import { useEffect, useMemo, useRef, useState } from 'react'
import { Input } from '@/shared/components/ui/input'
import { api } from '@/shared/lib/api'
import type { Cargo, Setor } from '@/shared/types'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ButtonGroup } from '@/shared/components/ui/button-group'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog'
import { Label } from '@/shared/components/ui/label'
import { toast } from 'sonner'
import { List, LayoutGrid, Plus, ChevronDown, SquarePen } from 'lucide-react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/shared/components/ui/command'
import { Roles, type UserRole } from '@/shared/constants/roles'
import { Card } from '@/shared/components/ui/card'
import { Item, ItemContent, ItemGroup, ItemHeader, ItemTitle } from '@/shared/components/ui/item'
import { Skeleton } from '@/shared/components/ui/skeleton'

type ViewMode = 'table' | 'grid'

export function Cargos() {
  const { user } = useAuth()
  const [mode, setMode] = useState<ViewMode>('grid')
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Cargo[]>([])
  const [setores, setSetores] = useState<Setor[]>([])
  const [selectedSetor, setSelectedSetor] = useState<number | 'all'>('all')
  const [setorOpen, setSetorOpen] = useState(false)
  const [setorQuery, setSetorQuery] = useState('')
  const setorRef = useRef<HTMLDivElement | null>(null)

  const [initialLoading, setInitialLoading] = useState(true)

  // Create
  const [addOpen, setAddOpen] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novaDesc, setNovaDesc] = useState('')
  const [novoRole, setNovoRole] = useState<UserRole>(Roles.Colaborador)
  const [novoSetor, setNovoSetor] = useState<number | 'none'>('none')
  const [saving, setSaving] = useState(false)

  // Edit
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Cargo | null>(null)
  const [editNome, setEditNome] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editRole, setEditRole] = useState<UserRole>(Roles.Colaborador)
  const [editSetor, setEditSetor] = useState<number | 'none'>('none')

  useEffect(() => {
    function onDown(e: MouseEvent) {
      const target = e.target as Node | null
      if (!setorRef.current || !target) return
      if (!setorRef.current.contains(target)) setSetorOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  useEffect(() => {
    setInitialLoading(true)
    Promise.all([
      api.get<any[]>('/cargos?status=all'),
      api.get<any[]>('/setores'),
    ])
      .then(([cg, st]) => {
        const mappedCargos: Cargo[] = (Array.isArray(cg.data) ? cg.data : []).map((vm: any) => ({
          id_cargo: vm.id_cargo ?? vm.id ?? 0,
          nome_cargo: vm.nome_cargo ?? vm.nome ?? '',
          desc_cargo: vm.desc_cargo ?? vm.descricao ?? null,
          role: vm.role ?? undefined,
          status: vm.status ?? true,
          id_setor: vm.id_setor ?? vm.setorId ?? vm.setor?.id_setor,
          setor: vm.setor ?? undefined,
        }))
        setItems(mappedCargos)
        const mappedSetores: Setor[] = (Array.isArray(st.data) ? st.data : []).map((vm: any) => ({
          id_setor: vm.id ?? vm.id_setor,
          nome_setor: vm.nome ?? vm.nome_setor,
          desc_setor: vm.descricao ?? vm.desc_setor ?? null,
          status: vm.status ?? true,
          id_diretor: vm.diretorId ?? vm.id_diretor ?? null,
          diretor: null,
        }))
        setSetores(mappedSetores)
      })
      .finally(() => setInitialLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    let base = items
    if (selectedSetor !== 'all') base = base.filter(c => c.id_setor === selectedSetor)
    if (!t) return base
    return base.filter(c => (c.nome_cargo || '').toLowerCase().includes(t))
  }, [q, items, selectedSetor])

  const active = useMemo(() => filtered.filter(c => c.status !== false), [filtered])
  const inactive = useMemo(() => filtered.filter(c => c.status === false), [filtered])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-full max-w-xs">
          <Input placeholder="Buscar cargo..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="relative" ref={setorRef}>
          <div
            className="inline-flex h-8 items-center gap-2 rounded-md border px-3 text-sm cursor-pointer"
            onClick={() => setSetorOpen((v) => !v)}
          >
            <span className="truncate max-w-[12rem]">{selectedSetor === 'all' ? 'Todos os setores' : (setores.find(s => s.id_setor === selectedSetor)?.nome_setor ?? 'Setor')}</span>
            <ChevronDown className="size-4 opacity-60" />
          </div>
          {setorOpen && (
            <div className="absolute z-20 mt-1 w-56 rounded-md border bg-popover shadow-xs">
              <Command>
                <CommandInput placeholder="Filtrar setor..." value={setorQuery} onValueChange={setSetorQuery} />
                <CommandList>
                  <CommandEmpty>Nenhum setor</CommandEmpty>
                  <CommandGroup>
                    <CommandItem onSelect={() => { setSelectedSetor('all'); setSetorOpen(false); setSetorQuery('') }}>Todos</CommandItem>
                    {setores.filter(s => s.nome_setor.toLowerCase().includes(setorQuery.toLowerCase())).map(s => (
                      <CommandItem key={s.id_setor} onSelect={() => { setSelectedSetor(s.id_setor); setSetorOpen(false); setSetorQuery('') }}>{s.nome_setor}</CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {user?.role === Roles.Diretor && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="icon" className="fixed bottom-6 right-6 h-10 p-4 w-auto rounded-lg   shadow-lg">
                <Plus className="size-5" />
                <p>Novo cargo</p>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo cargo</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="grid gap-1">
                  <Label htmlFor="nome-cargo">Nome</Label>
                  <Input id="nome-cargo" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Ex.: Desenvolvedor Backend" />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="desc-cargo">Descrição</Label>
                  <Input id="desc-cargo" value={novaDesc} onChange={(e) => setNovaDesc(e.target.value)} placeholder="Opcional" />
                </div>
                <div className="grid gap-1">
                  <Label>Role</Label>
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={novoRole}
                    onChange={(e) => setNovoRole(e.target.value as UserRole)}
                  >
                    <option value={Roles.Colaborador}>Colaborador</option>
                    <option value={Roles.Gestor}>Gestor</option>
                    <option value={Roles.Diretor}>Diretor</option>
                  </select>
                </div>
                <div className="grid gap-1">
                  <Label>Setor</Label>
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
              <DialogFooter>
                <Button
                  disabled={saving || novoNome.trim().length === 0 || novoSetor === 'none'}
                  onClick={async () => {
                    const nome = novoNome.trim()
                    if (!nome || novoSetor === 'none') return
                    setSaving(true)
                    try {
                      const payload: any = { nome, descricao: (novaDesc || null), role: novoRole, setorId: (novoSetor as number) }
                      const { data } = await api.post<any>('/cargos', payload)
                      const vm: any = data
                      const created: Cargo = {
                        id_cargo: vm.id_cargo ?? vm.id ?? 0,
                        nome_cargo: vm.nome_cargo ?? vm.nome ?? nome,
                        desc_cargo: vm.desc_cargo ?? vm.descricao ?? (novaDesc || null),
                        status: vm.status ?? true,
                        role: vm.role ?? novoRole,
                        id_setor: vm.id_setor ?? (novoSetor as number),
                        setor: vm.setor ?? undefined,
                      }
                      setItems(prev => [...prev, created])
                      toast.success('Cargo criado')
                      setAddOpen(false)
                      setNovoNome('')
                      setNovaDesc('')
                      setNovoRole(Roles.Colaborador)
                      setNovoSetor('none')
                    } catch (err: any) {
                      if (err?.response?.status === 409) {
                        toast.error('Já existe um cargo ativo com esse nome')
                      }
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
                <th className="py-2 pr-4">Cargo</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Setor</th>
                <th className="py-2 pr-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} className="pt-4 pb-2 text-xs font-semibold text-muted-foreground">Ativos</td>
              </tr>
              {active.map(c => (
                <tr key={c.id_cargo} className="border-t hover:bg-accent/40">
                  <td className="py-3 pr-4 font-medium">{c.nome_cargo}</td>
                  <td className="py-3 pr-4">{c.role ?? '—'}</td>
                  <td className="py-3 pr-4">{setores.find(s => s.id_setor === c.id_setor)?.nome_setor ?? '—'}</td>
                  <td className="py-3 pr-2 text-right">
                    <div className="inline-flex items-center gap-2">
                      {user?.role === Roles.Diretor && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditTarget(c)
                              setEditNome(c.nome_cargo)
                              setEditDesc(c.desc_cargo || '')
                              setEditRole((c.role ?? Roles.Colaborador) as UserRole)
                              setEditSetor(c.id_setor ?? 'none')
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
                                await api.delete(`/cargos/${encodeURIComponent(c.id_cargo)}`)
                                setItems(prev => prev.map(it => it.id_cargo === c.id_cargo ? { ...it, status: false } : it))
                                toast.success('Cargo desativado')
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
              {inactive.length > 0 && (
                <tr>
                  <td colSpan={4} className="pt-6 pb-2 text-xs font-semibold text-muted-foreground">Inativos</td>
                </tr>
              )}
              {inactive.map(c => (
                <tr key={c.id_cargo} className="border-t opacity-70">
                  <td className="py-3 pr-4 font-medium">{c.nome_cargo}</td>
                  <td className="py-3 pr-4">{c.role ?? '—'}</td>
                  <td className="py-3 pr-4">{setores.find(s => s.id_setor === c.id_setor)?.nome_setor ?? '—'}</td>
                  <td className="py-3 pr-2 text-right">
                    <div className="inline-flex items-center gap-2">
                      {user?.role === Roles.Diretor && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditTarget(c)
                              setEditNome(c.nome_cargo)
                              setEditDesc(c.desc_cargo || '')
                              setEditRole((c.role ?? Roles.Colaborador) as UserRole)
                              setEditSetor(c.id_setor ?? 'none')
                              setEditOpen(true)
                            }}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              // Reativação: POST com mesmo nome e dados
                              try {
                                const payload: any = { nome: c.nome_cargo, descricao: c.desc_cargo || null, role: (c.role ?? Roles.Colaborador), setorId: c.id_setor }
                                const { data } = await api.post('/cargos', payload)
                                const vm: any = data
                                const updatedId = vm.id_cargo ?? vm.id ?? c.id_cargo
                                setItems(prev => prev.map(it => it.id_cargo === c.id_cargo ? {
                                  id_cargo: updatedId,
                                  nome_cargo: vm.nome_cargo ?? vm.nome ?? c.nome_cargo,
                                  desc_cargo: vm.desc_cargo ?? vm.descricao ?? c.desc_cargo,
                                  status: vm.status ?? true,
                                  role: vm.role ?? c.role,
                                  id_setor: vm.id_setor ?? c.id_setor,
                                  setor: vm.setor ?? it.setor,
                                } : it))
                                toast.success('Cargo reativado')
                              } catch {}
                            }}
                          >
                            Reativar
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
              {active.map(c => (
                <div key={c.id_cargo} className="group relative flex flex-col rounded-lg border bg-card p-4 text-left transition hover:bg-accent/50">
                  <ItemGroup>
                    <ItemHeader>
                      <ItemTitle>
                        <span className="truncate">{c.nome_cargo}</span>
                      </ItemTitle>
                      <div className="flex items-center gap-1">
                        {user?.role === ('Diretor' as any) && (
                          <button
                            type="button"
                            className="inline-flex items-center p-0.5 text-muted-foreground opacity-70 hover:opacity-100 hover:text-foreground"
                            onClick={() => {
                              setEditTarget(c)
                              setEditNome(c.nome_cargo)
                              setEditDesc(c.desc_cargo || '')
                              setEditRole((c.role ?? Roles.Colaborador) as UserRole)
                              setEditSetor(c.id_setor ?? 'none')
                              setEditOpen(true)
                            }}
                            aria-label="Editar cargo"
                          >
                            <SquarePen className="size-3.5" />
                          </button>
                        )}
                        <ChevronDown className="size-4 rotate-[-90deg] opacity-60 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </ItemHeader>
                    {c.desc_cargo && (
                      <div className="text-xs text-muted-foreground mt-1 leading-snug break-words" title={c.desc_cargo || undefined}>{c.desc_cargo}</div>
                    )}
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <Item variant="outline" size="sm">
                        <ItemContent>
                          <div className="text-[11px] text-muted-foreground">Role</div>
                          <div className="text-sm font-medium truncate">{c.role ?? '—'}</div>
                        </ItemContent>
                      </Item>
                      <Item variant="outline" size="sm">
                        <ItemContent>
                          <div className="text-[11px] text-muted-foreground">Setor</div>
                          <div className="text-sm font-medium truncate">{setores.find(s => s.id_setor === c.id_setor)?.nome_setor ?? '—'}</div>
                        </ItemContent>
                      </Item>
                    </div>
                  </ItemGroup>
                </div>
              ))}
              {active.length === 0 && (
                <Card className="px-4 py-10 text-center text-sm text-muted-foreground">Nenhum cargo ativo encontrado.</Card>
              )}
            </div>
          </div>
          {inactive.length > 0 && (
            <div>
              <div className="mb-2 text-xs font-semibold text-muted-foreground">Inativos</div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {inactive.map(c => (
                  <div key={c.id_cargo} className="group relative flex flex-col rounded-lg border bg-card p-4 text-left transition hover:bg-accent/50 opacity-75">
                    <ItemGroup>
                      <ItemHeader>
                        <ItemTitle>
                          <span className="truncate">{c.nome_cargo}</span>
                        </ItemTitle>
                        <div className="flex items-center gap-1">
                          {user?.role === ('Diretor' as any) && (
                            <button
                              type="button"
                              className="inline-flex items-center p-0.5 text-muted-foreground opacity-70 hover:opacity-100 hover:text-foreground"
                              onClick={() => {
                                setEditTarget(c)
                                setEditNome(c.nome_cargo)
                                setEditDesc(c.desc_cargo || '')
                                setEditRole((c.role ?? Roles.Colaborador) as UserRole)
                                setEditSetor(c.id_setor ?? 'none')
                                setEditOpen(true)
                              }}
                              aria-label="Editar cargo"
                            >
                              <SquarePen className="size-3.5" />
                            </button>
                          )}
                          <ChevronDown className="size-4 rotate-[-90deg] opacity-60 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </ItemHeader>
                      {c.desc_cargo && (
                        <div className="text-xs text-muted-foreground mt-1 leading-snug break-words" title={c.desc_cargo || undefined}>{c.desc_cargo}</div>
                      )}
                    </ItemGroup>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar cargo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1">
              <Label htmlFor="edit-nome-cargo">Nome</Label>
              <Input id="edit-nome-cargo" value={editNome} onChange={(e) => setEditNome(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="edit-desc-cargo">Descrição</Label>
              <Input id="edit-desc-cargo" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Opcional" />
            </div>
            <div className="grid gap-1">
              <Label>Role</Label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as UserRole)}
              >
                <option value={Roles.Colaborador}>Colaborador</option>
                <option value={Roles.Gestor}>Gestor</option>
                <option value={Roles.Diretor}>Diretor</option>
              </select>
            </div>
            <div className="grid gap-1">
              <Label>Setor</Label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={editSetor === 'none' ? '' : String(editSetor)}
                onChange={(e) => setEditSetor(e.target.value ? Number(e.target.value) : 'none')}
              >
                <option value="">Selecione um setor</option>
                {setores.map(s => (
                  <option key={s.id_setor} value={s.id_setor}>{s.nome_setor}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            {editTarget && editTarget.status && (
              <Button
                variant="outline"
                disabled={saving}
                onClick={async () => {
                  if (!editTarget) return
                  setSaving(true)
                  try {
                    await api.delete(`/cargos/${encodeURIComponent(editTarget.id_cargo)}`)
                    setItems(prev => prev.map(c => c.id_cargo === editTarget.id_cargo ? { ...c, status: false } : c))
                    toast.success('Cargo desativado')
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
                disabled={saving || editSetor === 'none' || editNome.trim().length === 0}
                onClick={async () => {
                  if (!editTarget) return
                  setSaving(true)
                  try {
                    const payload: any = { nome: editNome.trim(), descricao: editDesc || null, role: editRole, setorId: (editSetor as number) }
                    const { data } = await api.post('/cargos', payload)
                    const vm: any = data
                    const atualizado: Cargo = {
                      id_cargo: vm.id_cargo ?? editTarget.id_cargo,
                      nome_cargo: vm.nome_cargo ?? editNome.trim(),
                      desc_cargo: vm.desc_cargo ?? (editDesc || null),
                      status: true,
                      role: vm.role ?? editRole,
                      id_setor: vm.id_setor ?? (editSetor as number),
                      setor: vm.setor ?? editTarget.setor,
                    }
                    setItems(prev => prev.map(c => c.id_cargo === editTarget.id_cargo ? atualizado : c))
                    toast.success('Cargo reativado')
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
              disabled={saving || !editTarget || (editNome ?? '').trim().length === 0 || editSetor === 'none'}
              onClick={async () => {
                if (!editTarget) return
                const nome = (editNome ?? '').trim()
                setSaving(true)
                try {
                  const payload: any = { nome, descricao: editDesc || null, role: editRole, setorId: (editSetor as number) }
                  const { data } = await api.put<any>(`/cargos/${encodeURIComponent(editTarget.id_cargo)}`, payload)
                  const vm: any = data
                  const atualizado: Cargo = {
                    id_cargo: vm.id_cargo ?? editTarget.id_cargo,
                    nome_cargo: vm.nome_cargo ?? nome,
                    desc_cargo: vm.desc_cargo ?? (editDesc || null),
                    status: vm.status ?? true,
                    role: vm.role ?? editRole,
                    id_setor: vm.id_setor ?? (editSetor as number),
                    setor: vm.setor ?? editTarget.setor,
                  }
                  setItems(prev => prev.map(c => c.id_cargo === editTarget.id_cargo ? atualizado : c))
                  toast.success('Cargo atualizado')
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


