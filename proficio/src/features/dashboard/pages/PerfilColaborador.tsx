import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Separator } from '@/shared/components/ui/separator'
import { Tooltip, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerTrigger, DrawerFooter, DrawerClose } from '@/shared/components/ui/drawer'
import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { api } from '@/shared/lib/api'
import type { Colaborador, ColaboradorCompetencia } from '@/shared/types'
import { SquarePen, GripVertical, X, Camera } from 'lucide-react'
import { toast } from 'sonner'

export function PerfilColaborador() {
  const { user } = useAuth()
  const [editMode, setEditMode] = useState(false)
  const [skills, setSkills] = useState<string[]>([])
  const [skillItems, setSkillItems] = useState<{ id: number; nome: string; ordem: number }[]>([])
  const [profileEmail, setProfileEmail] = useState<string>('')
  const [profileName, setProfileName] = useState<string>('')
  const [profileCargo, setProfileCargo] = useState<string>('')
  const [profileLocation, setProfileLocation] = useState<string>('')
  const [profilePhoto, setProfilePhoto] = useState<string | undefined>(undefined)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [draftSkills, setDraftSkills] = useState<string[]>(skills)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [allCompetencias, setAllCompetencias] = useState<{ id_competencia: number; nome: string }[]>([])

  useEffect(() => {
    if (drawerOpen) setDraftSkills(skills)
  }, [drawerOpen, skills])

  useEffect(() => {
    async function fetchProfile() {
      if (!user?.id) return
      const { data } = await api.get<Colaborador>(`/perfil?id=${encodeURIComponent(user.id)}`)
      setProfileEmail(`${user.email ?? ''}`)
      setProfileName([data.nome, data.sobrenome].filter(Boolean).join(' '))
      setProfileCargo(data.cargo?.nome_cargo ?? '—')
      setProfileLocation(data.equipe?.setor?.nome_setor ?? '')
      setProfilePhoto(data.foto_url ?? undefined)
      
      if (data.updated_at) {
        setLastUpdated(new Date(data.updated_at))
      }
      const destacadasFull = (data.competencias ?? [])
        .filter((cc) => cc.ordem != null && (cc.ordem as number) > 0)
        .slice()
        .sort((a: ColaboradorCompetencia, b: ColaboradorCompetencia) => (a.ordem as number) - (b.ordem as number))
        .map((cc) => ({ id: cc.id, nome: cc.competencia?.nome ?? '', ordem: (cc.ordem as number) }))
        .filter((i) => Boolean(i.nome))
      setSkillItems(destacadasFull.slice(0, 4))
      setSkills(destacadasFull.slice(0, 4).map(i => i.nome))
    }
    fetchProfile()
  }, [user?.id])

  useEffect(() => {
    async function fetchCompetencias() {
      const { data } = await api.get<{ id_competencia: number; nome: string }[]>(`/competencias`)
      setAllCompetencias(data)
    }
    fetchCompetencias()
  }, [])

  function reorder(list: string[], start: number, end: number) {
    const copy = [...list]
    const [removed] = copy.splice(start, 1)
    copy.splice(end, 0, removed)
    return copy
  }
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="size-16">
              <AvatarImage src={photoPreview ?? profilePhoto ?? undefined} alt="Colaborador" />
              <AvatarFallback>CL</AvatarFallback>
            </Avatar>
            {editMode && (
              <label className="absolute inset-0 grid place-items-center bg-black/40 rounded-full cursor-pointer group">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const url = URL.createObjectURL(file)
                    setPhotoPreview(url)
                    // Emulação de upload: salva URL local no perfil (mock)
                    await api.patch('/perfil', { id: user!.id, foto_url: url })
                    setProfilePhoto(url)
                    setLastUpdated(new Date())
                    toast.success('Foto de perfil atualizada')
                  }}
                />
                <span className="flex items-center gap-1 text-xs text-white opacity-100 group-hover:opacity-100">
                  <Camera className="size-4" /> Editar
                </span>
              </label>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Seu perfil</h1>
            <p className="text-muted-foreground text-sm">Informações e habilidades do colaborador</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={() => setEditMode((v) => !v)}>
                {editMode ? 'Concluir' : 'Editar perfil'}
              </Button>
            </TooltipTrigger>
          </Tooltip>
        </div>
      </div>

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
              {skills.map((s, idx) => {
                const palette = ['bg-blue-100 text-blue-800 border-blue-200','bg-emerald-100 text-emerald-800 border-emerald-200','bg-amber-100 text-amber-800 border-amber-200','bg-violet-100 text-violet-800 border-violet-200']
                const cls = palette[idx % palette.length]
                return (
                  <span key={s} className={`rounded-md border px-2 py-1 text-xs ${cls}`}>
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
                            // se não existir ainda, enviar id_competencia buscando em allCompetencias
                            const comp = allCompetencias.find(c => c.nome === nome)
                            return comp ? { id_competencia: comp.id_competencia, ordem: idx + 1 } : null
                          }).filter(Boolean) as { id?: number; id_competencia?: number; ordem: number }[]
                          try {
                            await api.patch(`/perfil`, { id: user!.id, competencias: next })
                            // Reflete imediatamente na UI, inclusive quando estava vazio
                            setSkills(nextNames)
                            // Recarrega do servidor mock para obter ids atualizados
                            const { data } = await api.get<Colaborador>(`/perfil?id=${encodeURIComponent(user!.id)}`)
                            const atualizadas = (data.competencias ?? [])
                              .filter((cc) => cc.ordem != null && (cc.ordem as number) > 0)
                              .slice()
                              .sort((a: ColaboradorCompetencia, b: ColaboradorCompetencia) => (a.ordem as number) - (b.ordem as number))
                              .map((cc) => ({ id: cc.id, nome: cc.competencia?.nome ?? '', ordem: (cc.ordem as number) }))
                              .filter((i) => Boolean(i.nome))
                            setSkillItems(atualizadas.slice(0, 4))
                            if (data.updated_at) setLastUpdated(new Date(data.updated_at))
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
                <span className="text-sm font-medium">12</span>
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


