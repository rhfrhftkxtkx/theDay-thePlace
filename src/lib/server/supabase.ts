// src/lib/server/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';

// 디버깅을 위해 env 변수를 직접 출력해봅니다.

const supabaseUrl = env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
}

export const supabaseServerClient = createClient(supabaseUrl, supabaseKey);