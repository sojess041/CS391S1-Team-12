"use client";
import { FaCircleUser } from "react-icons/fa6";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/lib/theme-provider";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [loading, setLoading] = useState(true);
  const accountPaths = ["/login", "/signup", "/profile"];

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userData } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();
          
          setIsOrganizer(userData?.role === "organizer");
        }
      } catch (error) {
        console.error("Error checking user role:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, []);

  const links = [
    { href: "/", label: "Explore" },
    { href: "/events", label: "Events" },
    { href: "/map", label: "Map" },
    ...(isOrganizer ? [{ href: "/post", label: "Post" }] : []),
    { href: "/about", label: "About" },
    { href: "/login", label: <FaCircleUser /> },
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-300/50 dark:border-slate-700/50 shadow-sm"
    >
      <nav className="flex justify-between items-center p-5 mt-2 mx-10 uppercase">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link href="/" className="text-4xl font-bold">
            <span className="text-red-600 dark:text-red-500 mr-2 tracking-tighter">Spark!</span>
            <span className="dark:text-slate-100">Bytes</span>
          </Link>
        </motion.div>
        <ul className="flex text-xl items-center gap-20 font-medium tracking-tight lowercase">
          {links.map((link, index) => {
            const active =
              pathname === link.href ||
              (link.href === "/login" && accountPaths.includes(pathname));
            return (
              <motion.li
                key={link.href}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href={link.href}
                    className={`relative transition-colors duration-200 ${
                      active
                        ? "text-red-600 dark:text-red-500"
                        : "text-black dark:text-slate-300 hover:text-red-600 dark:hover:text-red-500"
                    }`}
                  >
                    {link.label}
                    {active && (
                      <motion.div
                        className="absolute -bottom-1 left-0 right-0 h-0.5"
                        style={{ backgroundColor: theme === "dark" ? "#ef4444" : "#dc2626" }}
                        layoutId="activeTab"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                </motion.div>
              </motion.li>
            );
          })}
        </ul>
      </nav>
    </motion.header>
  );
}
