import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Separator } from '@/shared/components/ui/separator'
import { useEffect, useState } from 'react'
import { api } from '@/shared/lib/api'
import type { Colaborador, ColaboradorCompetencia } from '@/shared/types'

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
  const [data, setData] = useState<Colaborador | null>(null)

  useEffect(() => {
    if (!idColaborador) return
    api.get(`/colaborador?id_colaborador=${idColaborador}`).then((res) => setData(res.data))
  }, [idColaborador])

  if (!idColaborador) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-start md:place-items-center bg-black/50 p-2 md:p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="pb-4">
          <div className="flex items-start gap-4">
            <Avatar className="size-16">
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
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate">{data ? `${data.nome} ${data.sobrenome}` : '—'}</CardTitle>
              <CardDescription className="truncate">{data?.cargo?.nome_cargo ?? '—'}</CardDescription>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="inline-flex items-center rounded-full border px-2 py-0.5">{data?.equipe?.setor?.nome_setor ?? '—'}</span>
              </div>
            </div>
            <button className="rounded-md border px-2 py-1 text-xs" onClick={onClose}>Fechar</button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="text-sm font-medium">{(data as any)?.email ?? '—'}</div>
            </div>
            <Separator />
            <div>
              <div className="text-sm text-muted-foreground">Competências</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(data?.competencias ?? []).map((cc: ColaboradorCompetencia) => (
                  <span key={cc.id} className="rounded-md border px-2 py-1 text-xs">{cc.competencia?.nome}</span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



