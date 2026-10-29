/**
 * Finds what sends the file types of this extension to another language,
 * so the files never reach this extension:
 * - "files.associations" entries (e.g. "*.asm": "asm-collection" of ASM Code Lens 2,
 *   "*.{asm,inc,s,nasm,yasm,-----}": "asm-x86-nasm" of NASM Code Lens 3),
 * - other extensions that contribute a language for the same file types
 *   (e.g. DeZog, Z80 Macro-Assembler): of two extensions VS Code takes the
 *   one registered last, which depends on the extension ids.
 */


export interface ConflictingAssociation {
	/** The glob that decides the file type, e.g. "*.asm" or "*.{asm,inc,s}". */
	pattern: string;
	/** The language it is associated with now. */
	language: string;
	/** Our file extension it takes, lower case, e.g. ".asm". */
	extension: string;
	/** The language it should be associated with: "sjasmplus" or "sjasmplus-list". */
	target: string;
	/** The glob a fix associates with the target: the pattern itself, or e.g. "*.asm" for a glob of several extensions. */
	fixPattern: string;
	/** True if the language is not installed (the files open as plain text). */
	missing: boolean;
}


/** A language contributed by an extension ("contributes.languages"). */
export interface ContributedLanguage {
	/** E.g. "mborik.z80-macroasm". */
	extensionId: string;
	/** E.g. "Z80 Macro-Assembler". */
	extensionName: string;
	/** E.g. "z80-macroasm". */
	language: string;
	/** File extensions, e.g. [".a80", ".asm", ".inc", ".s"]. */
	extensions: string[];
}


/** A file type of this extension that another extension also contributes a language for. */
export interface CompetingLanguage extends ContributedLanguage {
	/** Our file extension, lower case, e.g. ".asm". */
	extension: string;
	/** The glob to associate, e.g. "*.asm". */
	pattern: string;
	/** "sjasmplus" or "sjasmplus-list". */
	target: string;
}


/** "files.associations": glob -> language id. */
export type Associations = {[pattern: string]: string};


/** An extension glob split up. */
interface ExtensionGlob {
	/** "*." or "**\/*.". */
	prefix: string;
	/** The extensions without the dot as written, e.g. ["asm"] or ["asm", "inc", "s"]. */
	items: string[];
}


/** Splits an extension glob like "*.asm", "**\/*.asm", "*.{asm,inc}" or "**\/*.{asm,inc}", else undefined. */
function parseGlob(pattern: string): ExtensionGlob | undefined {
	const m = /^((?:\*\*\/)?\*\.)(?:([^*/?{}[\],]+)|\{([^*/?{}[\]]+)\})$/.exec(pattern);
	if (!m)
		return undefined;
	const items = m[2] !== undefined ? [m[2]] : m[3].split(',').filter(item => item.length > 0);
	return items.length > 0 ? {prefix: m[1], items} : undefined;
}


/** The extensions of an extension glob, lower case with the dot (e.g. [".asm", ".inc"]), else undefined. */
export function globExtensions(pattern: string): string[] | undefined {
	return parseGlob(pattern)?.items.map(item => '.' + item.toLowerCase());
}


/**
 * The entry of "files.associations" that decides the language of files with the extension.
 * As in VS Code, the longest matching glob wins (the order does not matter), so
 * "*.{asm,inc,-----}" wins over "*.asm". Globs with a path are ignored.
 * @param extension E.g. ".asm", lower case.
 */
export function associationFor(associations: Associations, extension: string): {pattern: string, language: string} | undefined {
	let result: {pattern: string, language: string} | undefined;
	for (const [pattern, language] of Object.entries(associations)) {
		// VS Code ignores entries that are not strings
		if (typeof language !== 'string' || !globExtensions(pattern)?.includes(extension))
			continue;
		if (!result || pattern.length > result.pattern.length)
			result = {pattern, language};
	}
	return result;
}


/** "sjasmplus", "sjasmplus-list" or undefined for an extension like ".asm". */
function targetOf(ext: string, sourceExtensions: string[], listingExtensions: string[]): string | undefined {
	const lower = ext.toLowerCase();
	if (sourceExtensions.some(e => e.toLowerCase() === lower))
		return 'sjasmplus';
	if (listingExtensions.some(e => e.toLowerCase() === lower))
		return 'sjasmplus-list';
	return undefined;
}


