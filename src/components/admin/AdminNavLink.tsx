import { NavLink } from '@/components/NavLink';

interface Props {
  to: string;
  children: React.ReactNode;
  className?: string;
}

export function AdminNavLink({ to, children, className = '' }: Props) {
  return (
    <NavLink
      to={to}
      className={`px-4 py-2 rounded-lg hover:bg-muted transition-colors ${className}`}
      activeClassName="bg-primary text-primary-foreground"
    >
      {children}
    </NavLink>
  );
}
