import { writable } from 'svelte/store';
import khsCategoryData from '$data/khsCategories.json';
import visitKorAreaData from '$data/visitKorAreaCode2.json';
import type { Category, SearchedCcbaItem, SearchedMuseumItem } from '$lib/searchTypes';

export const ccbaList: Category[] = khsCategoryData;
export const visitKorAreaCode2: Category[] = visitKorAreaData;

export const searchFilter = writable<Category[]>([]);
export const searchKeyword = writable<string>('');
export const searchedCcbaItems = writable<SearchedCcbaItem[]>([]);
export const searchedMuseumItems = writable<SearchedMuseumItem[]>([]);
