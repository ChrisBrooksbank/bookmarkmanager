<script lang="ts">
	import FolderTree from './FolderTree.svelte';
	import { foldersStore } from '$lib/stores/folders.svelte';
	import type { Folder } from '$lib/types';

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
		/** Callback when a folder edit is requested */
		onEditFolder?: (folder: Folder) => void;
		/** Callback when a folder delete is requested */
		onDeleteFolder?: (folder: Folder) => void;
		/** Callback when a subfolder creation is requested */
		onCreateSubfolder?: (parentId: string) => void;
	}

	let {
		parentId = null,
		selectedFolderId = null,
		onSelectFolder,
		expandedFolders = new Set(),
		onToggleExpand,
		onEditFolder,
		onDeleteFolder,
		onCreateSubfolder
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

	/**
	 * State to track which folder's actions are shown
	 */
	let hoveredFolderId = $state<string | null>(null);
</script>

{#each folders as folder (folder.id)}
	<div
		role="group"
		onmouseenter={() => (hoveredFolderId = folder.id)}
		onmouseleave={() => (hoveredFolderId = null)}
	>
		<!-- Folder Item -->
		<div class="flex items-center group">
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

			<!-- Action Buttons (shown on hover) -->
			{#if hoveredFolderId === folder.id}
				<div class="flex items-center gap-1 ml-1">
					<!-- Add Subfolder Button -->
					{#if onCreateSubfolder}
						<button
							onclick={() => onCreateSubfolder?.(folder.id)}
							class="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
							aria-label="Add subfolder"
							title="Add subfolder"
						>
							<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
								<path
									d="M12 4v16m8-8H4"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
								/>
							</svg>
						</button>
					{/if}

					<!-- Edit Button -->
					{#if onEditFolder}
						<button
							onclick={() => onEditFolder?.(folder)}
							class="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
							aria-label="Rename folder"
							title="Rename folder"
						>
							<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
								<path
									d="M16.862 3.487a2.25 2.25 0 113.182 3.182L7.5 19.213l-4.125.688.688-4.125L16.862 3.487z"
								/>
							</svg>
						</button>
					{/if}

					<!-- Delete Button -->
					{#if onDeleteFolder}
						<button
							onclick={() => onDeleteFolder?.(folder)}
							class="p-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
							aria-label="Delete folder"
							title="Delete folder"
						>
							<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
								<path
									fill-rule="evenodd"
									d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
									clip-rule="evenodd"
								/>
							</svg>
						</button>
					{/if}
				</div>
			{/if}
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
					{onEditFolder}
					{onDeleteFolder}
					{onCreateSubfolder}
				/>
			</div>
		{/if}
	</div>
{/each}
