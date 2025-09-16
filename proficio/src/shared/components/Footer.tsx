export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="w-full border-t bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
      <div className="w-full px-6 py-4 text-sm text-muted-foreground text-center">
        © {year} Proficio. Todos os direitos reservados.
      </div>
    </footer>
  )
}


