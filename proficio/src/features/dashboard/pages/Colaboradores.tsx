import { useEffect, useMemo, useState, useRef } from 'react'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { api } from '@/shared/lib/api'
import type { Colaborador, Setor, Equipe } from '@/shared/types'
import { List, LayoutGrid } from 'lucide-react'
import { CollaboratorProfileModal } from '@/features/dashboard/components/CollaboratorProfileModal'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { ButtonGroup } from '@/shared/components/ui/button-group'
import { useLocation, useNavigate } from 'react-router-dom'
import { Roles } from '@/shared/constants/roles'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/shared/components/ui/command'
import { ChevronDown } from 'lucide-react'

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
        <div className="ml-auto">
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
                      <div className="font-medium truncate">{c.nome} {c.sobrenome}</div>
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
            <Card key={c.id_colaborador} className="hover:shadow-sm hover:bg-accent/40 transition-colors cursor-pointer" onClick={() => setSelectedId(c.id_colaborador)}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="size-12">
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
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{c.nome} {c.sobrenome}</div>
                    <div className="text-xs text-muted-foreground truncate">{c.cargo?.nome_cargo ?? '—'}</div>
                    <div className="mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]">{c.equipe?.setor?.nome_setor ?? '—'}</div>
                  </div>
                </div>
                <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                  <div>{(c as any).email ?? '—'}</div>
                  <div>{c.equipe?.nome_equipe ?? '—'}</div>
                  <div>{c.equipe?.setor?.nome_setor ?? '—'}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CollaboratorProfileModal idColaborador={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}

