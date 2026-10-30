import { Marble } from '@/components/brand';
import { Container } from './Container';
import { HeaderLogo } from './HeaderLogo';
import { NavLink } from './NavLink';

const NAV_ITEMS = [
  { href: '/episodes', label: 'Episodes' },
  { href: '/cases', label: 'Cases' },
  { href: '/writing', label: 'Writing' },
  { href: '/build-log', label: 'Build Log' },
  { href: '/cohorts', label: 'Cohorts' },
  { href: '/products', label: 'Products' },
  { href: '/about', label: 'About' },
] as const;

export function Header() {
  return (
    <Marble
      as="header"
      edge="none"
      className="border-b border-(--edge-color) bg-marble-texture"
    >
      <Container className="flex items-center justify-between py-(--space-4)">
        <HeaderLogo />
        <nav aria-label="Primary">
          <ul className="flex items-center gap-(--space-5)">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href} className="label">
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </Marble>
  );
}
