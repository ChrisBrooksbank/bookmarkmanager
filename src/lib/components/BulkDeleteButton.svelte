<script lang="ts">
	import { bookmarksStore } from '$lib/stores/bookmarks.svelte';
	import { uiStateStore } from '$lib/stores/uiState.svelte';
	import { browser } from '$app/environment';

	let isConfirming = $state(false);

	function showConfirmation() {
		isConfirming = true;
	}

	function cancelDelete() {
		isConfirming = false;
	}

	async function confirmDelete() {
		const selectedIds = uiStateStore.selectedBookmarkIds;
		if (selectedIds.length === 0) return;

		await bookmarksStore.bulkDelete(selectedIds);
		uiStateStore.clearSelection();
		isConfirming = false;
	}

	// Close confirmation when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('[data-bulk-delete-modal]')) {
			cancelDelete();
		}
	}

	$effect(() => {
		if (!browser) return;

		if (isConfirming) {
			document.addEventListener('click', handleClickOutside);
			return () => {
				document.removeEventListener('click', handleClickOutside);
			};
		}
	});
</script>

<div class="relative">
	<button
		onclick={showConfirmation}
		class="px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 rounded-lg transition-colors flex items-center gap-2"
		aria-label="Bulk delete bookmarks"
		disabled={uiStateStore.selectedBookmarkIds.length === 0}
	>
		<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
			/>
		</svg>
		Delete
	</button>

	{#if isConfirming}
		<div
			class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
			data-bulk-delete-modal
			role="dialog"
			aria-modal="true"
			aria-labelledby="delete-dialog-title"
		>
			<div
				class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
				role="document"
				onclick={(e) => e.stopPropagation()}
			>
				<div class="flex items-start gap-4">
					<div
						class="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
					>
						<svg
							class="w-6 h-6 text-red-600 dark:text-red-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							/>
						</svg>
					</div>
					<div class="flex-1">
						<h3
							id="delete-dialog-title"
							class="text-lg font-semibold text-gray-900 dark:text-white mb-2"
						>
							Delete {uiStateStore.selectedBookmarkIds.length} bookmark{uiStateStore
								.selectedBookmarkIds.length === 1
								? ''
								: 's'}?
						</h3>
						<p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
							This action cannot be undone. The selected bookmarks will be permanently deleted.
						</p>
						<div class="flex gap-3 justify-end">
							<button
								onclick={cancelDelete}
								class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
							>
								Cancel
							</button>
							<button
								onclick={confirmDelete}
								class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 rounded-lg transition-colors"
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
