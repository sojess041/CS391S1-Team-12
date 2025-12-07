"use client";
import { FaCircleUser } from "react-icons/fa6";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const accountPaths = ["/login", "/signup", "/profile"];
  const links = [
    { href: "/", label: "Explore" },
    { href: "/events", label: "Events" },
    { href: "/post", label: "Post" },
    { href: "/about", label: "About" },
    { href: "/profile", label: "Profile" },  // profile page 
    { href: "/login", label: <FaCircleUser /> },
  ];

  return (
    <header>
      <nav className="flex justify-between items-center p-5 mt-2 mx-10 border-b-1 border-gray-300/50 uppercase">
        <Link href="/" className="text-4xl font-bold">
          <span className="text-red-600 mr-2 tracking-tighter">Spark!</span>Bytes
        </Link>
        <ul className="flex text-xl items-center gap-20 font-medium tracking-tight lowercase">
          {links.map((link) => {
            const active =
              pathname === link.href ||
              (link.href === "/login" && accountPaths.includes(pathname));
            return (
              <li key={link.href}>
                <Link href={link.href} className={active ? "text-red-600 " : "text-black"}>
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
