<script lang="ts">
	import { bookmarksStore } from '$lib/stores/bookmarks.svelte';
	import { foldersStore } from '$lib/stores/folders.svelte';
	import { tagsStore } from '$lib/stores/tags.svelte';
	import { validateUrl as validateUrlUtil } from '$lib/utils/validation';
	import type { Bookmark, Tag } from '$lib/types';

	interface Props {
		onClose?: () => void;
		initialUrl?: string;
		initialTitle?: string;
		initialDescription?: string;
	}

	let { onClose, initialUrl = '', initialTitle = '', initialDescription = '' }: Props = $props();

	// Form state
	let url = $state(initialUrl);
	let title = $state(initialTitle);
	let description = $state(initialDescription);
	let notes = $state('');
	let folderId = $state<string | null>(null);
	let selectedTagIds = $state<string[]>([]);
	let tagInput = $state('');
	let showTagSuggestions = $state(false);
	let submitting = $state(false);
	let urlError = $state('');

	/**
	 * Validate URL format
	 */
	function validateUrl(urlString: string): boolean {
		const result = validateUrlUtil(urlString);
		urlError = result.error || '';
		return result.isValid;
	}

	/**
	 * Get filtered tag suggestions based on input
	 */
	let tagSuggestions = $derived(
		tagInput.trim()
			? tagsStore.items.filter(
					(tag) =>
						tag.name.toLowerCase().includes(tagInput.toLowerCase()) &&
						!selectedTagIds.includes(tag.id)
				)
			: []
	);

	/**
	 * Get selected tags
	 */
	let selectedTags = $derived(tagsStore.getByIds(selectedTagIds));

	/**
	 * Check if tag input matches an existing tag exactly
	 */
	let exactTagMatch = $derived(tagsStore.getByName(tagInput.trim()));

	/**
	 * Add a tag to the bookmark
	 */
	function addTag(tagId: string) {
		if (!selectedTagIds.includes(tagId)) {
			selectedTagIds = [...selectedTagIds, tagId];
		}
		tagInput = '';
		showTagSuggestions = false;
	}

	/**
	 * Remove a tag from the bookmark
	 */
	function removeTag(tagId: string) {
		selectedTagIds = selectedTagIds.filter((id) => id !== tagId);
	}

	/**
	 * Create a new tag and add it to the bookmark
	 */
	async function createAndAddTag(name: string) {
		const trimmedName = name.trim();
		if (!trimmedName) return;

		// Check if tag already exists
		const existingTag = tagsStore.getByName(trimmedName);
		if (existingTag) {
			addTag(existingTag.id);
			return;
		}

		// Create new tag
		const newTag: Tag = {
			id: crypto.randomUUID(),
			name: trimmedName
		};

		await tagsStore.add(newTag);
		addTag(newTag.id);
	}

	/**
	 * Handle tag input key press
	 */
	function handleTagInputKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			if (tagInput.trim()) {
				if (exactTagMatch) {
					addTag(exactTagMatch.id);
				} else {
					createAndAddTag(tagInput);
				}
			}
		} else if (event.key === 'Escape') {
			showTagSuggestions = false;
		}
	}

	/**
	 * Handle form submission
	 */
	async function handleSubmit() {
		if (!validateUrl(url)) {
			return;
		}

		submitting = true;

		try {
			const now = Date.now();
			const bookmark: Bookmark = {
				id: crypto.randomUUID(),
				url: url.trim(),
				title: title.trim() || new URL(url.trim()).hostname,
				description: description.trim() || undefined,
				notes: notes.trim() || undefined,
				folderId: folderId || undefined,
				tags: selectedTagIds,
				createdAt: now,
				updatedAt: now
			};

			await bookmarksStore.add(bookmark);

			// Reset form
			url = '';
			title = '';
			description = '';
			notes = '';
			folderId = null;
			selectedTagIds = [];
			tagInput = '';
			urlError = '';

			// Close modal if callback provided
			if (onClose) {
				onClose();
			}
		} catch (error) {
			console.error('Failed to add bookmark:', error);
			urlError = 'Failed to save bookmark. Please try again.';
		} finally {
			submitting = false;
		}
	}

	/**
	 * Handle URL input blur to validate
	 */
	function handleUrlBlur() {
		if (url.trim()) {
			validateUrl(url);
		}
	}

	/**
	 * Clear URL error when user starts typing
	 */
	function handleUrlInput() {
		if (urlError) {
			urlError = '';
		}
	}
</script>

<form
	onsubmit={(e) => {
		e.preventDefault();
		handleSubmit();
	}}
	class="space-y-4"
