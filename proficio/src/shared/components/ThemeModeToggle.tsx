import { Moon, Sun } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useTheme } from '@/app/providers/ThemeProvider';

export default function ThemeModeToggle() {
  const { setTheme, theme } = useTheme();
  return (
    <Button
      variant="outline"
      size="icon"
      className="focus-visible:ring-0 bg-transparent hover:bg-transparent
        border-0 hover:brightness-150 hover:shadow-none hover:border-0 duration-500
        ease-in-out transition-all !rounded-lg"
      onClick={() => {
        setTheme({
          mode: theme.mode === 'light' ? 'dark' : 'light',
        });
      }}
    >
      <Sun
        className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all text-foreground
          dark:-rotate-90 dark:scale-0"
      />
      <Moon
        className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0
          dark:scale-100 text-foreground"
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}


