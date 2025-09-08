import { writable } from 'svelte/store';
import type { Category, SearchedCcbaItem, SearchedMuseumItem } from '$/types/search.types';

// export const ccbaList: Category[] = await fetch('/api/khs/categories').then((res) => res.json());
// export const visitKorAreaCode2: Category[] = await fetch('/api/visitKor/areaCode').then((res) =>
// 	res.json()
// );

export const ccbaList = writable<Category[]>([]);
export const visitKorAreaCode2 = writable<Category[]>([]);

export const searchFilter = writable<Category[]>([]);
export const searchKeyword = writable<string>('');
export const searchedCcbaItems = writable<SearchedCcbaItem[]>([]);
export const searchedMuseumItems = writable<SearchedMuseumItem[]>([]);
