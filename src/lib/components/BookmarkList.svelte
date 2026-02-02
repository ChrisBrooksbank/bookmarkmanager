<script lang="ts">
	import type { Bookmark } from '$lib/types';
	import { bookmarksStore } from '$lib/stores/bookmarks.svelte';
	import { uiStateStore } from '$lib/stores/uiState.svelte';
	import { highlightText } from '$lib/utils/highlight';

	interface Props {
		bookmark: Bookmark;
		searchQuery?: string;
	}

	let { bookmark, searchQuery = '' }: Props = $props();

	let isSelected = $derived(uiStateStore.isBookmarkSelected(bookmark.id));

	let isEditing = $state(false);
	let editedTitle = $state(bookmark.title);
	let editedUrl = $state(bookmark.url);
	let editedDescription = $state(bookmark.description || '');

	/**
	 * Enter edit mode
	 */
	function startEdit() {
		isEditing = true;
		editedTitle = bookmark.title;
		editedUrl = bookmark.url;
		editedDescription = bookmark.description || '';
	}

	/**
	 * Cancel edit mode and revert changes
	 */
	function cancelEdit() {
		isEditing = false;
		editedTitle = bookmark.title;
		editedUrl = bookmark.url;
		editedDescription = bookmark.description || '';
	}

	/**
	 * Save edited bookmark
	 */
	async function saveEdit() {
		if (!editedTitle.trim() || !editedUrl.trim()) {
			return;
		}

		const updatedBookmark: Bookmark = {
			...bookmark,
			title: editedTitle.trim(),
			url: editedUrl.trim(),
			description: editedDescription.trim() || undefined,
			updatedAt: Date.now()
		};

		await bookmarksStore.update(updatedBookmark);
		isEditing = false;
	}

	/**
	 * Delete bookmark with confirmation
	 */
	async function deleteBookmark() {
		if (confirm(`Are you sure you want to delete "${bookmark.title}"?`)) {
			await bookmarksStore.remove(bookmark.id);
		}
	}

	/**
	 * Format timestamp to readable date
	 */
	function formatDate(timestamp: number): string {
		return new Date(timestamp).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	/**
	 * Get domain from URL
	 */
	function getDomain(url: string): string {
		try {
			return new URL(url).hostname;
		} catch {
			return url;
		}
	}

	/**
	 * Toggle bookmark selection
	 */
	function toggleSelection(e: Event) {
		e.preventDefault();
		uiStateStore.toggleBookmarkSelection(bookmark.id);
	}
</script>

{#if isEditing}
	<!-- Edit Mode - Compact Form -->
	<div class="bg-gray-50 dark:bg-gray-900 border-l-4 border-blue-500 p-3 mb-2 rounded-r flex gap-3">
		<!-- Selection Checkbox -->
		<div class="flex-shrink-0 pt-2">
			<input
				type="checkbox"
				checked={isSelected}
				onchange={toggleSelection}
				class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
				aria-label="Select bookmark"
			/>
		</div>
		<form
			onsubmit={(e) => {
				e.preventDefault();
				saveEdit();
			}}
			class="space-y-2 flex-1"
		>
			<!-- Title and URL in same row -->
			<div class="flex gap-2">
				<div class="flex-1">
					<label for="edit-title-{bookmark.id}" class="sr-only">Title</label>
					<input
						type="text"
						id="edit-title-{bookmark.id}"
						bind:value={editedTitle}
						class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						placeholder="Title"
						required
					/>
				</div>
				<div class="flex-1">
					<label for="edit-url-{bookmark.id}" class="sr-only">URL</label>
					<input
						type="url"
						id="edit-url-{bookmark.id}"
						bind:value={editedUrl}
						class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						placeholder="URL"
						required
					/>
				</div>
			</div>

			<!-- Description Input -->
			<div>
				<label for="edit-description-{bookmark.id}" class="sr-only">Description</label>
				<textarea
					id="edit-description-{bookmark.id}"
					bind:value={editedDescription}
					class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
					placeholder="Description (optional)"
					rows="2"
				></textarea>
			</div>

			<!-- Edit Actions -->
			<div class="flex gap-2 justify-end">
				<button
					type="button"
					onclick={cancelEdit}
					class="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
				>
					Cancel
				</button>
				<button
					type="submit"
					class="px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
				>
					Save
				</button>
			</div>
		</form>
	</div>
{:else}
	<!-- Compact List View -->
	<div
		class={`flex items-start gap-3 py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors group ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
	>
		<!-- Selection Checkbox -->
		<div class="flex-shrink-0 pt-1">
			<input
				type="checkbox"
				checked={isSelected}
				onchange={toggleSelection}
				class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
				aria-label="Select bookmark"
			/>
		</div>

		<!-- Main Content Area -->
		<div class="flex-1 min-w-0">
			<!-- Title -->
			<div class="flex items-center gap-2">
				<a
					href={bookmark.url}
					target="_blank"
					rel="noopener noreferrer"
					class="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
				>
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html highlightText(bookmark.title, searchQuery)}
				</a>
			</div>

			<!-- URL and Metadata Row -->
			<div class="flex items-center gap-2 mt-1 flex-wrap">
				<a
					href={bookmark.url}
					target="_blank"
					rel="noopener noreferrer"
					class="text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
					title={bookmark.url}
				>
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html highlightText(getDomain(bookmark.url), searchQuery)}
				</a>
				<span class="text-gray-400 dark:text-gray-600">•</span>
				<span
					class="text-xs text-gray-400 dark:text-gray-600"
					title="Created {formatDate(bookmark.createdAt)}"
				>
					{formatDate(bookmark.createdAt)}
				</span>
				{#if bookmark.updatedAt !== bookmark.createdAt}
					<span class="text-gray-400 dark:text-gray-600">•</span>
					<span
						class="text-xs text-gray-400 dark:text-gray-600"
						title="Updated {formatDate(bookmark.updatedAt)}"
					>
						Updated
					</span>
				{/if}
			</div>

			<!-- Description (optional) -->
			{#if bookmark.description}
				<p class="text-sm text-gray-500 dark:text-gray-500 mt-1 truncate">
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html highlightText(bookmark.description, searchQuery)}
				</p>
			{/if}
		</div>

		<!-- Action Buttons -->
		<div class="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
			<button
				onclick={startEdit}
				class="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
				aria-label="Edit bookmark"
				title="Edit"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
					/>
				</svg>
			</button>
			<button
				onclick={deleteBookmark}
				class="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
				aria-label="Delete bookmark"
				title="Delete"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
					/>
				</svg>
			</button>
		</div>
	</div>
{/if}
