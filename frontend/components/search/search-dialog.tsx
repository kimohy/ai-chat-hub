"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useHotkeys } from "react-hotkeys-hook"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { MessageSquare, Settings, Users } from "lucide-react"

const searchItems = [
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

export function SearchDialog() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  useHotkeys("mod+k", (e) => {
    e.preventDefault()
    setOpen(true)
  })

  const filteredItems = searchItems.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogTitle className="sr-only">Search</DialogTitle>
        <div className="flex flex-col gap-4">
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9"
          />
          <div className="flex flex-col gap-2">
            {filteredItems.map((item) => (
              <button
                key={item.href}
                className="flex items-center gap-2 rounded-md p-2 hover:bg-muted"
                onClick={() => {
                  router.push(item.href)
                  setOpen(false)
                }}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 