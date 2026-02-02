<script lang="ts">
	import FolderTree from './FolderTree.svelte';
	import { foldersStore } from '$lib/stores/folders.svelte';

	interface Props {
		/** Parent folder ID (null for root) */
		parentId?: string | null;
		/** Currently selected folder ID */
		selectedFolderId?: string | null;
		/** Callback when a folder is selected */
		onSelectFolder?: (folderId: string) => void;
		/** Set of expanded folder IDs (managed by parent) */
		expandedFolders?: Set<string>;
		/** Callback to toggle folder expansion */
		onToggleExpand?: (folderId: string) => void;
	}

	let {
		parentId = null,
		selectedFolderId = null,
		onSelectFolder,
		expandedFolders = new Set(),
		onToggleExpand
	}: Props = $props();

	/**
	 * Get folders for the current parent
	 */
	let folders = $derived(foldersStore.getByParentId(parentId));

	/**
	 * Handle folder selection
	 */
	function handleSelectFolder(folderId: string) {
		onSelectFolder?.(folderId);
	}

	/**
	 * Handle toggle expansion
	 */
	function handleToggleExpand(folderId: string) {
		onToggleExpand?.(folderId);
	}

	/**
	 * Check if folder has children
	 */
	function hasChildren(folderId: string): boolean {
		return foldersStore.getChildren(folderId).length > 0;
	}
</script>

{#each folders as folder (folder.id)}
	<div>
		<!-- Folder Item -->
		<div class="flex items-center">
			<!-- Expand/Collapse Button (only if folder has children) -->
			{#if hasChildren(folder.id)}
				<button
					onclick={() => handleToggleExpand(folder.id)}
					class="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
					aria-label={expandedFolders.has(folder.id) ? 'Collapse folder' : 'Expand folder'}
				>
					<svg
						class="w-4 h-4 transition-transform {expandedFolders.has(folder.id) ? 'rotate-90' : ''}"
						fill="currentColor"
						viewBox="0 0 24 24"
					>
						<path d="M9 5l7 7-7 7V5z" />
					</svg>
				</button>
			{:else}
				<!-- Spacer for alignment when no children -->
				<div class="w-6"></div>
			{/if}

			<!-- Folder Button -->
			<button
				onclick={() => handleSelectFolder(folder.id)}
				class="flex-1 text-left px-3 py-2 rounded-lg text-sm transition-colors {selectedFolderId ===
				folder.id
					? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
					: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}"
			>
				📁 {folder.name}
			</button>
		</div>

		<!-- Nested Children (recursive) -->
		{#if hasChildren(folder.id) && expandedFolders.has(folder.id)}
			<div class="ml-4 border-l border-gray-200 dark:border-gray-700 pl-2">
				<FolderTree
					parentId={folder.id}
					{selectedFolderId}
					{onSelectFolder}
					{expandedFolders}
					{onToggleExpand}
				/>
			</div>
		{/if}
	</div>
{/each}
