import { useEffect, useMemo, useState, useRef } from 'react'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { api } from '@/shared/lib/api'
import type { Colaborador, Setor, Equipe, Cargo, Competencia, ColaboradorCompetencia } from '@/shared/types'
import { List, LayoutGrid, Plus, Camera } from 'lucide-react'
import { format as formatDateFns } from 'date-fns'
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
import { Skeleton } from '@/shared/components/ui/skeleton'
import { AvatarEditorModal } from '@/features/dashboard/components/AvatarEditorModal'
import { DatePicker } from '@/shared/components/ui/date-picker'

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
  const competenciaParam = params.get('competencia')
  const proeficienciaParam = params.get('proeficiencia')
  const filterSetorFromUrl = setorParam ? Number(setorParam) : NaN
  const filterEquipeFromUrl = equipeParam ? Number(equipeParam) : NaN
  const filterCompetenciaFromUrl = competenciaParam ? Number(competenciaParam) : NaN
  const filterProeficienciaFromUrl = proeficienciaParam ? Number(proeficienciaParam) : NaN

  const [mode, setMode] = useState<ViewMode>('table')
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Colaborador[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [myTeamId, setMyTeamId] = useState<number | null>(null)
  const [setores, setSetores] = useState<Setor[]>([])
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [cargos, setCargos] = useState<Cargo[]>([])
  const [competencias, setCompetencias] = useState<Competencia[]>([])
  const [competenciasByColab, setCompetenciasByColab] = useState<Record<number, ColaboradorCompetencia[]>>({})
  const [selectedSetor, setSelectedSetor] = useState<number | 'all'>(isFinite(filterSetorFromUrl) ? filterSetorFromUrl : 'all')
  const [selectedEquipe, setSelectedEquipe] = useState<number | 'all'>(isFinite(filterEquipeFromUrl) ? filterEquipeFromUrl : 'all')
  const [selectedCompetencia, setSelectedCompetencia] = useState<number | 'all'>(isFinite(filterCompetenciaFromUrl) ? filterCompetenciaFromUrl : 'all')
  const [selectedProeficiencia, setSelectedProeficiencia] = useState<number | 'all'>(isFinite(filterProeficienciaFromUrl) ? filterProeficienciaFromUrl : 'all')
  const [showSetor, setShowSetor] = useState(false)
  const [showEquipe, setShowEquipe] = useState(false)
  const [showCompetencia, setShowCompetencia] = useState(false)
  const [setorQuery, setSetorQuery] = useState('')
  const [equipeQuery, setEquipeQuery] = useState('')
  const [competenciaQuery, setCompetenciaQuery] = useState('')
  const setorRef = useRef<HTMLDivElement | null>(null)
  const equipeRef = useRef<HTMLDivElement | null>(null)
  const competenciaRef = useRef<HTMLDivElement | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novoSobrenome, setNovoSobrenome] = useState('')
  const [novoEmail, setNovoEmail] = useState('')
  const [novoEquipe, setNovoEquipe] = useState<number | 'none'>('none')
  const [novoRole, setNovoRole] = useState<'Diretor' | 'Gestor' | 'Colaborador'>('Colaborador')
  const [novoCargo, setNovoCargo] = useState<number | ''>('')
  const [novoSetorFiltro, setNovoSetorFiltro] = useState<number | ''>('')
  const [novoSenha, setNovoSenha] = useState('')
  const [novoGenero, setNovoGenero] = useState<'Masculino' | 'Feminino' | ''>('')
  const [novoNascimento, setNovoNascimento] = useState<Date | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const [newAvatarOpen, setNewAvatarOpen] = useState(false)
  const [newAvatarSrc, setNewAvatarSrc] = useState<string | null>(null)
  const [newAvatarBase64, setNewAvatarBase64] = useState<string | null>(null)
  const newAvatarInputRef = useRef<HTMLInputElement | null>(null)

  function generateRandomPassword() {
    const base = 'trocar'
    const pick = Math.floor(Math.random() * 3)
    if (pick === 0) return base + Math.floor(Math.random() * 999 + 1)
    if (pick === 1) return base + '!' + Math.floor(Math.random() * 9 + 1)
    return base + Math.floor(Math.random() * 9 + 1)
  }
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const target = e.target as Node | null
      const clickedInsideSetor = setorRef.current?.contains(target as Node) ?? false
      const clickedInsideEquipe = equipeRef.current?.contains(target as Node) ?? false
      const clickedInsideCompetencia = competenciaRef.current?.contains(target as Node) ?? false
      if (!clickedInsideSetor) setShowSetor(false)
      if (!clickedInsideEquipe) setShowEquipe(false)
      if (!clickedInsideCompetencia) setShowCompetencia(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  useEffect(() => {
    setInitialLoading(true)
    Promise.all([
      api.get<Colaborador[]>('/colaboradores'),
      api.get<any[]>('/setores'),
      api.get<any[]>('/equipes?status=all'),
      api.get<Cargo[]>('/cargos'),
      api.get<Competencia[]>('/competencias'),
    ])
      .then(([c, s, e, cg, comps]) => {
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
        setCargos(cg.data as any)
        const mappedCompetencias: Competencia[] = (comps.data || []).map((vm: any) => ({
          id_competencia: vm.id ?? vm.id_competencia ?? vm.idCompetencia ?? 0,
          nome: vm.nome ?? vm.name ?? '',
          tipo: Number(vm.tipo ?? 0) as 0 | 1,
        }))
        setCompetencias(mappedCompetencias)
      })
      .finally(() => setInitialLoading(false))
  }, [])

  useEffect(() => {
    setNovoEquipe('none')
  }, [novoSetorFiltro])

  useEffect(() => {
    if (!user?.id) return
    api.get<Colaborador>(`/colaboradores/${encodeURIComponent(user.id)}/perfil`).then((res) => {
      setMyTeamId(res.data?.equipe?.id_equipe ?? null)
    })
  }, [user?.id])

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
    let base = items

    if (user?.role === Roles.Gestor) {
      base = base.filter(c => {
        const role = (c as any).role ?? c.role
        return role !== Roles.Diretor
      })
    } else {
      if (selectedSetor !== 'all') base = base.filter(c => (
        (c as any).idSetor ??
        c.equipe?.setor?.id_setor ??
        (c as any).id_setor
      ) === selectedSetor)
      if (selectedEquipe !== 'all') base = base.filter(c => (
        (c as any).idEquipe ??
        c.equipe?.id_equipe ??
        (c as any).id_equipe
      ) === selectedEquipe)
    }

    if ((user?.role === Roles.Diretor || user?.role === Roles.Gestor) && selectedCompetencia !== 'all') {
      base = base.filter(c => {
        const colabId = (c as any).id_colaborador ?? (c as any).id
        if (!colabId || !Number.isFinite(Number(colabId))) return false
        const list = competenciasByColab[Number(colabId)] || []
        const hasCompetencia = list.some(cc => {
          if (cc.id_competencia !== selectedCompetencia) return false
          if (selectedProeficiencia !== 'all') {
            return cc.proeficiencia === selectedProeficiencia
          }
          return true
        })
        return hasCompetencia
      })
    }

    if (!t) return base
    return base.filter(c => `${c.nome} ${c.sobrenome}`.toLowerCase().includes(t) || (c as any).email?.toLowerCase()?.includes(t))
  }, [q, items, user?.role, myTeamId, selectedSetor, selectedEquipe, selectedCompetencia, selectedProeficiencia, competenciasByColab])

  if (initialLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
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
        {mode === 'table' ? (
          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            {[...Array(8)].map((_, idx) => (
              <Skeleton key={idx} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, idx) => (
              <div key={idx} className="rounded-xl border p-4">
                <Skeleton className="h-40 w-full" />
                <div className="mt-3 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-16 w-full" />
                  <div className="grid grid-cols-2 gap-2">
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-14 w-full" />
                  </div>
                  <Skeleton className="h-14 w-full" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-full max-w-sm">
          <Input placeholder="Buscar colaborador..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {(user?.role === Roles.Diretor || user?.role === Roles.Gestor) && (
          <>
            <div className="relative" ref={setorRef}>
              <div className="inline-flex h-8 items-center gap-2 rounded-md border px-3 text-sm cursor-pointer" onClick={() => { setShowSetor((v) => !v); setShowEquipe(false); setShowCompetencia(false) }}>
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
                        <CommandItem onSelect={() => { 
                          setSelectedSetor('all'); 
                          setSelectedEquipe('all'); 
                          setShowSetor(false); 
                          setSetorQuery(''); 
                          const qs = new URLSearchParams(); 
                          if (selectedCompetencia !== 'all') qs.set('competencia', String(selectedCompetencia)); 
                          if (selectedProeficiencia !== 'all') qs.set('proeficiencia', String(selectedProeficiencia)); 
                          navigate(qs.toString() ? `/dashboard/colaboradores?${qs.toString()}` : '/dashboard/colaboradores') 
                        }}>Todos</CommandItem>
                        {setores.filter(s => s.nome_setor.toLowerCase().includes(setorQuery.toLowerCase())).map(s => (
                          <CommandItem key={s.id_setor} onSelect={() => { 
                            setSelectedSetor(s.id_setor); 
                            setSelectedEquipe('all'); 
                            setShowSetor(false); 
                            setSetorQuery(''); 
                            const qs = new URLSearchParams(); 
                            qs.set('setor', String(s.id_setor)); 
                            if (selectedCompetencia !== 'all') qs.set('competencia', String(selectedCompetencia)); 
                            if (selectedProeficiencia !== 'all') qs.set('proeficiencia', String(selectedProeficiencia)); 
                            navigate(`/dashboard/colaboradores?${qs.toString()}`) 
                          }}>{s.nome_setor}</CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
              )}
            </div>
            <div className="relative" ref={equipeRef}>
              <div className="inline-flex h-8 items-center gap-2 rounded-md border px-3 text-sm cursor-pointer" onClick={() => { setShowEquipe((v) => !v); setShowSetor(false); setShowCompetencia(false) }}>
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
                        <CommandItem onSelect={() => { 
                          setSelectedEquipe('all'); 
                          setShowEquipe(false); 
                          setEquipeQuery(''); 
                          const qs = new URLSearchParams(); 
                          if (selectedSetor !== 'all') qs.set('setor', String(selectedSetor)); 
                          if (selectedCompetencia !== 'all') qs.set('competencia', String(selectedCompetencia)); 
                          if (selectedProeficiencia !== 'all') qs.set('proeficiencia', String(selectedProeficiencia)); 
                          navigate(qs.toString() ? `/dashboard/colaboradores?${qs.toString()}` : '/dashboard/colaboradores') 
                        }}>Todas</CommandItem>
                        {(selectedSetor === 'all' ? equipes : equipes.filter(e => e.id_setor === selectedSetor))
                          .filter(e => e.nome_equipe.toLowerCase().includes(equipeQuery.toLowerCase()))
                          .map(e => (
                            <CommandItem key={e.id_equipe} onSelect={() => { 
                              setSelectedEquipe(e.id_equipe); 
                              setShowEquipe(false); 
                              setEquipeQuery(''); 
                              const qs = new URLSearchParams(); 
                              if (selectedSetor !== 'all') qs.set('setor', String(selectedSetor)); 
                              qs.set('equipe', String(e.id_equipe)); 
                              if (selectedCompetencia !== 'all') qs.set('competencia', String(selectedCompetencia)); 
                              if (selectedProeficiencia !== 'all') qs.set('proeficiencia', String(selectedProeficiencia)); 
                              navigate(`/dashboard/colaboradores?${qs.toString()}`) 
                            }}>{e.nome_equipe}</CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
              )}
            </div>
            {user?.role === Roles.Diretor && (
              <div className="relative" ref={competenciaRef}>
                <div className="inline-flex h-8 items-center gap-2 rounded-md border px-3 text-sm cursor-pointer" onClick={() => { setShowCompetencia((v) => !v); setShowSetor(false); setShowEquipe(false) }}>
                  <span className="truncate max-w-[12rem]">{selectedCompetencia === 'all' ? 'Todas as competências' : competencias.find(c => c.id_competencia === selectedCompetencia)?.nome ?? 'Competência'}</span>
                  <ChevronDown className="size-4 opacity-60" />
                </div>
                {showCompetencia && (
                  <div className="absolute z-20 mt-1 w-56 rounded-md border bg-popover shadow-xs">
                    <Command>
                      <CommandInput placeholder="Filtrar competência..." value={competenciaQuery} onValueChange={setCompetenciaQuery} />
                      <CommandList>
                        <CommandEmpty>Nenhuma competência</CommandEmpty>
                        <CommandGroup>
                          <CommandItem onSelect={() => { 
                            setSelectedCompetencia('all'); 
                            setShowCompetencia(false); 
                            setCompetenciaQuery(''); 
                            const qs = new URLSearchParams(); 
                            if (selectedSetor !== 'all') qs.set('setor', String(selectedSetor)); 
                            if (selectedEquipe !== 'all') qs.set('equipe', String(selectedEquipe)); 
                            if (selectedProeficiencia !== 'all') qs.set('proeficiencia', String(selectedProeficiencia)); 
                            navigate(qs.toString() ? `/dashboard/colaboradores?${qs.toString()}` : '/dashboard/colaboradores') 
                          }}>Todas</CommandItem>
                          {competencias
                            .filter(c => c.nome.toLowerCase().includes(competenciaQuery.toLowerCase()))
                            .map(c => (
                              <CommandItem key={c.id_competencia} onSelect={() => { 
                                setSelectedCompetencia(c.id_competencia); 
                                setShowCompetencia(false); 
                                setCompetenciaQuery(''); 
                                const qs = new URLSearchParams(); 
                                if (selectedSetor !== 'all') qs.set('setor', String(selectedSetor)); 
                                if (selectedEquipe !== 'all') qs.set('equipe', String(selectedEquipe)); 
                                qs.set('competencia', String(c.id_competencia)); 
                                if (selectedProeficiencia !== 'all') qs.set('proeficiencia', String(selectedProeficiencia)); 
                                navigate(`/dashboard/colaboradores?${qs.toString()}`) 
                              }}>{c.nome}</CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Dialog open={addOpen} onOpenChange={(v) => { setAddOpen(v); if (!v) { setNewAvatarBase64(null); setNewAvatarSrc(null) } else { setNovoSenha(generateRandomPassword()) } }}>
            <DialogTrigger asChild>
              <Button size="icon" className="fixed bottom-6 right-6 h-10 p-4 w-auto rounded-lg   shadow-lg">
                <Plus className="size-5" />
                <p>Novo colaborador</p>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[720px]">
              <DialogHeader>
                <DialogTitle>Novo colaborador</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2 md:grid-cols-[220px_1fr]">
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Foto de perfil (opcional)</div>
                  <div className="relative w-fit mx-auto">
                    <Avatar className="size-24 ring-2 ring-background shadow-md">
                      <AvatarImage src={newAvatarBase64 ?? undefined} alt="Prévia" />
                      <AvatarFallback className="text-[0px]">
                        {inferGenderFromName(novoNome?.split(' ')?.[0]) === 'Female' ? (
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
                    <button
                      type="button"
                      onClick={() => { setNewAvatarOpen(true); setNewAvatarSrc(null) }}
                      className="absolute -bottom-2 -right-2 grid place-items-center size-8 rounded-full bg-primary text-primary-foreground shadow ring-2 ring-background hover:brightness-95"
                      aria-label="Selecionar foto de perfil"
                    >
                      <Camera className="size-4" />
                    </button>
                  </div>
                  <input ref={newAvatarInputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (!f) return
                      const url = URL.createObjectURL(f)
                      setNewAvatarSrc(url)
                      setNewAvatarOpen(true)
                    }}
                  />
                </div>
                <div className="grid gap-3">
                  <div className="grid gap-1 md:grid-cols-2 md:gap-3">
                    <div className="grid gap-1">
                      <Label htmlFor="nome-colab">Nome *</Label>
                      <Input id="nome-colab" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} />
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor="sobrenome-colab">Sobrenome</Label>
                      <Input id="sobrenome-colab" value={novoSobrenome} onChange={(e) => setNovoSobrenome(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="email-colab">Email *</Label>
                    <Input id="email-colab" type="email" value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} />
                  </div>
                  <div className="grid gap-1">
                    <Label>Data de nascimento</Label>
                    <DatePicker value={novoNascimento} onChange={setNovoNascimento} />
                  </div>
                  <div className="grid gap-1 md:grid-cols-3 md:gap-3">
                    <div className="grid gap-1">
                      <Label htmlFor="senha-colab">Senha *</Label>
                      <Input id="senha-colab" type="text" value={novoSenha} readOnly />
                    </div>
                    <div className="grid gap-1">
                      <Label>Role *</Label>
                      <select
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={novoRole}
                        onChange={(e) => setNovoRole(e.target.value as any)}
                      >
                        {(user?.role === Roles.Diretor ? (['Diretor','Gestor','Colaborador'] as const) : (['Colaborador'] as const)).map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-1">
                      <Label>Gênero</Label>
                      <select
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        value={novoGenero}
                        onChange={(e) => setNovoGenero(e.target.value as any)}
                      >
                        <option value="">—</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid gap-1">
                    <Label>Setor (filtro)</Label>
                    <select
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={novoSetorFiltro === '' ? '' : String(novoSetorFiltro)}
                      onChange={(e) => setNovoSetorFiltro(e.target.value ? Number(e.target.value) : '')}
                    >
                      <option value="">Todos</option>
                      {setores.map(s => (
                        <option key={s.id_setor} value={s.id_setor}>{s.nome_setor}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-1">
                    <Label>Equipe *</Label>
                    <select
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={novoEquipe === 'none' ? '' : String(novoEquipe)}
                      onChange={(e) => setNovoEquipe(e.target.value ? Number(e.target.value) : 'none')}
                    >
                      <option value="">Selecione uma equipe</option>
                      {(novoSetorFiltro === '' ? equipes : equipes.filter(eq => eq.id_setor === novoSetorFiltro)).map(eq => (
                        <option key={eq.id_equipe} value={eq.id_equipe}>{eq.nome_equipe}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-1">
                    <Label>Cargo *</Label>
                    <select
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={novoCargo === '' ? '' : String(novoCargo)}
                      onChange={(e) => setNovoCargo(e.target.value ? Number(e.target.value) : '')}
                    >
                      <option value="">Selecione um cargo</option>
                      {cargos.map(c => (
                        <option key={c.id_cargo} value={c.id_cargo}>{c.nome_cargo}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  disabled={saving || novoNome.trim().length === 0 || !novoEmail.trim() || novoEquipe === 'none' || !novoSenha.trim() || novoCargo === '' || (user?.role === Roles.Gestor && novoRole !== 'Colaborador')}
                  onClick={async () => {
                    const nome = novoNome.trim()
                    const sobrenome = (novoSobrenome.trim() || '-')
                    const email = novoEmail.trim()
                    if (!nome || !email || novoEquipe === 'none' || !novoSenha.trim()) return
                    setSaving(true)
                    try {
                      const payload: any = {
                        nome,
                        sobrenome,
                        email,
                        idEquipe: novoEquipe as number,
                        status: true as any,
                        role: novoRole as any,
                        senha: novoSenha as any,
                        genero: (novoGenero || undefined) as any,
                        dataNascimento: novoNascimento ? formatDateFns(novoNascimento, 'yyyy-MM-dd') : undefined,
                        idCargo: (novoCargo as number),
                      }
                      const { data } = await api.post<Colaborador>('/colaboradores', payload)
                      let created = data
                      if (newAvatarBase64) {
                        try {
                          const idNew = (created as any)?.id ?? (created as any)?.id_colaborador
                          if (idNew) await api.patch(`/colaboradores/${encodeURIComponent(idNew)}/perfil`, { avatar: newAvatarBase64 })
                        } catch {}
                        ;(created as any).avatar = newAvatarBase64
                      }
                      setItems((prev) => [...prev, created])
                      toast.success('Colaborador criado')
                      setAddOpen(false)
                      setNovoNome('')
                      setNovoSobrenome('')
                      setNovoEmail('')
                      setNovoEquipe('none')
                      setNovoRole('Colaborador')
                      setNovoSenha(generateRandomPassword())
                      setNovoGenero('')
                      setNovoNascimento(undefined)
                      setNewAvatarBase64(null)
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
                <tr key={(c as any).id_colaborador ?? (c as any).id ?? (c as any).email ?? `${c.nome}-${c.sobrenome}`}
                    className="border-t hover:bg-muted/60 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-8">
                        <AvatarImage src={(() => {
                          const a = ((c as any).foto_url ?? (c as any).avatar) as unknown
                          if (!a) return undefined as unknown as string
                          const s = String(a)
                          return s.startsWith('data:') ? s : `data:image/png;base64,${s}`
                        })()} alt="" />
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
                        {String(((c as any).id_colaborador ?? (c as any).id)) === (user?.id ?? '') && (
                          <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]">Você</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4">{(c as any).cargoNome ?? c.cargo?.nome_cargo ?? '—'}</td>
                  <td className="py-3 pr-4">{(c as any).email ?? '—'}</td>
                  <td className="py-3 pr-2 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedId(((c as any).id_colaborador ?? (c as any).id) as number)}
                    >
                      Ver perfil
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(c => (
            <button
              key={(c as any).id_colaborador ?? (c as any).id ?? (c as any).email ?? `${c.nome}-${c.sobrenome}`}
              className="group relative flex flex-col rounded-xl border bg-card p-4 text-left transition hover:bg-accent/50 cursor-pointer"
              onClick={() => setSelectedId(((c as any).id_colaborador ?? (c as any).id) as number)}
            >
              <ItemGroup>
                <ItemHeader>
                  <ItemTitle>
                    <ItemMedia variant="image">
                      <img src={(() => {
                        const a = ((c as any).foto_url ?? (c as any).avatar) as unknown
                        if (!a) return ''
                        const s = String(a)
                        return s.startsWith('data:') ? s : `data:image/png;base64,${s}`
                      })()} alt="" />
                    </ItemMedia>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate font-semibold">{c.nome} {c.sobrenome}</span>
                      {String(((c as any).id_colaborador ?? (c as any).id)) === (user?.id ?? '') && (
                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]">Você</span>
                      )}
                    </div>
                  </ItemTitle>
                </ItemHeader>
                <Item className="mt-2" variant="outline" size="sm">
                  <ItemContent>
                    <div className="text-[11px] text-muted-foreground">Cargo</div>
                    <div className="text-sm font-medium truncate">{(c as any).cargoNome ?? c.cargo?.nome_cargo ?? '—'}</div>
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

      <AvatarEditorModal
        open={newAvatarOpen}
        src={newAvatarSrc}
        onPick={() => newAvatarInputRef.current?.click()}
        onClose={() => { setNewAvatarOpen(false); setNewAvatarSrc(null) }}
        onSave={(blob) => {
          const reader = new FileReader()
          reader.onload = async () => {
            const base64 = String(reader.result)
            setNewAvatarBase64(base64)
            setNewAvatarOpen(false)
            setNewAvatarSrc(null)
          }
          reader.readAsDataURL(blob)
        }}
      />

      {null as any}
    </div>
  )
}

