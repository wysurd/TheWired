import { afterEach, expect, test, vi } from 'vitest';
import { readProgress, saveProgress } from './storage';
afterEach(()=>vi.unstubAllGlobals());
test('recovers from malformed storage without losing app access',()=>{vi.stubGlobal('localStorage',{getItem:()=>'{'});expect(readProgress()).toEqual({completed:[],scores:{},bookmarks:[]});});
test('rejects invalid quiz results and field types',()=>{vi.stubGlobal('localStorage',{getItem:()=>JSON.stringify({completed:[2,'cnn'],scores:{cnn:1,tree:'bad',forest:0},bookmarks:'bad'})});expect(readProgress()).toEqual({completed:['cnn'],scores:{cnn:1,forest:0},bookmarks:[]});});
test('reports unavailable storage',()=>{vi.stubGlobal('localStorage',{setItem:()=>{throw new Error('denied')}});expect(saveProgress({completed:[],scores:{},bookmarks:[]})).toBe(false);});
