import { useEffect, useMemo, useState } from 'react'
// removed unused Card import
import { Input } from '@/shared/components/ui/input'
import { api } from '@/shared/lib/api'
import type { Colaborador, Equipe, Setor } from '@/shared/types'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, List, LayoutGrid, Plus, SquarePen } from 'lucide-react'
import { ButtonGroup } from '@/shared/components/ui/button-group'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/shared/components/ui/dialog'
import { Label } from '@/shared/components/ui/label'
import { toast } from 'sonner'
import { Item, ItemContent, ItemGroup, ItemHeader, ItemTitle } from '@/shared/components/ui/item'
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/components/ui/avatar'

export function Setores() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [setores, setSetores] = useState<Setor[]>([])
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [mySetorId, setMySetorId] = useState<number | null>(null)
  const [mode, setMode] = useState<'table' | 'grid'>('grid')
  const [addOpen, setAddOpen] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novaDesc, setNovaDesc] = useState('')
  const [diretorId, setDiretorId] = useState<number | 'none'>('none')
  const [saving, setSaving] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Setor | null>(null)
  const [editNome, setEditNome] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editDiretorId, setEditDiretorId] = useState<number | 'none'>('none')

  useEffect(() => {
    async function load() {
      const [s, e, c] = await Promise.all([
        api.get<any[]>('/setores?status=all'),
        api.get<any[]>('/equipes?status=all'),
        api.get<Colaborador[]>('/colaboradores'),
      ])
      const setoresMapped: Setor[] = (Array.isArray(s.data) ? s.data : []).map((vm: any) => ({
        id_setor: vm.id ?? vm.id_setor,
        nome_setor: vm.nome ?? vm.nome_setor,
        desc_setor: vm.descricao ?? vm.desc_setor ?? null,
        status: vm.status ?? true,
        id_diretor: vm.diretorId ?? vm.id_diretor ?? null,
        diretor: null,
      }))
      setSetores(setoresMapped)
      const equipesMapped: Equipe[] = (Array.isArray(e.data) ? e.data : []).map((vm: any) => ({
        id_equipe: vm.id ?? vm.id_equipe,
        nome_equipe: vm.nome ?? vm.nome_equipe,
        id_setor: vm.setorId ?? vm.id_setor ?? vm.setor?.id_setor,
        status: vm.status ?? true,
        setor: vm.setor ? { id_setor: vm.setor.id_setor, nome_setor: vm.setor.nome_setor } as any : undefined,
        colaboradoresCount: vm.colaboradoresCount ?? 0,
      } as any))
      setEquipes(equipesMapped)
      setColaboradores(Array.isArray(c.data) ? c.data : [])
    }
    load()
  }, [])

  useEffect(() => {
    if (!user?.id) return
    api.get<Colaborador>(`/colaboradores/${encodeURIComponent(user.id)}/perfil`).then((res) => {
      setMySetorId(res.data?.equipe?.setor?.id_setor ?? null)
    })
  }, [user?.id])

  const list = useMemo(() => {
    let base = setores
    if (user?.role === 'Gestor' as any && mySetorId != null) base = base.filter(s => s.id_setor === mySetorId)
    const t = q.trim().toLowerCase()
    if (t) base = base.filter(s => s.nome_setor.toLowerCase().includes(t))
    return base.map(s => {
      const eqs = equipes.filter(e => e.id_setor === s.id_setor && (e as any).status !== false)
      const colabsCount = eqs.reduce((sum, e) => sum + ((e as any).colaboradoresCount ?? 0), 0)
      const diretor = s.id_diretor != null ? colaboradores.find(c => ((c as any).id ?? (c as any).id_colaborador) === s.id_diretor) : undefined
      return { setor: s, equipes: eqs.length, colaboradores: colabsCount, diretor }
    })
  }, [setores, equipes, colaboradores, q, user?.role, mySetorId])

  const listActive = useMemo(() => list.filter(i => i.setor.status !== false), [list])
  const listInactive = useMemo(() => list.filter(i => i.setor.status === false), [list])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-full max-w-sm">
          <Input placeholder="Buscar setor..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          {user?.role === ('Diretor' as any) && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="icon" className="fixed bottom-6 right-6 h-10 p-4 w-auto rounded-lg   shadow-lg">
                <Plus className="size-5" />
                <p>Novo setor</p>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo setor</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="grid gap-1">
                  <Label htmlFor="nome-setor">Nome</Label>
                  <Input id="nome-setor" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Ex.: Tecnologia" />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor="desc-setor">Descrição</Label>
                  <Input id="desc-setor" value={novaDesc} onChange={(e) => setNovaDesc(e.target.value)} placeholder="Opcional" />
                </div>
                {user?.role === ('Diretor' as any) && (
                  <div className="grid gap-1">
                    <Label>Diretor responsável (opcional)</Label>
                    <select
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={diretorId === 'none' ? '' : String(diretorId)}
                      onChange={(e) => setDiretorId(e.target.value ? Number(e.target.value) : 'none')}
                    >
                      <option value="">Sem diretor</option>
                      {colaboradores.filter(c => (c as any).role === 'Diretor').map(c => {
                        const cid = (c as any).id ?? (c as any).id_colaborador
                        return (
                          <option key={cid} value={cid}>{`${c.nome} ${c.sobrenome}`.trim()}</option>
                        )
                      })}
                    </select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  disabled={saving || novoNome.trim().length === 0}
                  onClick={async () => {
                    const nome = novoNome.trim()
                    if (!nome) return
                    setSaving(true)
                    try {
                      const payload: any = { nome, descricao: novaDesc || null, diretorId: diretorId === 'none' ? null : diretorId, status: true }
                      const { data } = await api.post('/setores', payload)
                      const created: any = data
                      const novoSetorObj: Setor = {
                        id_setor: created.id ?? 0,
                        nome_setor: created.nome ?? nome,
                        desc_setor: created.descricao ?? (novaDesc || null),
                        status: created.status ?? true,
                        id_diretor: created.diretorId ?? null,
                        diretor: null,
                      }
                      setSetores((prev) => [...prev, novoSetorObj])
                      toast.success('Setor criado')
                      setAddOpen(false)
                      setNovoNome('')
                      setNovaDesc('')
                      setDiretorId('none')
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

      {mode === 'table' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="py-2 pr-4">Setor</th>
                <th className="py-2 pr-4">Equipes</th>
                <th className="py-2 pr-4">Colaboradores</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={3} className="pt-4 pb-2 text-xs font-semibold text-muted-foreground">Ativos</td>
              </tr>
              {listActive.map(({ setor, equipes, colaboradores }) => (
                <tr key={setor.id_setor} className="border-t hover:bg-accent/40 cursor-pointer" onClick={() => navigate(`/dashboard/equipes?setor=${setor.id_setor}`)}>
                  <td className="py-3 pr-4 font-medium">{setor.nome_setor}</td>
                  <td className="py-3 pr-4">{equipes}</td>
                  <td className="py-3 pr-4">{colaboradores}</td>
                </tr>
              ))}
              {listInactive.length > 0 && (
                <>
                  <tr>
                    <td colSpan={3} className="pt-6 pb-2 text-xs font-semibold text-muted-foreground">Inativos</td>
                  </tr>
                  {listInactive.map(({ setor, equipes, colaboradores }) => (
                    <tr key={setor.id_setor} className="border-t opacity-70 hover:bg-accent/40 cursor-pointer" onClick={() => navigate(`/dashboard/equipes?setor=${setor.id_setor}`)}>
                      <td className="py-3 pr-4 font-medium">{setor.nome_setor}</td>
                      <td className="py-3 pr-4">{equipes}</td>
                      <td className="py-3 pr-4">{colaboradores}</td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <div className="mb-2 text-xs font-semibold text-muted-foreground">Ativos</div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listActive.map(({ setor, equipes, colaboradores, diretor }) => {
            return (
              <div
                key={setor.id_setor}
                className="group relative flex flex-col rounded-lg border bg-card p-4 text-left transition hover:bg-accent/50 cursor-pointer"
                onClick={() => {
                  const qs = new URLSearchParams()
                  qs.set('setor', String(setor.id_setor))
                  navigate(`/dashboard/equipes?${qs.toString()}`)
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    const qs = new URLSearchParams()
                    qs.set('setor', String(setor.id_setor))
                    navigate(`/dashboard/equipes?${qs.toString()}`)
                  }
                }}
              >
                <ItemGroup>
                  <ItemHeader>
                    <ItemTitle>
                      <span className="truncate">{setor.nome_setor}</span>
                    </ItemTitle>
                    <div className="flex items-center gap-1">
                      {user?.role === ('Diretor' as any) && (
                        <button
                          type="button"
                          className="inline-flex items-center p-0.5 text-muted-foreground opacity-70 hover:opacity-100 hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditTarget(setor)
                            setEditNome(setor.nome_setor)
                            setEditDesc(setor.desc_setor || '')
                            setEditDiretorId(setor.id_diretor ?? 'none')
                            setEditOpen(true)
                          }}
                          aria-label="Editar setor"
                        >
                          <SquarePen className="size-3.5" />
                        </button>
                      )}
                      <ChevronRight className="size-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </ItemHeader>
                  <Item className="mt-2" variant="muted" size="sm">
                    <ItemContent>
                      <div className="text-[11px] text-muted-foreground">Diretor responsável</div>
                      <div className="flex items-center gap-2 text-sm font-medium truncate">
                        <Avatar className="size-6">
                          <AvatarImage src={(() => {
                            const a = (diretor as any)?.avatar as unknown
                            if (!a) return undefined as unknown as string
                            const s = String(a)
                            return s.startsWith('data:') ? s : `data:image/png;base64,${s}`
                          })()} alt="" />
                          <AvatarFallback>D</AvatarFallback>
                        </Avatar>
                        <span className="truncate">{diretor ? `${diretor.nome} ${diretor.sobrenome}`.trim() : '—'}</span>
                      </div>
                    </ItemContent>
                  </Item>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Item variant="outline" size="sm">
                      <ItemContent>
                        <div className="text-[11px] text-muted-foreground">Equipes</div>
                        <div className="text-lg font-semibold">{equipes}</div>
                      </ItemContent>
                    </Item>
                    <Item variant="outline" size="sm">
                      <ItemContent>
                        <div className="text-[11px] text-muted-foreground">Colaboradores</div>
                        <div className="text-lg font-semibold">{colaboradores}</div>
                      </ItemContent>
                    </Item>
                  </div>
                  {/* Removido orçamento por não se aplicar */}
                </ItemGroup>
              </div>
            )
          })}
          {listActive.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">Nenhum setor ativo encontrado.</div>
          )}
            </div>
          </div>
          {listInactive.length > 0 && (
          <div>
            <div className="mb-2 text-xs font-semibold text-muted-foreground">Inativos</div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listInactive.map(({ setor, equipes, colaboradores, diretor }) => {
            return (
              <div
                key={setor.id_setor}
                className="group relative flex flex-col rounded-lg border bg-card p-4 text-left transition hover:bg-accent/50 cursor-pointer opacity-75"
                onClick={() => {
                  const qs = new URLSearchParams()
                  qs.set('setor', String(setor.id_setor))
                  navigate(`/dashboard/equipes?${qs.toString()}`)
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    const qs = new URLSearchParams()
                    qs.set('setor', String(setor.id_setor))
                    navigate(`/dashboard/equipes?${qs.toString()}`)
                  }
                }}
              >
                <ItemGroup>
                  <ItemHeader>
                    <ItemTitle>
                      <span className="truncate">{setor.nome_setor}</span>
                    </ItemTitle>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="inline-flex items-center p-0.5 text-muted-foreground opacity-70 hover:opacity-100 hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditTarget(setor)
                          setEditNome(setor.nome_setor)
                          setEditDesc(setor.desc_setor || '')
                          setEditDiretorId(setor.id_diretor ?? 'none')
                          setEditOpen(true)
                        }}
                        aria-label="Editar setor"
                      >
                        <SquarePen className="size-3.5" />
                      </button>
                      <ChevronRight className="size-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </ItemHeader>
                  <Item className="mt-2" variant="muted" size="sm">
                    <ItemContent>
                      <div className="text-[11px] text-muted-foreground">Diretor responsável</div>
                      <div className="flex items-center gap-2 text-sm font-medium truncate">
                        <Avatar className="size-6">
                          <AvatarImage src={(() => {
                            const a = (diretor as any)?.avatar as unknown
                            if (!a) return undefined as unknown as string
                            const s = String(a)
                            return s.startsWith('data:') ? s : `data:image/png;base64,${s}`
                          })()} alt="" />
                          <AvatarFallback>D</AvatarFallback>
                        </Avatar>
                        <span className="truncate">{diretor ? `${diretor.nome} ${diretor.sobrenome}`.trim() : '—'}</span>
                      </div>
                    </ItemContent>
                  </Item>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Item variant="outline" size="sm">
                      <ItemContent>
                        <div className="text-[11px] text-muted-foreground">Equipes</div>
                        <div className="text-lg font-semibold">{equipes}</div>
                      </ItemContent>
                    </Item>
                    <Item variant="outline" size="sm">
                      <ItemContent>
                        <div className="text-[11px] text-muted-foreground">Colaboradores</div>
                        <div className="text-lg font-semibold">{colaboradores}</div>
                      </ItemContent>
                    </Item>
                  </div>
                </ItemGroup>
              </div>
            )
          })}
            </div>
          </div>
          )}
        </div>
      )}
      {/* Modal de edição de setor */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar setor</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1">
              <Label htmlFor="edit-nome-setor">Nome</Label>
              <Input id="edit-nome-setor" value={editNome} onChange={(e) => setEditNome(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="edit-desc-setor">Descrição</Label>
              <Input id="edit-desc-setor" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Opcional" />
            </div>
            {user?.role === ('Diretor' as any) && (
              <div className="grid gap-1">
                <Label>Diretor responsável (opcional)</Label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={editDiretorId === 'none' ? '' : String(editDiretorId)}
                  onChange={(e) => setEditDiretorId(e.target.value ? Number(e.target.value) : 'none')}
                >
                  <option value="">Sem diretor</option>
                  {colaboradores.filter(c => (c as any).role === 'Diretor').map(c => {
                    const cid = (c as any).id ?? (c as any).id_colaborador
                    return (
                      <option key={cid} value={cid}>{`${c.nome} ${c.sobrenome}`.trim()}</option>
                    )
                  })}
                </select>
              </div>
            )}
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
                    await api.delete(`/setores/${editTarget.id_setor}`)
                    setSetores(prev => prev.map(s => s.id_setor === editTarget.id_setor ? { ...s, status: false } : s))
                    toast.success('Setor desativado')
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
                disabled={saving}
                onClick={async () => {
                  if (!editTarget) return
                  setSaving(true)
                  try {
                    const payload: any = { nome: editNome.trim(), descricao: editDesc || null, diretorId: editDiretorId === 'none' ? null : editDiretorId }
                    const { data } = await api.post('/setores', payload)
                    const vm: any = data
                    const atualizado: Setor = {
                      id_setor: vm?.id ?? editTarget.id_setor,
                      nome_setor: vm?.nome ?? editTarget.nome_setor,
                      desc_setor: vm?.descricao ?? editTarget.desc_setor ?? null,
                      status: true,
                      id_diretor: vm?.diretorId ?? null,
                      diretor: null,
                    }
                    setSetores(prev => prev.map(s => s.id_setor === atualizado.id_setor ? atualizado : s))
                    toast.success('Setor reativado')
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
              disabled={saving || !editTarget || editNome.trim().length === 0}
              onClick={async () => {
                if (!editTarget) return
                const nome = editNome.trim()
                setSaving(true)
                try {
                  const payload: any = { nome, descricao: editDesc || null, diretorId: editDiretorId === 'none' ? null : editDiretorId }
                  const { data } = await api.put(`/setores/${editTarget.id_setor}`, payload)
                  const vm: any = data
                  const atualizado: Setor = {
                    id_setor: vm.id ?? editTarget.id_setor,
                    nome_setor: vm.nome ?? nome,
                    desc_setor: vm.descricao ?? (editDesc || null),
                    status: vm.status ?? true,
                    id_diretor: vm.diretorId ?? null,
                    diretor: null,
                  }
                  setSetores(prev => prev.map(s => s.id_setor === atualizado.id_setor ? atualizado : s))
                  toast.success('Setor atualizado')
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


