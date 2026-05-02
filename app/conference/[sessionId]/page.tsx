import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ConferenceRoom from '@/components/conference/ConferenceRoom'
import type { Metadata } from 'next'

interface Props {
  params: { sessionId: string }
  searchParams: { role?: string; name?: string }
}

export const metadata: Metadata = {
  title: 'Conference Room',
  robots: 'noindex, nofollow',
}

export default async function ConferenceRoomPage({ params, searchParams }: Props) {
  const supabase = createClient()

  const { data: session } = await supabase
    .from('conference_sessions')
    .select('*')
    .eq('id', params.sessionId)
    .single()

  if (!session) notFound()

  const [{ data: photos }, { data: selections }] = await Promise.all([
    supabase
      .from('session_photos')
      .select('*')
      .eq('session_id', params.sessionId)
      .order('order_index', { ascending: true }),
    supabase
      .from('photo_selections')
      .select('*')
      .eq('session_id', params.sessionId),
  ])

  const role = searchParams.role === 'photographer' ? 'photographer' : 'client'
  const userName =
    searchParams.name ||
    (role === 'photographer' ? 'Photographer' : session.client_name || 'Client')

  return (
    <ConferenceRoom
      session={session}
      photos={photos || []}
      initialSelections={selections || []}
      role={role as 'photographer' | 'client'}
      userName={userName}
    />
  )
}