/**
 * Our file types that "files.associations" gives to another language.
 * @param associations The "files.associations" setting.
 * @param sourceExtensions Extensions of sjasmplus sources, e.g. [".asm", ".inc"].
 * @param listingExtensions Extensions of listings, e.g. [".lst"].
 * @param knownLanguages Ids of all installed languages.
 * @returns One entry per file type.
 */
export function findConflictingAssociations(associations: Associations, sourceExtensions: string[], listingExtensions: string[], knownLanguages: string[]): ConflictingAssociation[] {
	const known = new Set(knownLanguages);
	const result: ConflictingAssociation[] = [];
	for (const ext of [...sourceExtensions, ...listingExtensions]) {
		const extension = ext.toLowerCase();
		const association = associationFor(associations, extension);
		if (!association || association.language === 'sjasmplus' || association.language === 'sjasmplus-list')
			continue;
		const {pattern, language} = association;
		const several = parseGlob(pattern)!.items.length > 1;
		result.push({
			pattern, language, extension,
			target: targetOf(extension, sourceExtensions, listingExtensions)!,
			fixPattern: several ? '*' + extension : pattern,
			missing: !known.has(language)
		});
	}
	return result;
}


/**
 * The languages of other extensions for our file types that
 * "files.associations" does not decide (in either direction).
 * @param languages The languages of all other (enabled) extensions.
 * @param associations The "files.associations" setting.
 */
export function findCompetingLanguages(languages: ContributedLanguage[], associations: Associations, sourceExtensions: string[], listingExtensions: string[]): CompetingLanguage[] {
	const result: CompetingLanguage[] = [];
	for (const lang of languages) {
		for (const e of lang.extensions) {
			const extension = e.toLowerCase();
			const target = targetOf(extension, sourceExtensions, listingExtensions);
			if (target && !associationFor(associations, extension) && !result.some(r => r.language === lang.language && r.extension === extension))
				result.push({...lang, extension, pattern: '*' + extension, target});
		}
	}
	return result;
}


/**
 * The value of "files.associations" in one settings scope (user or workspace)
 * that sends our file types to sjasmplus.
 * - A conflicting glob of this scope with several extensions loses ours, and
 *   "*.asm" etc. are added: a shorter glob would not win over it. The glob is
 *   removed if its language is not installed or nothing but filler is left.
 * - Other conflicting globs of this scope are associated with sjasmplus.
 * - With `override` (the workspace scope, which overrides the user settings), the
 *   same is done for globs of other scopes: the key is set here to sjasmplus.
 * @param value The value in this scope.
 * @param conflicts The conflicts of the merged setting.
 * @param competing Other extensions' file types to associate here.
 * @returns The new value, undefined if nothing changes.
 */
export function fixAssociations(value: Associations | undefined, conflicts: ConflictingAssociation[], competing: CompetingLanguage[], override: boolean): Associations | undefined {
	const updated: Associations = {...(value ?? {})};
	let changed = false;
	const byPattern = new Map<string, ConflictingAssociation[]>();
	for (const c of conflicts)
		byPattern.set(c.pattern, [...(byPattern.get(c.pattern) ?? []), c]);
	for (const [pattern, group] of byPattern) {
		const glob = parseGlob(pattern)!;
		if (pattern in updated && glob.items.length > 1) {
			const ours = new Set(group.map(c => c.extension));
			const rest = glob.items.filter(item => !ours.has('.' + item.toLowerCase()));
			const language = updated[pattern];
			delete updated[pattern];
			// The rest stays for the other extension, unless it is uninstalled or the rest
			// is only NASM Code Lens' filler that makes its glob the longest ("*.{s,-----}")
			if (rest.some(item => !/^-+$/.test(item)) && !group[0].missing)
				updated[glob.prefix + (rest.length > 1 ? '{' + rest.join(',') + '}' : rest[0])] = language;
			for (const c of group)
				updated[c.fixPattern] = c.target;
			changed = true;
		}
		else if (pattern in updated || override) {
			updated[pattern] = group[0].target;
			changed = true;
		}
	}
	for (const c of competing) {
		updated[c.pattern] = c.target;
		changed = true;
	}
	return changed ? updated : undefined;
}
