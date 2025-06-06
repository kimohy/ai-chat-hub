"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { MessageSquare, Users, Settings, ChevronLeft } from "lucide-react"
import { useUIStore } from "@/store/ui-store"

const navigationItems = [
  {
    title: "Chats",
    href: "/chats",
    icon: MessageSquare,
  },
  {
    title: "Team",
    href: "/team",
    icon: Users,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isSidebarCollapsed, toggleSidebar } = useUIStore()

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4 md:block">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 md:block"
          onClick={toggleSidebar}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              isSidebarCollapsed && "rotate-180"
            )}
          />
        </Button>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent hover:text-accent-foreground",
              "justify-center md:justify-start",
              !isSidebarCollapsed && "md:justify-start"
            )}
            title={item.title}
          >
            <item.icon className="h-4 w-4" />
            {!isSidebarCollapsed && <span className="hidden md:inline">{item.title}</span>}
          </Link>
        ))}
      </nav>
    </div>
  )
} 