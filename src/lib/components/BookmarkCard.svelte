<script lang="ts">
	import type { Bookmark } from '$lib/types';
	import { bookmarksStore } from '$lib/stores/bookmarks.svelte';
	import ConfirmDialog from './ConfirmDialog.svelte';

	interface Props {
		bookmark: Bookmark;
	}

	let { bookmark }: Props = $props();

	let isEditing = $state(false);
	let showDeleteConfirm = $state(false);
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
	 * Show delete confirmation dialog
	 */
	function showDeleteConfirmation() {
		showDeleteConfirm = true;
	}

	/**
	 * Delete bookmark after confirmation
	 */
	async function confirmDelete() {
		await bookmarksStore.remove(bookmark.id);
		showDeleteConfirm = false;
	}

	/**
	 * Cancel delete operation
	 */
	function cancelDelete() {
		showDeleteConfirm = false;
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
</script>

<div
	class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
>
	{#if isEditing}
		<!-- Edit Mode -->
		<form
			onsubmit={(e) => {
				e.preventDefault();
				saveEdit();
			}}
			class="space-y-3"
		>
			<!-- Title Input -->
			<div>
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

			<!-- URL Input -->
			<div>
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
	{:else}
		<!-- Display Mode -->
		<div class="space-y-2">
			<!-- Title and Actions Header -->
			<div class="flex items-start justify-between gap-2">
				<a
					href={bookmark.url}
					target="_blank"
					rel="noopener noreferrer"
					class="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex-1 truncate"
				>
					{bookmark.title}
				</a>

				<!-- Action Buttons -->
				<div class="flex gap-1 flex-shrink-0">
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
						onclick={showDeleteConfirmation}
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

			<!-- Domain/URL -->
			<a
				href={bookmark.url}
				target="_blank"
				rel="noopener noreferrer"
				class="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 truncate block transition-colors"
				title={bookmark.url}
			>
				{getDomain(bookmark.url)}
			</a>

			<!-- Description -->
			{#if bookmark.description}
				<p class="text-sm text-gray-500 dark:text-gray-500 line-clamp-2">
					{bookmark.description}
				</p>
			{/if}

			<!-- Metadata Footer -->
			<div class="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-600 pt-1">
				<span title="Created {formatDate(bookmark.createdAt)}">
					Added {formatDate(bookmark.createdAt)}
				</span>
				{#if bookmark.updatedAt !== bookmark.createdAt}
					<span>•</span>
					<span title="Updated {formatDate(bookmark.updatedAt)}">
						Updated {formatDate(bookmark.updatedAt)}
					</span>
				{/if}
			</div>
		</div>
	{/if}
</div>

<!-- Delete Confirmation Dialog -->
<ConfirmDialog
	open={showDeleteConfirm}
	title="Delete Bookmark"
	message={`Are you sure you want to delete "${bookmark.title}"? This action cannot be undone.`}
	confirmText="Delete"
	cancelText="Cancel"
	onConfirm={confirmDelete}
	onCancel={cancelDelete}
	danger={true}
/>
