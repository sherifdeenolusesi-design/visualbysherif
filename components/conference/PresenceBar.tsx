import type { PresenceUser } from '@/types/conference'

interface Props {
  presence: PresenceUser[]
}

export default function PresenceBar({ presence }: Props) {
  const photographer = presence.find((u) => u.role === 'photographer')
  const client = presence.find((u) => u.role === 'client')

  return (
    <div className="hidden sm:flex items-center gap-3">
      <PresenceAvatar user={photographer} fallback="Photographer" />
      <div className="w-px h-3 bg-zinc-800" />
      <PresenceAvatar user={client} fallback="Client" />
    </div>
  )
}

function PresenceAvatar({
  user,
  fallback,
}: {
  user: PresenceUser | undefined
  fallback: string
}) {
  const online = !!user
  const initial = user ? user.name.charAt(0).toUpperCase() : fallback.charAt(0)
  const name = user ? user.name : fallback

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium transition-colors ${
            online ? 'bg-zinc-700 text-white' : 'bg-zinc-900 text-zinc-700'
          }`}
        >
          {initial}
        </div>
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-zinc-950 transition-colors ${
            online ? 'bg-green-400' : 'bg-zinc-700'
          }`}
        />
      </div>
      <span className={`text-xs transition-colors ${online ? 'text-zinc-400' : 'text-zinc-700'}`}>
        {name}
      </span>
    </div>
  )
}
