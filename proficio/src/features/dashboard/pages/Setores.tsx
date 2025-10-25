import { useEffect, useMemo, useState } from 'react'
// removed unused Card import
import { Input } from '@/shared/components/ui/input'
import { api } from '@/shared/lib/api'
import type { Colaborador, Equipe, Setor } from '@/shared/types'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, List, LayoutGrid, Plus } from 'lucide-react'
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
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const [s, e, c] = await Promise.all([
        api.get<Setor[]>('/setores'),
        api.get<Equipe[]>('/equipes'),
        api.get<Colaborador[]>('/colaboradores'),
      ])
      setSetores(Array.isArray(s.data) ? s.data : [])
      setEquipes(Array.isArray(e.data) ? e.data : [])
      setColaboradores(Array.isArray(c.data) ? c.data : [])
    }
    load()
  }, [])

  useEffect(() => {
    if (!user?.id) return
    api.get<Colaborador>(`/perfil?id=${encodeURIComponent(user.id)}`).then((res) => {
      setMySetorId(res.data?.equipe?.setor?.id_setor ?? null)
    })
  }, [user?.id])

  const list = useMemo(() => {
    let base = setores
    if (user?.role === 'Gestor' as any && mySetorId != null) base = base.filter(s => s.id_setor === mySetorId)
    const t = q.trim().toLowerCase()
    if (t) base = base.filter(s => s.nome_setor.toLowerCase().includes(t))
    return base.map(s => {
      const eqs = equipes.filter(e => e.id_setor === s.id_setor)
      const colabs = colaboradores.filter(c => eqs.some(e => e.id_equipe === c.id_equipe))
      const diretor = colaboradores.find(c => c.role === 'Diretor' as any && (c.cargo?.id_setor === s.id_setor || s.id_diretor === c.id_colaborador))
      return { setor: s, equipes: eqs.length, colaboradores: colabs.length, diretor }
    })
  }, [setores, equipes, colaboradores, q, user?.role, mySetorId])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-full max-w-sm">
          <Input placeholder="Buscar setor..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="ml-auto flex items-center gap-2">
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
              </div>
              <DialogFooter>
                <Button
                  disabled={saving || novoNome.trim().length === 0}
                  onClick={async () => {
                    const nome = novoNome.trim()
                    if (!nome) return
                    setSaving(true)
                    try {
                      const { data } = await api.post<Setor>('/setores', { nome_setor: nome, desc_setor: novaDesc || null, status: true })
                      setSetores((prev) => [...prev, data])
                      toast.success('Setor criado')
                      setAddOpen(false)
                      setNovoNome('')
                      setNovaDesc('')
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
              {list.map(({ setor, equipes, colaboradores }) => (
                <tr key={setor.id_setor} className="border-t hover:bg-accent/40 cursor-pointer" onClick={() => navigate(`/dashboard/equipes?setor=${setor.id_setor}`)}>
                  <td className="py-3 pr-4 font-medium">{setor.nome_setor}</td>
                  <td className="py-3 pr-4">{equipes}</td>
                  <td className="py-3 pr-4">{colaboradores}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map(({ setor, equipes, colaboradores, diretor }) => {
            return (
              <button
                key={setor.id_setor}
                className="group relative flex flex-col rounded-lg border bg-card p-4 text-left transition hover:bg-accent/50 cursor-pointer"
                onClick={() => {
                  const qs = new URLSearchParams()
                  qs.set('setor', String(setor.id_setor))
                  navigate(`/dashboard/equipes?${qs.toString()}`)
                }}
              >
                <ItemGroup>
                  <ItemHeader>
                    <ItemTitle>
                      <span className="truncate">{setor.nome_setor}</span>
                    </ItemTitle>
                    <ChevronRight className="size-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                  </ItemHeader>
                  <Item className="mt-2" variant="muted" size="sm">
                    <ItemContent>
                      <div className="text-[11px] text-muted-foreground">Diretor responsável</div>
                      <div className="flex items-center gap-2 text-sm font-medium truncate">
                        <Avatar className="size-6">
                          <AvatarImage src={(diretor as any)?.avatar ?? undefined} alt="" />
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
              </button>
            )
          })}
          {list.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">Nenhum setor encontrado.</div>
          )}
        </div>
      )}
    </div>
  )
}


