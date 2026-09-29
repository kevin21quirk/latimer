import Link from "next/link";
import { Home, Store, Users, HelpCircle, LogIn } from "lucide-react";

// Mobile-only bottom navigation for community (public) pages.
export default function BottomNav({ community, signedIn }: { community: string; signedIn: boolean }) {
  const items = [
    { href: `/${community}`, label: "Home", icon: Home },
    { href: `/${community}/businesses`, label: "Businesses", icon: Store },
    { href: `/${community}/groups`, label: "Groups", icon: Users },
    signedIn
      ? { href: "/dashboard", label: "My feed", icon: HelpCircle }
      : { href: "/login", label: "Sign in", icon: LogIn },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-300 bg-white md:hidden">
      <div className="grid grid-cols-4">
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href + label}
            href={href}
            className="flex flex-col items-center gap-1 py-2 text-[11px] text-gray-600 hover:text-accent"
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
