import { expect, test } from 'vitest';
import { modules } from './modules';
test('all eight modules have distinct IDs and valid quiz answers',()=>{expect(modules).toHaveLength(8);expect(new Set(modules.map(m=>m.id)).size).toBe(8);for(const m of modules){expect(m.answers[m.correct]).toBeTruthy();expect(m.concept.length).toBeGreaterThan(100);}});
