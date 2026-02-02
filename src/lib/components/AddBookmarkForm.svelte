<script lang="ts">
	import { bookmarksStore } from '$lib/stores/bookmarks.svelte';
	import { foldersStore } from '$lib/stores/folders.svelte';
	import { validateUrl as validateUrlUtil } from '$lib/utils/validation';
	import type { Bookmark } from '$lib/types';

	interface Props {
		onClose?: () => void;
	}

	let { onClose }: Props = $props();

	// Form state
	let url = $state('');
	let title = $state('');
	let description = $state('');
	let folderId = $state<string | null>(null);
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
				folderId: folderId || undefined,
				tags: [],
				createdAt: now,
				updatedAt: now
			};

			await bookmarksStore.add(bookmark);

			// Reset form
			url = '';
			title = '';
			description = '';
			folderId = null;
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
