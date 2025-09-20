import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Separator } from '@/shared/components/ui/separator'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/shared/components/ui/tooltip'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerTrigger, DrawerFooter, DrawerClose } from '@/shared/components/ui/drawer'
import { useEffect, useState } from 'react'
import { SquarePen, GripVertical } from 'lucide-react'

export function PerfilColaborador() {
  const [editMode, setEditMode] = useState(false)
  const [skills, setSkills] = useState<string[]>(["React", "TypeScript", "Comunicação", "Liderança"]) 
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [draftSkills, setDraftSkills] = useState<string[]>(skills)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  useEffect(() => {
    if (drawerOpen) setDraftSkills(skills)
  }, [drawerOpen, skills])

  function reorder(list: string[], start: number, end: number) {
    const copy = [...list]
    const [removed] = copy.splice(start, 1)
    copy.splice(end, 0, removed)
    return copy
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarImage src={"https://github.com/shadcn.png"} alt="Colaborador" />
            <AvatarFallback>CL</AvatarFallback>
          </Avatar>
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
            <TooltipContent>Ativa o modo de destaque de skills</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Habilidades</CardTitle>
            <CardDescription>Gerencie suas skills técnicas e comportamentais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 items-center">
              {skills.map((s) => (
                <span key={s} className="rounded-md border px-2 py-1 text-xs">
                  {s}
                </span>
              ))}
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
                      <DrawerTitle>Organizar skills em destaque</DrawerTitle>
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
                        </div>
                      ))}
                    </div>
                    <DrawerFooter>
                      <DrawerClose asChild>
                        <Button variant="outline" onClick={() => setDraftSkills(skills)}>Cancelar</Button>
                      </DrawerClose>
                      <Button
                        onClick={() => {
                          setSkills(draftSkills)
                          setDrawerOpen(false)
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
                <span className="text-sm text-muted-foreground">Skills cadastradas</span>
                <span className="text-sm font-medium">12</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Última atualização</span>
                <span className="text-sm font-medium">há 2 dias</span>
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
              <div className="text-sm font-medium">Colaborador Exemplo</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Cargo</div>
              <div className="text-sm font-medium">Desenvolvedor</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Email</div>
              <div className="text-sm font-medium">m@example.com</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Local</div>
              <div className="text-sm font-medium">Remoto</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


