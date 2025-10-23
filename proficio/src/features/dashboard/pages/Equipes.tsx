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
  const [gestoresByEquipe, setGestoresByEquipe] = useState<Record<number, string>>({})
  const [setorOpen, setSetorOpen] = useState(false)
  const [setorQuery, setSetorQuery] = useState('')
  const setorRef = useRef<HTMLDivElement | null>(null)

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
      const map: Record<number, string> = {}
      for (const c of Array.isArray(res.data) ? res.data : []) {
        if ((c as any).role === 'Gestor') {
          const teamId = (c as any).id_equipe ?? c.equipe?.id_equipe
          if (teamId != null && map[teamId] == null) {
            map[teamId] = `${c.nome} ${c.sobrenome}`.trim()
          }
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
                <th className="py-2 pr-4">Equipe</th>
                <th className="py-2 pr-4">Setor</th>
                {user?.role === 'Diretor' && <th className="py-2 pr-4">Responsável</th>}
                {user?.role === 'Gestor' && <th className="py-2 pr-4">Minha equipe</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(eq => (
                <tr key={eq.id_equipe} className="border-t hover:bg-accent/40 cursor-pointer" onClick={() => navigate(`/dashboard/colaboradores?setor=${eq.setor?.id_setor ?? eq.id_setor}&equipe=${eq.id_equipe}`)}>
                  <td className="py-3 pr-4 font-medium">{eq.nome_equipe}</td>
                  <td className="py-3 pr-4">{eq.setor?.nome_setor ?? '—'}</td>
                  {user?.role === 'Diretor' && (
                    <td className="py-3 pr-4">{gestoresByEquipe[eq.id_equipe] ?? '—'}</td>
                  )}
                  {user?.role === 'Gestor' && (
                    <td className="py-3 pr-4">
                      {eq.id_equipe === myTeamId ? (
                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]">Sua equipe</span>
                      ) : null}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(eq => (
            <button
              key={eq.id_equipe}
              className="group relative flex flex-col rounded-lg border bg-card p-3 text-left transition hover:bg-accent/50 cursor-pointer"
              onClick={() => {
                const qs = new URLSearchParams()
                qs.set('equipe', String(eq.id_equipe))
                qs.set('setor', String(eq.setor?.id_setor ?? eq.id_setor))
                navigate(`/dashboard/colaboradores?${qs.toString()}`)
              }}
            >
              <div className="flex items-start gap-2">
                <div className="font-medium truncate">{eq.nome_equipe}</div>
                {user?.role === 'Gestor' && eq.id_equipe === myTeamId && (
                  <span className="ml-auto inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]">Sua equipe</span>
                )}
                <ChevronRight className="size-4 opacity-60 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <div className="mt-1 text-xs text-muted-foreground truncate">{eq.setor?.nome_setor ?? '—'}</div>
              {user?.role === 'Diretor' && (
                <div className="mt-2 text-xs">Gestor: <span className="font-medium">{gestoresByEquipe[eq.id_equipe] ?? '—'}</span></div>
              )}
              {user?.role === 'Gestor' && eq.id_equipe === myTeamId && null}
            </button>
          ))}
          {filtered.length === 0 && (
            <Card className="px-4 py-10 text-center text-sm text-muted-foreground">Nenhuma equipe encontrada.</Card>
          )}
        </div>
      )}
    </div>
  )
}



