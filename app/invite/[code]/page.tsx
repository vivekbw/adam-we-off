import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';

interface InvitePageProps {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ email?: string }>;
}

export default async function InvitePage({ params, searchParams }: InvitePageProps) {
  const { code: tripId } = await params;
  const { email } = await searchParams;

  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/invite/${tripId}${email ? `&email=${email}` : ''}`);
  }

  const lookupEmail = email ?? user.email;

  if (lookupEmail) {
    const { data: existingBuddy } = await supabase
      .from('buddies')
      .select('id, user_id, status')
      .eq('trip_id', tripId)
      .eq('email', lookupEmail)
      .maybeSingle();

    if (existingBuddy) {
      if (!existingBuddy.user_id || existingBuddy.status === 'invited') {
        await supabase
          .from('buddies')
          .update({
            user_id: user.id,
            status: 'active',
            name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Traveler',
            avatar: (user.user_metadata?.full_name ?? user.email ?? '?')[0].toUpperCase(),
          })
          .eq('id', existingBuddy.id);
      }
    } else {
      await supabase.from('buddies').insert({
        trip_id: tripId,
        user_id: user.id,
        name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Traveler',
        email: user.email,
        avatar: (user.user_metadata?.full_name ?? user.email ?? '?')[0].toUpperCase(),
        color: '#06B6D4',
        role: 'editor',
        status: 'active',
      });
    }
  }

  redirect(`/trip/${tripId}`);
}
