import { useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { routeIntent } from '../lib/intentRouting';

export function useScreenPop({ onIncoming }) {
  useEffect(() => {
    const channel = supabase
      .channel('icemortgage-screen-pops')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'icemortgage_screen_pops' },
        (payload) => {
          const row = payload.new;
          if (!row || row.consumed) return;

          let target_module = row.target_module;
          let target_view   = row.target_view;
          if (!target_module || !target_view) {
            const routed = routeIntent(row.intent);
            target_module = target_module || routed.module;
            target_view   = target_view   || routed.view;
          }
          onIncoming({ ...row, target_module, target_view });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [onIncoming]);
}

export async function markScreenPopConsumed(id) {
  if (!id) return;
  await supabase
    .from('icemortgage_screen_pops')
    .update({ consumed: true, consumed_at: new Date().toISOString() })
    .eq('id', id);
}
