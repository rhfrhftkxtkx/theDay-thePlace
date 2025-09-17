// src/hooks.server.ts
import { createServerClient } from '@supabase/ssr';
import { env } from '$env/dynamic/private';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// console.log('서버가 사용 중인 Supabase URL:', env.SUPABASE_URL);
    event.locals.supabase = createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
        cookies: {
            get: (key) => event.cookies.get(key),
            set: (key, value, options) => {
                event.cookies.set(key, value, { ...options, path: '/' });
            },
            remove: (key, options) => {
                event.cookies.delete(key, { ...options, path: '/' });
            }
        }
    });

    event.locals.getSession = async () => {
        const {
            data: { session },
        } = await event.locals.supabase.auth.getSession();
        return session;
    };

    const response = await resolve(event, {
        filterSerializedResponseHeaders(name) {
            return name === 'content-range';
        },
    });

    return response;
};