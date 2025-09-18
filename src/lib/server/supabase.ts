// src/lib/server/supabase.ts
import { createClient } from '@supabase/supabase-js';

// 디버깅을 위해 env 변수를 직접 출력해봅니다.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
	throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
}

export const supabaseServerClient = createClient(supabaseUrl, supabaseKey);
