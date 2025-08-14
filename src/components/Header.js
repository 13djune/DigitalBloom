import ThemeToggle from './ThemeToggle';

export default function Header() {
  return (
    <header className="w-full flex justify-between items-center px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-background text-text">
      {/* 1. Logo */}
      <div className="text-xl font-bold tracking-tight">
        <a href="#home">EvolvingSelf</a>
      </div>

      {/* 2. Nav links */}
      <nav className="hidden sm:flex gap-6 text-sm font-medium">
        <a href="#about" className="hover:text-primary transition-colors">About</a>
        <a href="#projects" className="hover:text-primary transition-colors">Projects</a>
        <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
      </nav>

      {/* 3. Toggle */}
      <div>
        <ThemeToggle />
      </div>
    </header>
  );
}
