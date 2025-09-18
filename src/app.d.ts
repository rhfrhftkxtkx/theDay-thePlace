// src/app.d.ts
import { SupabaseClient, Session } from '@supabase/supabase-js';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient;
			getSession(): Promise<Session | null>;
		}
		interface ImportrMetaEnv {
			readonly PUBLIC_APP_NAME: string;
			readonly PUBLIC_APP_MODE: 'development' | 'production' | 'test';
			readonly PUBLIC_SUPABASE_URL: string;
			readonly PUBLIC_SUPABASE_ANON_KEY: string;
		}
		interface ImportMeta {
			readonly env: ImportMetaEnv;
		}
	}

	interface Window {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		kakao: any;
	}
}

export {};
