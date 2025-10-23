import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Separator } from '@/shared/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { useEffect, useMemo, useState } from 'react'
import { api } from '@/shared/lib/api'
import type { Colaborador } from '@/shared/types'

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

type Props = {
  idColaborador: number | null
  onClose: () => void
}

export function CollaboratorProfileModal({ idColaborador, onClose }: Props) {
  const [currentId, setCurrentId] = useState<number | null>(idColaborador)
  const [data, setData] = useState<Colaborador | null>(null)
  const [team, setTeam] = useState<Colaborador[]>([])

  useEffect(() => {
    setCurrentId(idColaborador)
  }, [idColaborador])

  useEffect(() => {
    if (!currentId) return
    api.get(`/colaborador?id_colaborador=${currentId}`).then((res) => setData(res.data))
  }, [currentId])

  useEffect(() => {
    if (!idColaborador) return
    api.get<Colaborador[]>('/colaboradores').then((res) => setTeam(res.data))
  }, [idColaborador])

  const highlightedSkills = useMemo(() => {
    const list = (data?.competencias ?? []).filter((cc) => (cc.ordem ?? 0) > 0)
    return list.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)).slice(0, 4)
  }, [data?.competencias])

  const allSkills = useMemo(() => {
    return (data?.competencias ?? []).slice().sort((a, b) => {
      const aOrder = a.ordem ?? 0
      const bOrder = b.ordem ?? 0
      if (aOrder && bOrder) return aOrder - bOrder
      if (aOrder) return -1
      if (bOrder) return 1
      return (b.proeficiencia ?? 0) - (a.proeficiencia ?? 0)
    })
  }, [data?.competencias])

  const teamMembers = useMemo(() => {
    if (!data) return [] as Colaborador[]
    const teamId = data.equipe?.id_equipe ?? (data as any).id_equipe
    return team.filter((c) => (c.equipe?.id_equipe ?? (c as any).id_equipe) === teamId)
  }, [team, data])

  const teamManager = useMemo(() => {
    return teamMembers.find((c) => String((c as any).role) === 'Gestor') ?? null
  }, [teamMembers])

  const currentSetorId = useMemo(() => {
    return data?.equipe?.setor?.id_setor ?? (data as any)?.id_setor ?? null
  }, [data])

  const teamDirector = useMemo(() => {
    if (!currentSetorId) return null
    return (
      team.find(
        (c) => String((c as any).role) === 'Diretor' && ((c.cargo?.id_setor ?? (c as any).id_setor) === currentSetorId)
      ) ?? null
    )
  }, [team, currentSetorId])

  function formatTenure(iso?: string | null) {
    if (!iso) return '—'
    const start = new Date(iso)
    if (Number.isNaN(start.getTime())) return '—'
    const now = new Date()
    let years = now.getFullYear() - start.getFullYear()
    let months = now.getMonth() - start.getMonth()
    if (months < 0) {
      years -= 1
      months += 12
    }
    if (years <= 0) return `${months} mês${months === 1 ? '' : 'es'}`
    if (months === 0) return `${years} ano${years === 1 ? '' : 's'}`
    return `${years} ano${years === 1 ? '' : 's'} e ${months} mês${months === 1 ? '' : 'es'}`
  }

  function formatDate(iso?: string | null) {
    if (!iso) return '—'
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString()
  }

  if (!idColaborador) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-start md:place-items-center bg-black/50 p-2 md:p-4" onClick={onClose}>
      <Card className="w-full max-w-3xl h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <ScrollArea className="h-full">
          <div className="relative">
            <div className="h-36 sm:h-44 w-full overflow-hidden bg-gradient-to-r from-muted to-muted/60">
              {data?.capa && (
                <img src={data.capa} alt="Capa" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="absolute left-4 -bottom-8">
              <Avatar className="size-20 ring-2 ring-background">
                <AvatarImage src={data?.avatar ?? undefined} alt="Colaborador" />
                <AvatarFallback className="text-[0px]">
                  {inferGenderFromName(data?.nome) === 'Female' ? (
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
            </div>
          </div>

          <CardHeader className="pt-12 pb-3">
            <CardTitle className="text-lg truncate">{data ? `${data.nome} ${data.sobrenome}` : '—'}</CardTitle>
            <CardDescription className="truncate">{data?.cargo?.nome_cargo ?? '—'}</CardDescription>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center rounded-full border px-2 py-0.5">{data?.equipe?.setor?.nome_setor ?? '—'}</span>
              <span className="inline-flex items-center rounded-full border px-2 py-0.5">{data?.equipe?.nome_equipe ?? '—'}</span>
              {(data as any)?.email && <span className="inline-flex items-center rounded-full border px-2 py-0.5">{(data as any).email}</span>}
            </div>
          </CardHeader>

          <CardHeader className="pb-3">
            <CardTitle className="text-base">Competências em destaque</CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            {highlightedSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {highlightedSkills.map((cc) => {
                  const level = cc.proeficiencia ?? 0
                  const cls = level === 1
                    ? 'bg-emerald-200 text-emerald-900 border-emerald-300'
                    : level === 2
                      ? 'bg-emerald-600 text-emerald-50 border-emerald-700'
                      : level === 3
                        ? 'bg-orange-200 text-orange-900 border-orange-300'
                        : level === 4
                          ? 'bg-red-200 text-red-900 border-red-300'
                          : 'bg-purple-200 text-purple-900 border-purple-300'
                  return (
                    <span key={cc.id} className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
                      {cc.competencia?.nome}
                    </span>
                  )
                })}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Nenhuma competência em destaque</div>
            )}
          </CardContent>

          <Separator />

          <CardContent className="pt-4 pb-6">
            <Tabs defaultValue="skills">
              <TabsList>
                <TabsTrigger value="skills">Competências</TabsTrigger>
                <TabsTrigger value="org">Organograma</TabsTrigger>
              </TabsList>
              <TabsContent value="skills" className="mt-3">
                <div className="rounded-md border overflow-hidden">
                  <div className="grid grid-cols-[1fr_auto] gap-x-2 bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
                    <div>Competência</div>
                    <div className="justify-self-end">Proficiência</div>
                  </div>
                  <div>
                    {allSkills.length > 0 ? (
                      allSkills.map((cc) => (
                        <div key={cc.id} className="grid grid-cols-[1fr_auto] gap-x-2 px-3 py-2 border-t">
                          <div className="text-sm">{cc.competencia?.nome}</div>
                          <div className="text-sm justify-self-end">{cc.proeficiencia}/5</div>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-sm text-muted-foreground">Nenhuma competência cadastrada</div>
                    )}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="org" className="mt-3">
                <div className="space-y-4">
                  {/* Diretor no topo */}
                  <div className="flex flex-col items-center">
                    <div className="text-xs text-muted-foreground mb-1">Diretor</div>
                    <div className="flex items-center gap-2 rounded-lg border p-2 cursor-pointer hover:bg-accent/40 transition-colors" onClick={() => { if (teamDirector) setCurrentId(teamDirector.id_colaborador) }} role="button" tabIndex={0}>
                      <Avatar className="size-10">
                        <AvatarImage src={(teamDirector as any)?.avatar ?? undefined} alt="Diretor" />
                        <AvatarFallback className="text-[0px]">
                          {inferGenderFromName(teamDirector?.nome) === 'Female' ? (
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
                        <div className="text-sm font-medium truncate">{teamDirector ? `${teamDirector.nome} ${teamDirector.sobrenome}` : '—'}</div>
                        <div className="text-xs text-muted-foreground truncate">{teamDirector?.cargo?.nome_cargo ?? '—'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Conector */}
                  {(teamDirector || teamManager) && <div className="mx-auto h-6 w-px bg-border" />}

                  {/* Gestor logo abaixo do diretor */}
                  <div className="flex flex-col items-center">
                    <div className="text-xs text-muted-foreground mb-1">Gestor</div>
                    <div className="flex items-center gap-2 rounded-lg border p-2 cursor-pointer hover:bg-accent/40 transition-colors" onClick={() => { if (teamManager) setCurrentId(teamManager.id_colaborador) }} role="button" tabIndex={0}>
                      <Avatar className="size-10">
                        <AvatarImage src={(teamManager as any)?.avatar ?? undefined} alt="Gestor" />
                        <AvatarFallback className="text-[0px]">
                          {inferGenderFromName(teamManager?.nome) === 'Female' ? (
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
                        <div className="text-sm font-medium truncate">{teamManager ? `${teamManager.nome} ${teamManager.sobrenome}` : '—'}</div>
                        <div className="text-xs text-muted-foreground truncate">{teamManager?.cargo?.nome_cargo ?? '—'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Conector */}
                  <div className="mx-auto h-6 w-px bg-border" />

                  {/* Time: centralizado mesmo quando ímpar */}
                  <div className="flex flex-wrap justify-center gap-3">
                    {teamMembers
                      .filter((m) => String((m as any).role) === 'Colaborador')
                      .map((m) => (
                        <button key={m.id_colaborador} className="rounded-lg border p-2 text-left hover:bg-accent/40 transition-colors cursor-pointer" onClick={() => setCurrentId(m.id_colaborador)}>
                          <div className="flex items-center gap-2">
                            <Avatar className="size-8">
                              <AvatarImage src={(m as any).avatar ?? undefined} alt="" />
                              <AvatarFallback className="text-[0px]">
                                {inferGenderFromName(m.nome) === 'Female' ? (
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
                              <div className="text-sm font-medium truncate">{m.nome} {m.sobrenome}</div>
                              <div className="text-[11px] text-muted-foreground truncate">{m.cargo?.nome_cargo ?? '—'}</div>
                            </div>
                          </div>
                        </button>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>

          <Separator />

          <CardHeader className="py-4">
            <CardTitle className="text-base">Informações</CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Data de nascimento</div>
                <div className="text-sm font-medium">{formatDate((data as any)?.data_nasci)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Tempo de vínculo</div>
                <div className="text-sm font-medium">{formatTenure(data?.criado_em)}</div>
              </div>
            </div>
          </CardContent>
        </ScrollArea>
      </Card>
    </div>
  )
}



