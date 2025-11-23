import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { api } from '@/shared/lib/api'
import type { Competencia } from '@/shared/types'
import { Check, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/shared/components/ui/skeleton'

export function AprovacaoCompetencias() {
    const [competencias, setCompetencias] = useState<Competencia[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<number | null>(null)

    async function loadData() {
        setLoading(true)
        try {
            const res = await api.get('/competencias')
            const allList = res.data as any[]
            const normalized = allList.map(c => ({
                ...c,
                id_competencia: c.id ?? c.id_competencia,
            })) as Competencia[]

            // Filtrar apenas as não aprovadas
            const pending = normalized.filter(c => c.aprovada === false)
            setCompetencias(pending)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    async function handleApprove(id: number) {
        setProcessing(id)
        try {
            await api.patch(`/competencias/${id}/aprovar`)
            toast.success('Competência aprovada com sucesso')
            // Remove da lista localmente
            setCompetencias(prev => prev.filter(c => c.id_competencia !== id))
        } catch (error) {
            toast.error('Erro ao aprovar competência')
        } finally {
            setProcessing(null)
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {[1, 2, 3].map(i => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Aprovação de Competências</CardTitle>
                    <CardDescription>Competências cadastradas aguardando validação da diretoria</CardDescription>
                </CardHeader>
                <CardContent>
                    {competencias.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Check className="mx-auto size-12 text-muted-foreground/20 mb-3" />
                            <p>Nenhuma competência pendente de aprovação.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {competencias.map(comp => (
                                <div key={comp.id_competencia} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded-full">
                                            <AlertTriangle className="size-5 text-yellow-600 dark:text-yellow-500" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">{comp.nome}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Tipo: {comp.tipo === 0 ? 'Hard Skill' : 'Soft Skill'}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => handleApprove(comp.id_competencia)}
                                        disabled={processing === comp.id_competencia}
                                        size="sm"
                                        className="gap-2"
                                    >
                                        <Check className="size-4" />
                                        Aprovar
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
