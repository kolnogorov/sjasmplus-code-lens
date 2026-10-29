import * as assert from 'assert';
import {associationFor, findCompetingLanguages, findConflictingAssociations, fixAssociations, globExtensions} from '../src/fileassociations';


suite('file associations', () => {

	const sources = ['.asm', '.a80', '.z80', '.inc'];
	const listings = ['.lst', '.list', '.lis'];

	/** What NASM Code Lens 3 writes to the user settings on its first start. */
	const NASM_GLOB = '*.{asm,inc,s,nasm,yasm,-----------------------------------------}';

	test('extension globs', () => {
		assert.deepEqual(globExtensions('*.asm'), ['.asm']);
		assert.deepEqual(globExtensions('**/*.A80'), ['.a80']);
		assert.deepEqual(globExtensions('*.{asm,INC,s}'), ['.asm', '.inc', '.s']);
		assert.deepEqual(globExtensions('**/*.{asm,}'), ['.asm']);
		assert.equal(globExtensions('src/*.asm'), undefined);
		assert.equal(globExtensions('main.asm'), undefined);
		assert.equal(globExtensions('*.{}'), undefined);
		assert.equal(globExtensions('*.{a,{b}}'), undefined);
	});

	test('the longest glob decides, as in VS Code', () => {
		const associations = {'*.asm': 'sjasmplus', [NASM_GLOB]: 'asm-x86-nasm', '**/*.inc': 'sjasmplus', '*.a80': 'other', '**/*.a80': 'sjasmplus'};
		assert.deepEqual(associationFor(associations, '.asm'), {pattern: NASM_GLOB, language: 'asm-x86-nasm'});
		assert.deepEqual(associationFor(associations, '.inc'), {pattern: NASM_GLOB, language: 'asm-x86-nasm'});
		assert.deepEqual(associationFor(associations, '.a80'), {pattern: '**/*.a80', language: 'sjasmplus'});
		assert.equal(associationFor(associations, '.z80'), undefined);
		// Entries that are not strings are ignored by VS Code
		assert.deepEqual(associationFor({'*.asm': 'sjasmplus', [NASM_GLOB]: null as any}, '.asm'), {pattern: '*.asm', language: 'sjasmplus'});
	});

	test('finds associations of our file types with other languages', () => {
		const result = findConflictingAssociations({
			'*.asm': 'asm-collection',
			'**/*.A80': 'asm-collection',
			'*.z80': 'z80-macroasm',
			'*.lst': 'asm-list-file',
			'*.inc': 'sjasmplus',
			'*.css': 'css',
			'src/*.asm': 'asm-collection'
		}, sources, listings, ['z80-macroasm', 'css', 'sjasmplus']);
		assert.deepEqual(result, [
			{pattern: '*.asm', language: 'asm-collection', extension: '.asm', target: 'sjasmplus', fixPattern: '*.asm', missing: true},
			{pattern: '**/*.A80', language: 'asm-collection', extension: '.a80', target: 'sjasmplus', fixPattern: '**/*.A80', missing: true},
			{pattern: '*.z80', language: 'z80-macroasm', extension: '.z80', target: 'sjasmplus', fixPattern: '*.z80', missing: false},
			{pattern: '*.lst', language: 'asm-list-file', extension: '.lst', target: 'sjasmplus-list', fixPattern: '*.lst', missing: true}
		]);
	});

	test('a glob of several extensions wins over ours', () => {
		const result = findConflictingAssociations({'*.asm': 'sjasmplus', '*.inc': 'sjasmplus', [NASM_GLOB]: 'asm-z80-sjasmplus'}, sources, listings, ['sjasmplus', 'asm-z80-sjasmplus']);
		assert.deepEqual(result, [
			{pattern: NASM_GLOB, language: 'asm-z80-sjasmplus', extension: '.asm', target: 'sjasmplus', fixPattern: '*.asm', missing: false},
			{pattern: NASM_GLOB, language: 'asm-z80-sjasmplus', extension: '.inc', target: 'sjasmplus', fixPattern: '*.inc', missing: false}
		]);
	});

	test('nothing to do', () => {
		assert.deepEqual(findConflictingAssociations({'*.asm': 'sjasmplus', '*.lst': 'sjasmplus-list', '*.{s,nasm}': 'asm-x86-nasm'}, sources, listings, []), []);
		assert.deepEqual(findConflictingAssociations({}, sources, listings, []), []);
	});

	const macroasm = {extensionId: 'mborik.z80-macroasm', extensionName: 'Z80 Macro-Assembler', language: 'z80-macroasm', extensions: ['.a80', '.ASM', '.inc', '.s']};
	const imanolea = {extensionId: 'Imanolea.z80-asm', extensionName: 'Z80 Assembly', language: 'z80-asm', extensions: ['.asm', '.s', '.z80', '.$C', '.mac']};
	const lister = {extensionId: 'some.lister', extensionName: 'Lister', language: 'listing', extensions: ['.lst', '.lst']};
	const nasm = {extensionId: 'maziac.asm-code-lens', extensionName: 'NASM Code Lens', language: 'asm-z80-sjasmplus', extensions: []};

	test('finds other extensions for our file types', () => {
		const result = findCompetingLanguages([macroasm, imanolea, lister, nasm], {}, sources, listings);
		assert.deepEqual(result.map(c => [c.extensionId, c.language, c.pattern, c.target]), [
			['mborik.z80-macroasm', 'z80-macroasm', '*.a80', 'sjasmplus'],
			['mborik.z80-macroasm', 'z80-macroasm', '*.asm', 'sjasmplus'],
			['mborik.z80-macroasm', 'z80-macroasm', '*.inc', 'sjasmplus'],
			['Imanolea.z80-asm', 'z80-asm', '*.asm', 'sjasmplus'],
			['Imanolea.z80-asm', 'z80-asm', '*.z80', 'sjasmplus'],
			['some.lister', 'listing', '*.lst', 'sjasmplus-list']
		]);
		assert.equal(result[1].extension, '.asm');
	});

	test('file types decided by files.associations are no competition', () => {
		// "*.inc" chosen by the user for another language: that is reported by findConflictingAssociations
		const result = findCompetingLanguages([macroasm], {'*.asm': 'sjasmplus', '**/*.A80': 'sjasmplus', '*.inc': 'z80-macroasm', 'src/*.s': 'z80-macroasm'}, sources, listings);
		assert.deepEqual(result, []);
		assert.deepEqual(findCompetingLanguages([macroasm], {'*.{a80,asm,inc}': 'z80-macroasm'}, sources, listings), []);
		assert.deepEqual(findCompetingLanguages([], {}, sources, listings), []);
	});

	test('fix: our extensions leave a glob of several extensions', () => {
		const user = {[NASM_GLOB]: 'asm-x86-nasm', '*.css': 'css'};
		const conflicts = findConflictingAssociations(user, sources, listings, ['asm-x86-nasm', 'css']);
		assert.deepEqual(fixAssociations(user, conflicts, [], false), {
			'*.css': 'css',
			'*.{s,nasm,yasm,-----------------------------------------}': 'asm-x86-nasm',
			'*.asm': 'sjasmplus',
			'*.inc': 'sjasmplus'
		});
		// The glob is in the user settings: nothing to change in the workspace settings when fixing everywhere
		assert.equal(fixAssociations({'*.css': 'css'}, conflicts, [], false), undefined);
		// Only ours in it: removed
		const only = {'**/*.{ASM,inc}': 'z80-macroasm'};
		assert.deepEqual(fixAssociations(only, findConflictingAssociations(only, sources, listings, ['z80-macroasm']), [], false), {'*.asm': 'sjasmplus', '*.inc': 'sjasmplus'});
		// One left
		const one = {'*.{asm,s}': 'z80-macroasm'};
		assert.deepEqual(fixAssociations(one, findConflictingAssociations(one, sources, listings, ['z80-macroasm']), [], false), {'*.s': 'z80-macroasm', '*.asm': 'sjasmplus'});
	});

	test('fix: a glob of an uninstalled language or with only filler left is removed', () => {
		// NASM Code Lens is uninstalled
		const user = {'*.asm': 'sjasmplus', [NASM_GLOB]: 'asm-z80-sjasmplus'};
		const conflicts = findConflictingAssociations(user, sources, listings, ['sjasmplus']);
		assert.deepEqual(fixAssociations(user, conflicts, [], false), {'*.asm': 'sjasmplus', '*.inc': 'sjasmplus'});
		// Installed, but its extensions are all ours
		const filler = {'*.{asm,inc,----------}': 'asm-z80-sjasmplus'};
		assert.deepEqual(fixAssociations(filler, findConflictingAssociations(filler, sources, listings, ['asm-z80-sjasmplus']), [], false), {'*.asm': 'sjasmplus', '*.inc': 'sjasmplus'});
	});

	test('fix in the workspace: overrides the same keys of the user settings', () => {
		const merged = {[NASM_GLOB]: 'asm-x86-nasm', '*.z80': 'z80-asm'};
		const conflicts = findConflictingAssociations(merged, sources, listings, []);
		assert.deepEqual(fixAssociations(undefined, conflicts, [], true), {[NASM_GLOB]: 'sjasmplus', '*.z80': 'sjasmplus'});
		assert.deepEqual(fixAssociations({'*.z80': 'z80-asm'}, conflicts, [{...macroasm, extension: '.a80', pattern: '*.a80', target: 'sjasmplus'}], true),
			{'*.z80': 'sjasmplus', [NASM_GLOB]: 'sjasmplus', '*.a80': 'sjasmplus'});
		// Nothing to do
		assert.equal(fixAssociations({'*.asm': 'sjasmplus'}, [], [], true), undefined);
	});
});
