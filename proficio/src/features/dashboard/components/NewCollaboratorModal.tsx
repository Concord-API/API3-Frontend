import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { DatePicker } from '@/shared/components/ui/date-picker'
import { AvatarEditorModal } from '@/features/dashboard/components/AvatarEditorModal'
import { Camera } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/shared/lib/api'
import type { Cargo, Colaborador, Equipe, Setor } from '@/shared/types'


type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  setores: Setor[]
  equipes: Equipe[]
  cargos: Cargo[]
  onCreated: (c: Colaborador) => void
}

export function NewCollaboratorModal({
  open,
  onOpenChange,
  setores,
  equipes,
  cargos,
  onCreated,
}: Props) {
  const [novoNome, setNovoNome] = useState('')
  const [novoSobrenome, setNovoSobrenome] = useState('')
  const [novoEmail, setNovoEmail] = useState('')
  const [novoEquipe, setNovoEquipe] = useState<number | 'none'>('none')
  const [novoCargo, setNovoCargo] = useState<number | ''>('')
  const [novoSetorFiltro, setNovoSetorFiltro] = useState<number | ''>('')
  const [novoSenha, setNovoSenha] = useState('')
  const [novoGenero, setNovoGenero] = useState<'MASCULINO' | 'FEMININO' | ''>('')
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

  useEffect(() => {
    if (open) {
      setNovoSenha(generateRandomPassword())
    } else {
      // reset ao fechar
      setNovoNome('')
      setNovoSobrenome('')
      setNovoEmail('')
      setNovoEquipe('none')
      setNovoCargo('')
      setNovoSetorFiltro('')
      setNovoGenero('')
      setNovoNascimento(undefined)
      setNewAvatarBase64(null)
      setNewAvatarSrc(null)
    }
  }, [open])

  useEffect(() => {
    setNovoEquipe('none')
  }, [novoSetorFiltro])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Novo colaborador</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[80vh]">
            <div className="space-y-6 py-4 px-6">
              <div className="flex items-start gap-6 pb-6 border-b">
                <div className="relative flex-shrink-0">
                  <Avatar className="size-24 ring-2 ring-border shadow-md">
                    <AvatarImage src={newAvatarBase64 ?? undefined} alt="Prévia" />
                    <AvatarFallback className="bg-muted">
                      <span className="text-base font-semibold">
                        {(novoNome?.[0] ?? (novoEmail?.[0] ?? 'U')).toUpperCase()}
                      </span>
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => { setNewAvatarOpen(true); setNewAvatarSrc(null) }}
                    className="absolute -bottom-1 -right-1 grid place-items-center size-10 rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background hover:scale-105 transition-transform"
                    aria-label="Selecionar foto de perfil"
                  >
                    <Camera className="size-4" />
                  </button>
                  <input
                    ref={newAvatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (!f) return
                      const url = URL.createObjectURL(f)
                      setNewAvatarSrc(url)
                      setNewAvatarOpen(true)
                    }}
                  />
                </div>
                <div className="flex-1 space-y-1 pt-2">
                  <h3 className="font-semibold text-base">Foto de perfil</h3>
                  <p className="text-sm text-muted-foreground">
                    Adicione uma foto para facilitar a identificação (opcional).
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Informações Pessoais
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nome-colab">Nome <span className="text-destructive">*</span></Label>
                    <Input id="nome-colab" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Digite o nome" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sobrenome-colab">Sobrenome</Label>
                    <Input id="sobrenome-colab" value={novoSobrenome} onChange={(e) => setNovoSobrenome(e.target.value)} placeholder="Digite o sobrenome" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email-colab">Email <span className="text-destructive">*</span></Label>
                    <Input id="email-colab" type="email" value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} placeholder="exemplo@email.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Data de nascimento</Label>
                    <DatePicker value={novoNascimento} onChange={setNovoNascimento} />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Gênero</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={novoGenero}
                      onChange={(e) => setNovoGenero(e.target.value as any)}
                    >
                      <option value="">Selecione</option>
                      <option value="MASCULINO">Masculino</option>
                      <option value="MASCULINO">Feminino</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Credenciais de Acesso
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="senha-colab">Senha <span className="text-destructive">*</span></Label>
                    <Input id="senha-colab" type="text" value={novoSenha} readOnly className="bg-muted/50" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Informações Organizacionais
                </h3>
                <div className="space-y-2">
                  <Label>Setor (filtro)</Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={novoSetorFiltro === '' ? '' : String(novoSetorFiltro)}
                    onChange={(e) => setNovoSetorFiltro(e.target.value ? Number(e.target.value) : '')}
                  >
                    <option value="">Todos</option>
                    {setores.map(s => (
                      <option key={s.id_setor} value={s.id_setor}>{s.nome_setor}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Equipe <span className="text-destructive">*</span></Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={novoEquipe === 'none' ? '' : String(novoEquipe)}
                    onChange={(e) => setNovoEquipe(e.target.value ? Number(e.target.value) : 'none')}
                  >
                    <option value="">Selecione uma equipe</option>
                    {(novoSetorFiltro === '' ? equipes : equipes.filter(eq => eq.id_setor === novoSetorFiltro)).map(eq => (
                      <option key={eq.id_equipe} value={eq.id_equipe}>{eq.nome_equipe}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Cargo <span className="text-destructive">*</span></Label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          </ScrollArea>
          <DialogFooter>
            <Button
              disabled={saving || novoNome.trim().length === 0 || !novoEmail.trim() || novoEquipe === 'none' || !novoSenha.trim() || novoCargo === ''}
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
                    senha: novoSenha as any,
                    genero: (novoGenero || undefined) as any,
                    dataNascimento: novoNascimento ? (formatDate(novoNascimento)) : undefined,
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
                  onCreated(created)
                  toast.success('Colaborador criado')
                  onOpenChange(false)
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
    </>
  )
}

function formatDate(d?: Date) {
  if (!d) return undefined
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}