>
	<!-- URL Input -->
	<div>
		<label for="url" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
			URL *
		</label>
		<input
			type="text"
			id="url"
			bind:value={url}
			oninput={handleUrlInput}
			onblur={handleUrlBlur}
			placeholder="https://example.com"
			class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent {urlError
				? 'border-red-500 dark:border-red-500'
				: 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
			disabled={submitting}
			required
		/>
		{#if urlError}
			<p class="mt-1 text-sm text-red-600 dark:text-red-400">{urlError}</p>
		{/if}
	</div>

	<!-- Title Input -->
	<div>
		<label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
			Title (optional)
		</label>
		<input
			type="text"
			id="title"
			bind:value={title}
			placeholder="Leave empty to use page title"
			class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
			disabled={submitting}
		/>
	</div>

	<!-- Description Input -->
	<div>
		<label
			for="description"
			class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
		>
			Description (optional)
		</label>
		<textarea
			id="description"
			bind:value={description}
			placeholder="Add a note about this bookmark"
			rows="3"
			class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none"
			disabled={submitting}
		></textarea>
	</div>

	<!-- Notes Input -->
	<div>
		<label for="notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
			Notes (optional)
		</label>
		<textarea
			id="notes"
			bind:value={notes}
			placeholder="Personal annotations for research context"
			rows="3"
			class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none"
			disabled={submitting}
		></textarea>
	</div>

	<!-- Folder Selection -->
	<div>
		<label for="folder" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
			Folder (optional)
		</label>
		<select
			id="folder"
			bind:value={folderId}
			class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
			disabled={submitting}
		>
			<option value={null}>No folder (root)</option>
			{#each foldersStore.items as folder (folder.id)}
				<option value={folder.id}>{folder.name}</option>
			{/each}
		</select>
	</div>

	<!-- Tag Selection -->
	<div>
		<label for="tags" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
			Tags (optional)
		</label>

		<!-- Selected Tags Display -->
		{#if selectedTags.length > 0}
			<div class="flex flex-wrap gap-2 mb-2">
				{#each selectedTags as tag (tag.id)}
					<span
						class="inline-flex items-center gap-1 px-2.5 py-1 text-sm rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
						style={tag.color ? `background-color: ${tag.color}20; color: ${tag.color};` : ''}
					>
						{tag.name}
						<button
							type="button"
							onclick={() => removeTag(tag.id)}
							disabled={submitting}
							class="ml-1 hover:text-blue-900 dark:hover:text-blue-100 transition-colors disabled:opacity-50"
							aria-label="Remove {tag.name}"
						>
							<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
									clip-rule="evenodd"
								/>
							</svg>
						</button>
					</span>
				{/each}
			</div>
		{/if}

		<!-- Tag Input -->
		<div class="relative">
			<input
				type="text"
				id="tags"
				bind:value={tagInput}
				onfocus={() => (showTagSuggestions = true)}
				onblur={() => setTimeout(() => (showTagSuggestions = false), 200)}
				onkeydown={handleTagInputKeydown}
				placeholder="Type to search or create tags"
				class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
				disabled={submitting}
			/>

			<!-- Tag Suggestions Dropdown -->
			{#if showTagSuggestions && tagInput.trim()}
				<div
					class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto"
				>
					<!-- Create New Tag Option -->
					{#if !exactTagMatch && tagInput.trim()}
						<button
							type="button"
							onclick={() => createAndAddTag(tagInput)}
							class="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700"
						>
							<span class="text-sm text-gray-700 dark:text-gray-300">
								Create new tag: <strong>{tagInput.trim()}</strong>
							</span>
						</button>
					{/if}

					<!-- Existing Tag Suggestions -->
					{#if tagSuggestions.length > 0}
						{#each tagSuggestions as tag (tag.id)}
							<button
								type="button"
								onclick={() => addTag(tag.id)}
								class="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
							>
								{#if tag.color}
									<span class="w-3 h-3 rounded-full" style="background-color: {tag.color};"></span>
								{/if}
								<span class="text-sm text-gray-700 dark:text-gray-300">{tag.name}</span>
							</button>
						{/each}
					{:else if exactTagMatch}
						<button
							type="button"
							onclick={() => addTag(exactTagMatch.id)}
							class="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
						>
							{#if exactTagMatch.color}
								<span class="w-3 h-3 rounded-full" style="background-color: {exactTagMatch.color};"
								></span>
							{/if}
							<span class="text-sm text-gray-700 dark:text-gray-300">{exactTagMatch.name}</span>
						</button>
					{/if}
				</div>
			{/if}
		</div>

		<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
			Press Enter to add a tag. New tags will be created automatically.
		</p>
	</div>

	<!-- Form Actions -->
	<div class="flex gap-3 justify-end">
		{#if onClose}
			<button
				type="button"
				onclick={onClose}
				disabled={submitting}
				class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				Cancel
			</button>
		{/if}
		<button
			type="submit"
			disabled={submitting || !url.trim()}
			class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
		>
			{submitting ? 'Adding...' : 'Add Bookmark'}
		</button>
	</div>
</form>
