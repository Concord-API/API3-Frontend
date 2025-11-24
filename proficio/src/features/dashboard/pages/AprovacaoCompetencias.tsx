import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { api } from '@/shared/lib/api'
import type { Competencia } from '@/shared/types'
import { Check, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/shared/components/ui/skeleton'

export function AprovacaoCompetencias() {
    const [competencias, setCompetencias] = useState<Competencia[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<number | null>(null)
    const [query, setQuery] = useState('')

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

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return competencias
        return competencias.filter(c => c.nome.toLowerCase().includes(q))
    }, [competencias, query])

    const stats = useMemo(() => {
        const total = competencias.length
        const hard = competencias.filter(c => c.tipo === 0).length
        const soft = competencias.filter(c => c.tipo === 1).length
        return { total, hard, soft }
    }, [competencias])

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[0, 1, 2].map((i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-36" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-20" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-full max-w-sm">
                        <Skeleton className="h-9 w-full" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-6 w-24" />
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Total</CardTitle>
                        <CardDescription>Competências pendentes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-semibold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Hard Skills</CardTitle>
                        <CardDescription>Competências técnicas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-semibold">{stats.hard}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Soft Skills</CardTitle>
                        <CardDescription>Competências comportamentais</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-semibold">{stats.soft}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center gap-2">
                <div className="w-full max-w-sm">
                    <Input
                        placeholder="Buscar competência..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-xs text-muted-foreground">
                            <th className="py-2 pr-4">Competência</th>
                            <th className="py-2 pr-4">Tipo</th>
                            <th className="py-2 pr-2 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={3} className="py-8 text-center">
                                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                        <Check className="size-12 text-muted-foreground/20" />
                                        <p className="text-sm">Nenhuma competência pendente de aprovação.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                        {filtered.map(comp => {
                            const typeBadge = comp.tipo === 0
                                ? 'bg-blue-600 text-white border-blue-700 font-semibold'
                                : 'bg-emerald-600 text-white border-emerald-700 font-semibold'
                            return (
                                <tr key={comp.id_competencia} className="border-t hover:bg-muted/60 transition-colors">
                                    <td className="py-3 pr-4">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-yellow-100 dark:bg-yellow-900/20 p-1.5 rounded-full">
                                                <AlertTriangle className="size-4 text-yellow-600 dark:text-yellow-500" />
                                            </div>
                                            <span className="font-medium">{comp.nome}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 pr-4">
                                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${typeBadge}`}>
                                            {comp.tipo === 0 ? 'Hard' : 'Soft'}
                                        </span>
                                    </td>
                                    <td className="py-3 pr-2 text-right">
                                        <Button
                                            onClick={() => handleApprove(comp.id_competencia)}
                                            disabled={processing === comp.id_competencia}
                                            size="sm"
                                            className="gap-2"
                                        >
                                            <Check className="size-4" />
                                            Aprovar
                                        </Button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
