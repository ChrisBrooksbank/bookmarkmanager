<script lang="ts">
	import Modal from './Modal.svelte';
	import {
		importBookmarksFromContent,
		type ImportResult,
		type ImportRuleMatchType
	} from '$lib/utils/importBookmarks';
	import { parseBookmarkFile, type BookmarkImportFormat } from '$lib/utils/bookmarkParser';
	import { tagsStore } from '$lib/stores/tags.svelte';

	type DuplicateHandling = 'skip' | 'replace' | 'keep';
	interface RuleDraft {
		id: string;
		matchType: ImportRuleMatchType;
		pattern: string;
		tags: string;
	}

	let modalOpen = $state(false);
	let selectedFile = $state<File | null>(null);
	let fileContent = $state('');
	let duplicateHandling = $state<DuplicateHandling>('skip');
	let importTags = $state(true);
	let defaultTags = $state('');
	let ruleDrafts = $state<RuleDraft[]>([]);
	let importing = $state(false);
	let progressCurrent = $state(0);
	let progressTotal = $state(0);
	let result = $state<ImportResult | null>(null);
	let preview = $state<{
		format: BookmarkImportFormat;
		bookmarks: number;
		folders: number;
		tagged: number;
		errors: string[];
	} | null>(null);
	let fileInput: HTMLInputElement | null = null;

	const formatLabels: Record<BookmarkImportFormat, string> = {
		'netscape-html': 'Browser HTML',
		'bookmark-manager-json': 'BookmarkVault JSON',
		'chrome-json': 'Chrome JSON',
		csv: 'CSV',
		'url-list': 'URL list',
		unknown: 'Unknown'
	};

	function parseTagInput(value: string): string[] {
		return value
			.split(',')
			.map((tagName) => tagName.trim())
			.filter(Boolean);
	}

	function addRule() {
		ruleDrafts = [
			...ruleDrafts,
			{
				id: crypto.randomUUID(),
				matchType: 'contains',
				pattern: '',
				tags: ''
			}
		];
	}

	function removeRule(id: string) {
		ruleDrafts = ruleDrafts.filter((rule) => rule.id !== id);
	}

	function updateRule<K extends keyof RuleDraft>(id: string, key: K, value: RuleDraft[K]) {
		ruleDrafts = ruleDrafts.map((rule) => (rule.id === id ? { ...rule, [key]: value } : rule));
	}

	function openModal() {
		modalOpen = true;
	}

	function closeModal() {
		if (importing) return;
		modalOpen = false;
	}

	function resetSelection(clearInput = true) {
		selectedFile = null;
		fileContent = '';
		preview = null;
		result = null;
		progressCurrent = 0;
		progressTotal = 0;
		if (clearInput && fileInput) fileInput.value = '';
	}

	async function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0] ?? null;
		resetSelection(false);
		selectedFile = file;
		if (!file) return;

		try {
			fileContent = await file.text();
			const parsed = parseBookmarkFile(fileContent, file.name);
			preview = {
				format: parsed.format,
				bookmarks: parsed.bookmarks.length,
				folders: parsed.folders.length,
				tagged: parsed.tagNamesByBookmarkId.size,
				errors: parsed.errors.slice(0, 4)
			};
		} catch (error) {
			preview = {
				format: 'unknown',
				bookmarks: 0,
				folders: 0,
				tagged: 0,
				errors: [`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`]
			};
		}
	}

	async function handleImport() {
		if (!selectedFile || !fileContent || importing) return;

		importing = true;
		result = null;
		progressCurrent = 0;
		progressTotal = preview ? preview.bookmarks + preview.folders + preview.tagged : 0;

		result = await importBookmarksFromContent(
			fileContent,
			{
				duplicateHandling,
				importTags,
				defaultTagNames: parseTagInput(defaultTags),
				tagRules: ruleDrafts.map((rule) => ({
					matchType: rule.matchType,
					pattern: rule.pattern,
					tags: parseTagInput(rule.tags)
				})),
				onProgress: (current, total) => {
					progressCurrent = current;
					progressTotal = total;
				}
			},
			selectedFile.name
		);
		importing = false;
	}

	let progressPercent = $derived(
		progressTotal > 0 ? Math.round((progressCurrent / progressTotal) * 100) : 0
	);
</script>

<button
	onclick={openModal}
	class="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
	aria-label="Import bookmarks"
	title="Import bookmarks"
>
	<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
			d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
		/>
	</svg>
	Import
</button>

