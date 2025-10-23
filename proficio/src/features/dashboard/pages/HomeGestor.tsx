import { useEffect, useMemo, useState } from 'react'
import { api } from '@/shared/lib/api'
import type { Colaborador, Equipe, Setor } from '@/shared/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Users, Layers, ClipboardCheck, ChevronRight } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function HomeGestor() {
  const { user } = useAuth()
  const [setores, setSetores] = useState<Setor[]>([])
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [colabs, setColabs] = useState<Colaborador[]>([])
  const [myTeamId, setMyTeamId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [s, e, c] = await Promise.all([
        api.get<Setor[]>('/setores'),
        api.get<Equipe[]>('/equipes'),
        api.get<Colaborador[]>('/colaboradores'),
      ])
      setSetores(Array.isArray(s.data) ? s.data : [])
      setEquipes(Array.isArray(e.data) ? e.data : [])
      setColabs(Array.isArray(c.data) ? c.data : [])
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!user?.id) return
    api.get(`/perfil?id=${encodeURIComponent(user.id)}`).then((res) => {
      setMyTeamId(res.data?.equipe?.id_equipe ?? null)
    })
  }, [user?.id])

  const myTeam = useMemo(() => equipes.find(e => e.id_equipe === myTeamId) ?? null, [equipes, myTeamId])
  const teamMembers = useMemo(() => colabs.filter(c => c.id_equipe === myTeamId), [colabs, myTeamId])

  const kpis = useMemo(() => {
    const total = teamMembers.length
    const ativos = teamMembers.filter(c => c.status).length
    const turnoverEst = Math.max(0, Math.round(total * 0.05))
    return { total, ativos, turnoverEst }
  }, [teamMembers])

  const recentHires = useMemo(() => {
    return teamMembers
      .slice()
      .sort((a, b) => new Date(b.criado_em ?? 0).getTime() - new Date(a.criado_em ?? 0).getTime())
      .slice(0, 5)
  }, [teamMembers])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardDescription>Minha equipe</CardDescription>
            <Layers className="size-5 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myTeam?.nome_equipe ?? '—'}</div>
            <div className="text-xs text-muted-foreground">{setores.find(s => s.id_setor === (myTeam?.id_setor ?? -1))?.nome_setor ?? '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardDescription>Colaboradores</CardDescription>
            <Users className="size-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? '—' : kpis.total}</div>
            <div className="text-xs text-muted-foreground">{kpis.ativos} ativos</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardDescription>Turnover estimado</CardDescription>
            <ClipboardCheck className="size-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? '—' : kpis.turnoverEst}</div>
            <div className="text-xs text-muted-foreground">próximos 12 meses (estimativa)</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Admissões recentes</CardTitle>
            <CardDescription>Últimos 5 ingressos no time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {recentHires.map(c => (
                <div key={c.id_colaborador} className="flex items-center justify-between py-2 text-sm">
                  <div className="min-w-0 truncate">{c.nome} {c.sobrenome}</div>
                  <div className="text-xs text-muted-foreground">{c.criado_em ? new Date(c.criado_em).toLocaleDateString() : '—'}</div>
                </div>
              ))}
              {recentHires.length === 0 && <div className="text-sm text-muted-foreground">Sem entradas recentes</div>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Atalhos do dia a dia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="gap-2"><Users className="size-4" /> Ver colaboradores</Button>
              <Button variant="outline" className="gap-2"><ChevronRight className="size-4" /> Avaliações pendentes</Button>
              <Button variant="outline" className="gap-2"><ClipboardCheck className="size-4" /> Aprovar solicitações</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



