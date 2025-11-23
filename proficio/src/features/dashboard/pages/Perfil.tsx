import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Separator } from '@/shared/components/ui/separator'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerTrigger, DrawerFooter, DrawerClose } from '@/shared/components/ui/drawer'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { api } from '@/shared/lib/api'
import type { Colaborador, ColaboradorCompetencia } from '@/shared/types'
import { SquarePen, GripVertical, X, Camera } from 'lucide-react'
import { toast } from 'sonner'
import { AvatarEditorModal } from '@/features/dashboard/components/AvatarEditorModal'
import { CoverEditorModal } from '@/features/dashboard/components/CoverEditorModal'
import { Skeleton } from '@/shared/components/ui/skeleton'

type Gender = 'Male' | 'Female'

function FemaleAvatarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" shapeRendering="geometricPrecision">
      <circle cx="12" cy="8" r="4" fill="currentColor" />
      <path d="M4 20a8 8 0 0 1 16 0" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function MaleAvatarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" shapeRendering="geometricPrecision">
      <circle cx="12" cy="7.5" r="3.5" fill="currentColor" />
      <path d="M6 20c0-3.314 2.686-6 6-6s6 2.686 6 6" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function inferGenderFromName(name: string | undefined): Gender {
  const n = (name ?? '').trim().toLowerCase()
  if (!n) return 'Male'
  const FemaleNames = new Set([
    'tainara', 'mariana', 'fernanda', 'patrícia', 'patricia'
  ])
  const MaleNames = new Set([
    'adler', 'richard', 'lucas', 'bruno'
  ])
  if (FemaleNames.has(n)) return 'Female'
  if (MaleNames.has(n)) return 'Male'
  if (n.endsWith('a')) return 'Female'
  return 'Male'
}