<Modal open={modalOpen} title="Import Bookmarks" onClose={closeModal}>
	<div class="space-y-4">
		<input
			bind:this={fileInput}
			type="file"
			accept=".html,.htm,.json,.csv,.txt,text/html,application/json,text/csv,text/plain"
			onchange={handleFileChange}
			class="block w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
		/>

		{#if preview}
			<div class="grid grid-cols-2 gap-2 text-sm">
				<div class="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
					<div class="text-gray-500 dark:text-gray-400">Format</div>
					<div class="font-semibold text-gray-900 dark:text-white">
						{formatLabels[preview.format]}
					</div>
				</div>
				<div class="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
					<div class="text-gray-500 dark:text-gray-400">Bookmarks</div>
					<div class="font-semibold text-gray-900 dark:text-white">{preview.bookmarks}</div>
				</div>
				<div class="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
					<div class="text-gray-500 dark:text-gray-400">Folders</div>
					<div class="font-semibold text-gray-900 dark:text-white">{preview.folders}</div>
				</div>
				<div class="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
					<div class="text-gray-500 dark:text-gray-400">Tagged</div>
					<div class="font-semibold text-gray-900 dark:text-white">{preview.tagged}</div>
				</div>
			</div>
		{/if}

		<div class="space-y-3">
			<label
				class="block text-sm font-medium text-gray-700 dark:text-gray-300"
				for="duplicate-policy"
			>
				Duplicates
			</label>
			<select
				id="duplicate-policy"
				bind:value={duplicateHandling}
				class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
			>
				<option value="skip">Skip existing URLs</option>
				<option value="replace">Replace existing URLs</option>
				<option value="keep">Keep duplicates</option>
			</select>

			<label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
				<input
					type="checkbox"
					bind:checked={importTags}
					class="h-4 w-4 rounded border-gray-300 text-blue-600"
				/>
				Import tags
			</label>
		</div>

		<div class="space-y-3 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
			<div class="flex items-center justify-between gap-3">
				<h3 class="text-sm font-semibold text-gray-900 dark:text-white">Import rules</h3>
				<button
					type="button"
					onclick={addRule}
					disabled={importing}
					class="px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-50 transition-colors"
				>
					Add rule
				</button>
			</div>

			<label class="block text-sm text-gray-700 dark:text-gray-300" for="default-tags">
				<span class="mb-1 block font-medium">Default tags</span>
				<input
					id="default-tags"
					type="text"
					bind:value={defaultTags}
					list="import-tag-suggestions"
					placeholder="research, inbox, reading"
					disabled={importing}
					class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
				/>
			</label>

			<datalist id="import-tag-suggestions">
				{#each tagsStore.items as tag (tag.id)}
					<option value={tag.name}></option>
				{/each}
			</datalist>

			{#if ruleDrafts.length > 0}
				<div class="space-y-3">
					{#each ruleDrafts as rule (rule.id)}
						<div class="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-3 space-y-2">
							<div class="grid grid-cols-1 sm:grid-cols-[8rem_1fr_auto] gap-2">
								<select
									value={rule.matchType}
									onchange={(event) =>
										updateRule(
											rule.id,
											'matchType',
											event.currentTarget.value as ImportRuleMatchType
										)}
									disabled={importing}
									aria-label="Rule match type"
									class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
								>
									<option value="contains">Contains</option>
									<option value="startsWith">Starts with</option>
									<option value="domain">Domain</option>
									<option value="regex">Regex</option>
								</select>
								<input
									type="text"
									value={rule.pattern}
									oninput={(event) => updateRule(rule.id, 'pattern', event.currentTarget.value)}
									disabled={importing}
									placeholder={rule.matchType === 'domain'
										? 'github.com'
										: rule.matchType === 'regex'
											? 'docs|api'
											: '/docs/'}
									aria-label="Rule pattern"
									class="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
								/>
								<button
									type="button"
									onclick={() => removeRule(rule.id)}
									disabled={importing}
									aria-label="Remove import rule"
									class="px-3 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-white dark:bg-gray-700 border border-red-200 dark:border-red-900/50 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
								>
									Remove
								</button>
							</div>
							<input
								type="text"
								value={rule.tags}
								oninput={(event) => updateRule(rule.id, 'tags', event.currentTarget.value)}
								list="import-tag-suggestions"
								disabled={importing}
								placeholder="dev, docs"
								aria-label="Tags to apply for this rule"
								class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
							/>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		{#if importing}
			<div>
				<div class="mb-1 flex justify-between text-xs text-gray-600 dark:text-gray-400">
					<span>{progressCurrent} / {progressTotal}</span>
					<span>{progressPercent}%</span>
				</div>
				<div class="h-2 rounded-full bg-gray-200 dark:bg-gray-700">
					<div
						class="h-2 rounded-full bg-blue-600 transition-all"
						style="width: {progressPercent}%"
					></div>
				</div>
			</div>
		{/if}

		{#if result}
			<div
				class="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-100"
			>
				Imported {result.bookmarksImported}, replaced {result.bookmarksReplaced}, skipped {result.bookmarksSkipped},
				folders {result.foldersImported}, tags {result.tagsImported}.
			</div>
		{/if}

		{#if (preview?.errors.length ?? 0) > 0 || (result?.errors.length ?? 0) > 0}
			<div
				class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-100"
			>
				<ul class="space-y-1">
					{#each [...(preview?.errors ?? []), ...(result?.errors ?? [])].slice(0, 6) as error, index (`${index}-${error}`)}
						<li>{error}</li>
					{/each}
				</ul>
			</div>
		{/if}

		<div class="flex justify-end gap-3">
			<button
				type="button"
				onclick={() => resetSelection()}
				disabled={importing || !selectedFile}
				class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
			>
				Reset
			</button>
			<button
				type="button"
				onclick={handleImport}
				disabled={importing ||
					!selectedFile ||
					!preview ||
					preview.bookmarks + preview.folders === 0}
				class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
			>
				{importing ? 'Importing...' : 'Import'}
			</button>
		</div>
	</div>
</Modal>
