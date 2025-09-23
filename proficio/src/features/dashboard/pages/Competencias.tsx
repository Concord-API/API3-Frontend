import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Separator } from '@/shared/components/ui/separator'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetClose } from '@/shared/components/ui/sheet'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { api } from '@/shared/lib/api'
import type { ColaboradorCompetencia, Competencia } from '@/shared/types'
import { ChevronDown, Check, Trash } from 'lucide-react'
import { toast } from 'sonner'

type UserCompetenciaItem = ColaboradorCompetencia & { competencia: Competencia }

// Normaliza valores possíveis de tipo ("HARD"|"SOFT"|0|1) para 0|1
const normalizeTipo = (t: unknown): 0 | 1 => {
  if (t === 0 || t === 1) return t as 0 | 1
  const v = String(t).toUpperCase()
  return v === 'SOFT' ? 1 : 0
}

const NIVEL_LABEL: Record<number, string> = {
  1: 'Iniciante',
  2: 'Básico',
  3: 'Intermediário',
  4: 'Avançado',
  5: 'Especialista',
}

export function Competencias() {
  const { user } = useAuth()
  const [allCompetencias, setAllCompetencias] = useState<Competencia[]>([])
  const [userCompetencias, setUserCompetencias] = useState<UserCompetenciaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editItem, setEditItem] = useState<UserCompetenciaItem | null>(null)
  const [editLevel, setEditLevel] = useState<number>(3)

  // Adicionar nova
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Competencia | null>(null)
  const [newLevel, setNewLevel] = useState<number>(3)
  const [newType, setNewType] = useState<0 | 1>(0)
  const [queryTable, setQueryTable] = useState('')
  const [filterType, setFilterType] = useState<'ALL' | 'HARD' | 'SOFT'>('ALL')
  const [sortKey, setSortKey] = useState<'nivel-desc' | 'nivel-asc' | 'nome-asc'>('nivel-desc')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allCompetencias
    return allCompetencias.filter((c) => c.nome.toLowerCase().includes(q))
  }, [allCompetencias, query])

  const stats = useMemo(() => {
    const total = userCompetencias.length
    const avg = total ? (userCompetencias.reduce((s, i) => s + i.proeficiencia, 0) / total) : 0
    const hard = userCompetencias.filter((i) => normalizeTipo(i.competencia?.tipo) === 0).length
    const soft = userCompetencias.filter((i) => normalizeTipo(i.competencia?.tipo) === 1).length
    return { total, avg: Number(avg.toFixed(1)), hard, soft }
  }, [userCompetencias])

  const displayed = useMemo(() => {
    const q = queryTable.trim().toLowerCase()
    let items = userCompetencias.filter((uc) => uc.competencia?.nome.toLowerCase().includes(q))
    if (filterType !== 'ALL') items = items.filter((uc) => (filterType === 'HARD' ? normalizeTipo(uc.competencia?.tipo) === 0 : normalizeTipo(uc.competencia?.tipo) === 1))
    if (sortKey === 'nivel-desc') items = items.slice().sort((a, b) => b.proeficiencia - a.proeficiencia)
    if (sortKey === 'nivel-asc') items = items.slice().sort((a, b) => a.proeficiencia - b.proeficiencia)
    if (sortKey === 'nome-asc') items = items.slice().sort((a, b) => (a.competencia?.nome || '').localeCompare(b.competencia?.nome || ''))
    return items
  }, [userCompetencias, queryTable, filterType, sortKey])

  async function loadData() {
    if (!user?.id) return
    const [allRes, mineRes] = await Promise.all([
      api.get('/competencias'),
      api.get(`/colaboradores/${encodeURIComponent(user.id)}/competencias`),
    ])
    const allList = Array.isArray(allRes.data) ? allRes.data : []
    const normalizedAll = allList.map((c: any) => ({
      ...c,
      tipo: normalizeTipo(c?.tipo),
    })) as Competencia[]
    const mineList = Array.isArray(mineRes.data) ? mineRes.data : []
    const normalizedMine = mineList.map((uc: any) => ({
      ...uc,
      competencia: uc?.competencia ? { ...uc.competencia, tipo: normalizeTipo(uc.competencia.tipo) } : uc?.competencia,
    })) as UserCompetenciaItem[]
    setAllCompetencias(normalizedAll)
    setUserCompetencias(normalizedMine)
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  async function handleAdd() {
    if (!user?.id || !query.trim()) return
    setLoading(true)
    try {
      let comp = selected
      if (!comp) {
        // cria se não existe
        const create = await api.post<Competencia>('/competencias', { nome: query.trim(), tipo: newType === 0 ? 'HARD' : 'SOFT' })
        comp = create.data
      }
      await api.patch(`/colaboradores/${encodeURIComponent(user.id)}/competencias`, {
        competencias: [{ id_competencia: comp!.id_competencia, proeficiencia: newLevel }],
      })
      setQuery('')
      setSelected(null)
      setNewLevel(3)
      await loadData()
      toast.success('Competência adicionada')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total</CardTitle>
            <CardDescription>Competências cadastradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Média</CardTitle>
            <CardDescription>Proeficiência (1 a 5)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{stats.avg}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Distribuição</CardTitle>
            <CardDescription>HARD x SOFT</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-flex items-center rounded-full border px-2 py-0.5">HARD: {stats.hard}</span>
              <span className="inline-flex items-center rounded-full border px-2 py-0.5">SOFT: {stats.soft}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>Minhas competências</CardTitle>
              <CardDescription>Visão geral das suas competências e níveis</CardDescription>
            </div>
            <Sheet>
            <SheetTrigger asChild>
              <Button>Adicionar</Button>
            </SheetTrigger>
            <SheetContent side="right" className="sm:max-w-[520px] px-4">
              <SheetHeader>
                <SheetTitle>Adicionar competência</SheetTitle>
                <SheetDescription>Escolha uma existente ou crie uma nova</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-5">
                <div className="space-y-2">
                  <Label>Competência</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="justify-between w-full">
                        <span className="truncate">{selected?.nome || (query ? query : 'Selecionar/Buscar')}</span>
                        <ChevronDown className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[420px] p-3">
                      <Input
                        placeholder="Digite para buscar..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => {
                          e.stopPropagation()
                          if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp'].includes(e.key)) {
                            e.preventDefault()
                          }
                        }}
                      />
                      <Separator className="my-2" />
                      {filtered.length === 0 && (
                        <div className="px-1 py-1 text-xs text-muted-foreground">Nenhuma encontrada. Continue para criar.</div>
                      )}
                      {filtered.map((c) => (
                        <DropdownMenuItem key={c.id_competencia} onClick={() => { setSelected(c); setQuery(c.nome) }}>
                          <Check className={`mr-2 size-4 ${selected?.id_competencia === c.id_competencia ? 'opacity-100' : 'opacity-0'}`} />
                          <span className="truncate">{c.nome}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <div className="text-xs text-muted-foreground">Se não existir, o próximo passo permite definir detalhes.</div>
                </div>
                {!selected && (
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <div className="flex items-center gap-2">
                      <Button variant={newType === 0 ? 'default' : 'outline'} onClick={() => setNewType(0)}>HARD</Button>
                      <Button variant={newType === 1 ? 'default' : 'outline'} onClick={() => setNewType(1)}>SOFT</Button>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Nível de proeficiência</Label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Button key={n} variant={newLevel === n ? 'default' : 'outline'} onClick={() => setNewLevel(n)}>
                        {n}
                      </Button>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">{NIVEL_LABEL[newLevel]}</div>
                </div>
              </div>
              <SheetFooter className="mt-6">
                <SheetClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </SheetClose>
                <Button onClick={handleAdd} disabled={loading || !query.trim()}>Adicionar</Button>
              </SheetFooter>
            </SheetContent>
            </Sheet>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex-1 min-w-48">
              <Input placeholder="Buscar por nome..." value={queryTable} onChange={(e) => setQueryTable(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Button variant={filterType === 'ALL' ? 'default' : 'outline'} onClick={() => setFilterType('ALL')}>Todos</Button>
              <Button variant={filterType === 'HARD' ? 'default' : 'outline'} onClick={() => setFilterType('HARD')}>HARD</Button>
              <Button variant={filterType === 'SOFT' ? 'default' : 'outline'} onClick={() => setFilterType('SOFT')}>SOFT</Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Ordenar</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSortKey('nivel-desc')}>Nível (maior primeiro)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortKey('nivel-asc')}>Nível (menor primeiro)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortKey('nome-asc')}>Nome (A-Z)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Competência</th>
                  <th className="py-2 pr-4 font-medium">Tipo</th>
                  <th className="py-2 pr-4 font-medium">Proeficiência</th>
                  <th className="py-2 pr-2 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {displayed.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-muted-foreground">Você ainda não possui competências. Clique em Adicionar.</td>
                  </tr>
                )}
                {displayed.map((uc) => {
                  const pct = Math.min(100, Math.max(0, (uc.proeficiencia / 5) * 100))
                  const color = uc.proeficiencia >= 5 ? 'bg-emerald-500' : uc.proeficiencia >= 4 ? 'bg-green-500' : uc.proeficiencia >= 3 ? 'bg-blue-500' : uc.proeficiencia >= 2 ? 'bg-amber-500' : 'bg-red-500'
                  const typeBadge = uc.competencia?.tipo === 0
                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                    : 'bg-violet-100 text-violet-700 border-violet-200'
                  return (
                    <tr key={uc.id} className="border-t">
                      <td className="py-3 pr-4">
                        <div className="font-medium truncate">{uc.competencia?.nome}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${typeBadge}`}>
                          {normalizeTipo(uc.competencia?.tipo) === 0 ? 'HARD' : 'SOFT'}
                        </span>
                      </td>
                      <td className="py-3 pr-4 align-middle">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-40 rounded-full bg-secondary">
                            <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                          </div>
                          <div className="whitespace-nowrap text-xs text-muted-foreground">{NIVEL_LABEL[uc.proeficiencia]} ({uc.proeficiencia}/5)</div>
                        </div>
                      </td>
                      <td className="py-3 pr-2 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setEditItem(uc); setEditLevel(uc.proeficiencia); setEditOpen(true) }}
                        >
                          Editar
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Editar competência</DialogTitle>
            <DialogDescription>Atualize a proeficiência desta competência</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Competência</Label>
              <Input value={editItem?.competencia?.nome ?? ''} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Proeficiência: {editLevel} — {NIVEL_LABEL[editLevel]}</Label>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={editLevel}
                onChange={(e) => setEditLevel(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              variant="destructive"
              onClick={async () => {
                if (!user?.id || !editItem) return
                setLoading(true)
                try {
                  await api.delete(`/colaboradores/${encodeURIComponent(user.id)}/competencias`, { data: { id_item: editItem.id } })
                  await loadData()
                  toast.success('Competência removida')
                  setEditOpen(false)
                } finally {
                  setLoading(false)
                }
              }}
              disabled={loading}
            >
              <Trash className="size-4" />
            </Button>
            <Button
              onClick={async () => {
                if (!user?.id || !editItem) return
                setLoading(true)
                try {
                  await api.patch(`/colaboradores/${encodeURIComponent(user.id)}/competencias`, {
                    competencias: [{ id: editItem.id, id_competencia: editItem.id_competencia, proeficiencia: editLevel }],
                  })
                  await loadData()
                  toast.success('Proeficiência atualizada')
                  setEditOpen(false)
                } finally {
                  setLoading(false)
                }
              }}
              disabled={loading}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