export function Perfil() {
  const { user } = useAuth()
  const [editMode] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)
  const [skills, setSkills] = useState<string[]>([])
  const [skillItems, setSkillItems] = useState<{ id: number; nome: string; ordem: number; level?: number }[]>([])
  const [profileEmail, setProfileEmail] = useState<string>('')
  const [profileName, setProfileName] = useState<string>('')
  const [profileCargo, setProfileCargo] = useState<string>('')
  const [profileLocation, setProfileLocation] = useState<string>('')
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>(undefined)
  const [profileCover, setProfileCover] = useState<string | undefined>(undefined)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [draftSkills, setDraftSkills] = useState<string[]>(skills)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [allCompetencias, setAllCompetencias] = useState<{ id_competencia: number; nome: string }[]>([])
  const [ownCompetencias, setOwnCompetencias] = useState<{ id_competencia: number; nome: string; proeficiencia: number }[]>([])
  // crop state
  const [avatarCropOpen, setAvatarCropOpen] = useState(false)
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [coverCropOpen, setCoverCropOpen] = useState(false)
  const [coverSrc, setCoverSrc] = useState<string | null>(null)
  const coverInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (drawerOpen) setDraftSkills(skills)
  }, [drawerOpen, skills])


  useEffect(() => {
    async function fetchProfile() {
      if (!user?.id) return
      const { data } = await api.get<Colaborador>(`/colaboradores/${encodeURIComponent(user.id)}/perfil`)
      setProfileEmail(`${user.email ?? ''}`)
      setProfileName([data.nome, data.sobrenome].filter(Boolean).join(' '))

      setProfileCargo((data as any).cargo?.nome_cargo ?? (data as any).cargo?.nome ?? '—')
      setProfileLocation((data as any).equipe?.setor?.nome_setor ?? (data as any).equipe?.setor?.nome ?? '')

      const avatarValue = (data as any).avatar as unknown
      if (avatarValue instanceof Blob) {
        setProfilePhoto(URL.createObjectURL(avatarValue))
      } else {
        const s = (avatarValue as string | null) ?? null
        setProfilePhoto(s ? (s.startsWith('data:') ? s : `data:image/png;base64,${s}`) : undefined)
      }

      const capaValue = (data as any).capa as unknown
      if (capaValue instanceof Blob) {
        setProfileCover(URL.createObjectURL(capaValue))
      } else {
        const s = (capaValue as string | null) ?? null
        setProfileCover(s ? (s.startsWith('data:') ? s : `data:image/png;base64,${s}`) : undefined)
      }


      if ((data as any).atualizado_em) {
        setLastUpdated(new Date((data as any).atualizado_em))
      }
      if (data.criado_em) {
        setCreatedAtDate(new Date(data.criado_em))
      }
      const destacadasFull = (data.competencias ?? [])
        .filter((cc) => cc.ordem != null && (cc.ordem as number) > 0)
        .slice()
        .sort((a: ColaboradorCompetencia, b: ColaboradorCompetencia) => (a.ordem as number) - (b.ordem as number))
        .map((cc) => ({ id: cc.id, nome: cc.competencia?.nome ?? '', ordem: (cc.ordem as number), level: (cc.proeficiencia as number) || 0 }))
        .filter((i) => Boolean(i.nome))
      setSkillItems(destacadasFull.slice(0, 4))
      setSkills(destacadasFull.slice(0, 4).map(i => i.nome))

      const own = (data.competencias ?? [])
        .map((cc) => ({ id_competencia: cc.competencia?.id_competencia as number, nome: cc.competencia?.nome ?? '', proeficiencia: cc.proeficiencia as number }))
        .filter((c) => Boolean(c.nome) && Number.isFinite(c.id_competencia)) as { id_competencia: number; nome: string; proeficiencia: number }[]
      setOwnCompetencias(own)
      setAllCompetencias(own.map(({ id_competencia, nome }) => ({ id_competencia, nome })))
      setProfileLoading(false)
    }
    fetchProfile()
  }, [user?.id])

  useEffect(() => {
    async function fetchOwnCompetencias() {
      if (!user?.id) return
      const { data } = await api.get<ColaboradorCompetencia[]>(`/colaboradores/${encodeURIComponent(user.id)}/competencias`)
      const own = (Array.isArray(data) ? data : [])
        .map((cc: any) => ({ id_competencia: cc?.competencia?.id_competencia, nome: cc?.competencia?.nome, proeficiencia: cc?.proeficiencia }))
        .filter((c) => Boolean(c.nome) && Number.isFinite(c.id_competencia)) as { id_competencia: number; nome: string; proeficiencia: number }[]
      setOwnCompetencias(own)
      setAllCompetencias(own.map(({ id_competencia, nome }) => ({ id_competencia, nome })))
    }
    fetchOwnCompetencias()
  }, [user?.id])

  function getLevelClass(level: number) {
    if (level === 1) return 'bg-emerald-300 text-emerald-900 border-emerald-400'
    if (level === 2) return 'bg-emerald-700 text-white border-emerald-800'
    if (level === 3) return 'bg-orange-500 text-white border-orange-600'
    if (level === 4) return 'bg-red-500 text-white border-red-600'
    return 'bg-purple-600 text-white border-purple-700'
  }

  function reorder(list: string[], start: number, end: number) {
    const copy = [...list]
    const [removed] = copy.splice(start, 1)
    copy.splice(end, 0, removed)
    return copy
  }
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [createdAtDate, setCreatedAtDate] = useState<Date | null>(null)

  function formatRelative(date: Date | null) {
    if (!date) return '—'
    const diffMs = Date.now() - date.getTime()
    const minutes = Math.floor(diffMs / 60000)
    if (minutes < 1) return 'agora'
    if (minutes < 60) return `há ${minutes} min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `há ${hours} h`
    const days = Math.floor(hours / 24)
    return `há ${days} dias`
  }

  function formatTenure(date: Date | null) {
    if (!date) return '—'
    const now = new Date()
    let years = now.getFullYear() - date.getFullYear()
    let months = now.getMonth() - date.getMonth()
    let days = now.getDate() - date.getDate()
    if (days < 0) {
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate()
      days += prevMonth
      months -= 1
    }
    if (months < 0) {
      months += 12
      years -= 1
    }
    const parts = [] as string[]
    if (years > 0) parts.push(`${years} ${years === 1 ? 'ano' : 'anos'}`)
    if (months > 0) parts.push(`${months} ${months === 1 ? 'mês' : 'meses'}`)
    if (days > 0 || parts.length === 0) parts.push(`${days} ${days === 1 ? 'dia' : 'dias'}`)
    return parts.join(' ')
  }

  if (profileLoading) {
    return (
      <div className="space-y-6">
        <div className="relative h-40 md:h-56 w-full overflow-hidden rounded-xl border">
          <Skeleton className="h-full w-full" />
        </div>
        <Card className="relative -mt-10 px-6 py-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative -mt-12">
              <Skeleton className="h-24 w-24 rounded-full" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-7 w-56" />
              <div className="flex items-center gap-3 flex-wrap">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-80" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 items-center">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-5 w-28 rounded-md" />
                ))}
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {[...Array(6)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-5 w-48" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative h-40 md:h-56 w-full overflow-hidden rounded-xl border">
        <img
          src={profileCover ?? 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600&auto=format&fit=crop'}
          alt="Capa"
          className="h-full w-full object-cover"
        />
        {editMode && (
          <div className="absolute bottom-2 right-2">
            <button
              type="button"
              className="rounded-md border bg-background/90 px-2 py-1 text-xs shadow-sm hover:bg-accent"
              onClick={() => setCoverCropOpen(true)}
            >
              Alterar capa
            </button>
          </div>
        )}
      </div>
      <Card className="relative -mt-10 px-6 py-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative -mt-12">
            <Avatar className="size-24 ring-2 ring-background shadow-md">
              <AvatarImage src={photoPreview ?? profilePhoto ?? undefined} alt="Colaborador" />
              <AvatarFallback className="text-[0px]">
                {inferGenderFromName(profileName?.split(' ')?.[0]) === 'Female' ? (
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
            {editMode && (
              <button
                type="button"
                onClick={() => setAvatarCropOpen(true)}
                className="absolute -bottom-2 -right-2 grid place-items-center size-8 rounded-full bg-primary text-primary-foreground shadow ring-2 ring-background hover:brightness-95"
                aria-label="Alterar foto de perfil"
              >
                <Camera className="size-4" />
              </button>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground truncate">
              {profileName || user?.name || ''}
            </div>
            <div className="mt-1 flex items-center gap-3 flex-wrap text-sm">
              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium bg-primary/10 text-primary/80 border-primary/20">
                {profileCargo || '—'}
              </span>
              <span className="text-xs text-muted-foreground">{profileLocation || '—'}</span>
              <span className="text-xs text-muted-foreground">Vínculo: {formatTenure(createdAtDate)}</span>
            </div>
          </div>
        </div>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (!f) return
          const url = URL.createObjectURL(f)
          setAvatarSrc(url)
        }}
      />
      <AvatarEditorModal
        open={avatarCropOpen}
        src={avatarSrc ?? (profilePhoto ?? null)}
        onPick={() => fileInputRef.current?.click()}
        onClose={() => { setAvatarCropOpen(false); setAvatarSrc(null) }}
        onSave={(blob) => {
          const reader = new FileReader()
          reader.onload = async () => {
            const base64 = String(reader.result)
            setPhotoPreview(base64)
            await api.patch(`/colaboradores/${user!.id}/perfil`, { avatar: base64 })
            setProfilePhoto(base64)
            try { window.dispatchEvent(new CustomEvent('profile-avatar-updated', { detail: base64 })) } catch { }
            setLastUpdated(new Date())
            toast.success('Foto de perfil atualizada')
            setAvatarCropOpen(false)
            setAvatarSrc(null)
          }
          reader.readAsDataURL(blob)
        }}
      />

      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (!f) return
          const url = URL.createObjectURL(f)
          setCoverSrc(url)
        }}
      />
      <CoverEditorModal
        open={coverCropOpen}
        src={coverSrc ?? (profileCover ?? null)}
        onPick={() => coverInputRef.current?.click()}
        onClose={() => { setCoverCropOpen(false); setCoverSrc(null) }}
        onSave={(blob) => {
          const reader = new FileReader()
          reader.onload = async () => {
            const base64 = String(reader.result)
            setProfileCover(base64)
            await api.patch('/perfil', { capa: base64 })
            setLastUpdated(new Date())
            toast.success('Capa atualizada')
            setCoverCropOpen(false)
            setCoverSrc(null)
          }
          reader.readAsDataURL(blob)
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Competências destacadas</CardTitle>
            <CardDescription>Gerencie suas competências técnicas e comportamentais em destaque</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 items-center">
              {skills.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  Você ainda não possui competências em destaque. Use "Editar perfil" para selecionar até 4.
                </div>
              )}
              {skills.map((s) => {
                const level = ownCompetencias.find((c) => c.nome === s)?.proeficiencia || skillItems.find((i) => i.nome === s)?.level || 0
                const cls = getLevelClass(level)
                return (
                  <span key={s} className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
                    {s}
                  </span>
                )
              })}
              <Drawer direction="right" open={drawerOpen} onOpenChange={setDrawerOpen}>
                <DrawerTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={`rounded-sm text-muted-foreground ${editMode ? '' : 'invisible pointer-events-none'}`}
                    aria-hidden={!editMode}
                  >
                    <SquarePen className="size-4 text-gray-400" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Organizar competências em destaque</DrawerTitle>
                    <DrawerDescription>
                      Arraste para ordenar como preferir.
                    </DrawerDescription>
                  </DrawerHeader>
                  <div className="p-4 space-y-2">
                    {draftSkills.map((s, i) => (
                      <div
                        key={s}
                        className="flex items-center justify-between rounded-md border px-3 py-2 text-sm select-none"
                        draggable
                        onDragStart={() => setDragIndex(i)}
                        onDragOver={(e) => {
                          e.preventDefault()
                          if (dragIndex === null || dragIndex === i) return
                          setDraftSkills((prev) => reorder(prev, dragIndex, i))
                          setDragIndex(i)
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <GripVertical className="size-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{i + 1}.</span>
                          <span className="font-medium">{s}</span>
                        </div>
                        <button
                          className="rounded-md border px-2 py-1 text-xs hover:bg-accent"
                          onClick={() => setDraftSkills((prev) => prev.filter((x) => x !== s))}
                          type="button"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 pt-0 space-y-2">
                    <div className="text-xs font-medium">Disponíveis</div>
                    <div className="flex flex-wrap gap-2">
                      {allCompetencias
                        .filter(c => !draftSkills.includes(c.nome))
                        .map(c => (
                          <button
                            key={c.id_competencia}
                            className="rounded-md border px-2 py-1 text-xs hover:bg-accent disabled:opacity-50"
                            disabled={draftSkills.length >= 4}
                            onClick={() => {
                              if (draftSkills.length >= 4) return
                              setDraftSkills((prev) => [...prev, c.nome])
                            }}
                          >
                            {c.nome}
                          </button>
                        ))}
                    </div>
                    {draftSkills.length >= 4 && (
                      <div className="text-xs text-muted-foreground">Limite de 4 competências em destaque.</div>
                    )}
                  </div>
                  <DrawerFooter>
                    <DrawerClose asChild>
                      <Button variant="outline" onClick={() => setDraftSkills(skills)}>Cancelar</Button>
                    </DrawerClose>
                    <Button
                      onClick={async () => {
                        const nextNames = draftSkills.slice(0, 4)
                        const next = nextNames.map((nome, idx) => {
                          const found = skillItems.find(i => i.nome === nome)
                          if (found) return { id: found.id, ordem: idx + 1 }
                          const comp = allCompetencias.find(c => c.nome === nome)
                          return comp ? { id_competencia: comp.id_competencia, ordem: idx + 1 } : null
                        }).filter(Boolean) as { id?: number; id_competencia?: number; ordem: number }[]
                        try {
                          await api.patch(`/colaboradores/${user!.id}/perfil`, { competencias: next })
                          setSkills(nextNames)
                          const { data } = await api.get<Colaborador>(`/colaboradores/${encodeURIComponent(user!.id)}/perfil`)
                          const atualizadas = (data.competencias ?? [])
                            .filter((cc) => cc.ordem != null && (cc.ordem as number) > 0)
                            .slice()
                            .sort((a: ColaboradorCompetencia, b: ColaboradorCompetencia) => (a.ordem as number) - (b.ordem as number))
                            .map((cc) => ({ id: cc.id, nome: cc.competencia?.nome ?? '', ordem: (cc.ordem as number), level: (cc.proeficiencia as number) || 0 }))
                            .filter((i) => Boolean(i.nome))
                          setSkillItems(atualizadas.slice(0, 4))
                          if ((data as any).avatar) {
                            const s = (data as any).avatar as string
                            setProfilePhoto(s.startsWith('data:') ? s : `data:image/png;base64,${s}`)
                          }
                          if ((data as any).capa) {
                            const s = (data as any).capa as string
                            setProfileCover(s.startsWith('data:') ? s : `data:image/png;base64,${s}`)
                          }
                          if ((data as any).atualizado_em) setLastUpdated(new Date((data as any).atualizado_em))
                          toast.success('Competências destacadas atualizadas')
                        } finally {
                          setDrawerOpen(false)
                        }
                      }}
                    >
                      Salvar
                    </Button>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
            <CardDescription>Visão geral do seu progresso</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Competências cadastradas</span>
                <span className="text-sm font-medium">{allCompetencias.length}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Última atualização</span>
                <span className="text-sm font-medium">{formatRelative(lastUpdated)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sobre você</CardTitle>
          <CardDescription>Informações públicas do seu perfil</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs text-muted-foreground">Nome</div>
              <div className="text-sm font-medium">{profileName || user?.name || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Vínculo</div>
              <div className="text-sm font-medium">{formatTenure(createdAtDate)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Cargo</div>
              <div className="text-sm font-medium">{profileCargo || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Email</div>
              <div className="text-sm font-medium">{profileEmail || user?.email || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Local</div>
              <div className="text-sm font-medium">{profileLocation || '—'}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


