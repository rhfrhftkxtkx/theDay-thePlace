import { createClient } from '@supabase/supabase-js'
import { env } from '$env/dynamic/public'

export const supabase = createClient(
    env.PUBLIC_VITE_SUPABASE_URL,
    env.PUBLIC_VITE_SUPABASE_ANON_KEY
)