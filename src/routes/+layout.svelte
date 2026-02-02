<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Modal from '$lib/components/Modal.svelte';
	import AddBookmarkForm from '$lib/components/AddBookmarkForm.svelte';
	import FolderForm from '$lib/components/FolderForm.svelte';
	import FolderTree from '$lib/components/FolderTree.svelte';
	import SearchBar from '$lib/components/SearchBar.svelte';
	import DateRangeFilter from '$lib/components/DateRangeFilter.svelte';
	import SortSelector from '$lib/components/SortSelector.svelte';
	import ExportMenu from '$lib/components/ExportMenu.svelte';
	import Bookmarklet from '$lib/components/Bookmarklet.svelte';
	import { foldersStore } from '$lib/stores/folders.svelte';
	import { bookmarksStore } from '$lib/stores/bookmarks.svelte';
	import { tagsStore } from '$lib/stores/tags.svelte';
	import { uiStateStore } from '$lib/stores/uiState.svelte';
	import { onMount, setContext } from 'svelte';
	import { browser } from '$app/environment';
	import { createShortcutHandler, getDefaultShortcuts } from '$lib/utils/keyboard';
	import type { Folder, Bookmark } from '$lib/types';

	let { children } = $props();

	// Sidebar state
	let sidebarOpen = $state(true);

	// Modal state
	let addBookmarkModalOpen = $state(false);

	// URL parameters for pre-filling bookmark form (from bookmarklet)
	let urlParam = $state('');
	let titleParam = $state('');
	let descriptionParam = $state('');
	let folderModalOpen = $state(false);
	let deleteFolderModalOpen = $state(false);
	let bookmarkletModalOpen = $state(false);

	// Folder operation state
	let folderToEdit = $state<Folder | null>(null);
	let folderToDelete = $state<Folder | null>(null);
	let parentIdForNewFolder = $state<string | null>(null);

	// Expanded folders state
	let expandedFolders = $state<Set<string>>(new Set());

	// Load stores on mount
	onMount(() => {
		foldersStore.load();
		tagsStore.load();
		bookmarksStore.load();
		uiStateStore.initTheme();

		// Check for URL parameters (from bookmarklet)
		if (browser) {
			const params = new URLSearchParams(window.location.search);
			const url = params.get('url');
			const title = params.get('title');
			const description = params.get('description');

			if (url) {
				urlParam = decodeURIComponent(url);
				titleParam = title ? decodeURIComponent(title) : '';
				descriptionParam = description ? decodeURIComponent(description) : '';
				// Open the add bookmark modal with pre-filled data
				addBookmarkModalOpen = true;

				// Clear URL parameters after reading them
				window.history.replaceState({}, '', window.location.pathname);
			}
		}

		// Register service worker update handler
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker.register('/service-worker.js').then((registration) => {
				// Check for updates periodically
				setInterval(
					() => {
						registration.update();
					},
					60 * 60 * 1000
				); // Check every hour

				// Listen for new service worker
				registration.addEventListener('updatefound', () => {
					const newWorker = registration.installing;
					if (newWorker) {
						newWorker.addEventListener('statechange', () => {
							if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
								// New service worker is ready, notify user
								console.log('New version available. Refresh to update.');
							}
						});
					}
				});
			});
		}
	});

	/**
	 * Focus search input
	 */
	function focusSearch() {
		// Query for the search input element
		const searchInput = document.querySelector(
			'input[aria-label="Search bookmarks"]'
		) as HTMLInputElement;
		if (searchInput) {
			searchInput.focus();
		}
	}

	/**
	 * Initialize keyboard shortcuts using $effect
	 */
	$effect(() => {
		if (!browser) return;

		const shortcuts = getDefaultShortcuts({
			onSearch: focusSearch,
			onToggleSidebar: toggleSidebar,
			onAddBookmark: openAddBookmarkModal,
			onGridView: () => uiStateStore.setViewMode('grid'),
			onListView: () => uiStateStore.setViewMode('list')
		});

		const handler = createShortcutHandler(shortcuts);

		window.addEventListener('keydown', handler);

		return () => {
			window.removeEventListener('keydown', handler);
		};
	});

	/**
	 * Filter and sort bookmarks based on search query, selected folder, tags, date range, and sort order
	 */
	let filteredBookmarks = $derived.by(() => {
		let results = bookmarksStore.items;

		// Filter by search query if present
		if (uiStateStore.searchQuery.trim() !== '') {
			const lowerQuery = uiStateStore.searchQuery.toLowerCase();
			results = results.filter(
				(b) =>
					b.title.toLowerCase().includes(lowerQuery) ||
					b.url.toLowerCase().includes(lowerQuery) ||
					(b.description && b.description.toLowerCase().includes(lowerQuery))
			);
		}

		// Filter by folder if one is selected
		if (uiStateStore.selectedFolderId !== null) {
			results = results.filter((b) => b.folderId === uiStateStore.selectedFolderId);
		}

		// Filter by tags if any are selected (AND logic - bookmark must have ALL selected tags)
		if (uiStateStore.selectedTagIds.length > 0) {
			results = results.filter((bookmark) =>
				uiStateStore.selectedTagIds.every((tagId) => bookmark.tags.includes(tagId))
			);
		}

		// Filter by date range if not 'all'
		if (uiStateStore.dateRange !== 'all') {
			const now = Date.now();
			let cutoffTime: number;

			switch (uiStateStore.dateRange) {
				case 'last-7-days':
					cutoffTime = now - 7 * 24 * 60 * 60 * 1000;
					break;
				case 'last-30-days':
					cutoffTime = now - 30 * 24 * 60 * 60 * 1000;
					break;
				case 'last-90-days':
					cutoffTime = now - 90 * 24 * 60 * 60 * 1000;
					break;
				default:
					cutoffTime = 0;
			}

			results = results.filter((bookmark) => bookmark.createdAt >= cutoffTime);
		}

		// Sort results based on selected sort order
		const sorted = [...results];
		switch (uiStateStore.sortBy) {
			case 'newest':
				sorted.sort((a, b) => b.createdAt - a.createdAt);
				break;
			case 'oldest':
				sorted.sort((a, b) => a.createdAt - b.createdAt);
				break;
			case 'alphabetical':
				sorted.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
				break;
			case 'recently-updated':
				sorted.sort((a, b) => b.updatedAt - a.updatedAt);
				break;
		}

		return sorted;
	});

	// Provide filtered bookmarks to child components via context
	setContext('filteredBookmarks', {
		get bookmarks(): Bookmark[] {
			return filteredBookmarks;
		}
	});

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}

	function selectFolder(folderId: string | null) {
		uiStateStore.setSelectedFolderId(folderId);
	}

	function toggleTag(tagId: string) {
		uiStateStore.toggleSelectedTag(tagId);
	}

	function toggleFolderExpand(folderId: string) {
		if (expandedFolders.has(folderId)) {
			expandedFolders.delete(folderId);
		} else {
			expandedFolders.add(folderId);
		}
		expandedFolders = expandedFolders;
	}

	function cycleTheme() {
		const current = uiStateStore.themeMode;
		const next: 'light' | 'dark' | 'system' =
			current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
		uiStateStore.setThemeMode(next);
	}

	function openAddBookmarkModal() {
		addBookmarkModalOpen = true;
	}

	function closeAddBookmarkModal() {
		addBookmarkModalOpen = false;
		// Clear URL params when closing modal
		urlParam = '';
		titleParam = '';
		descriptionParam = '';
	}

	function openCreateFolderModal(parentId: string | null = null) {
		folderToEdit = null;
		parentIdForNewFolder = parentId;
		folderModalOpen = true;
	}

	function openEditFolderModal(folder: Folder) {
		folderToEdit = folder;
		parentIdForNewFolder = null;
		folderModalOpen = true;
	}

	function closeFolderModal() {
		folderModalOpen = false;
		folderToEdit = null;
		parentIdForNewFolder = null;
	}

	function openDeleteFolderModal(folder: Folder) {
		folderToDelete = folder;
		deleteFolderModalOpen = true;
	}

	function closeDeleteFolderModal() {
		deleteFolderModalOpen = false;
		folderToDelete = null;
	}

	async function confirmDeleteFolder() {
		if (!folderToDelete) return;

		try {
			// Move all bookmarks in this folder and descendant folders to root
			const descendantIds = [
				folderToDelete.id,
				...foldersStore.getDescendants(folderToDelete.id).map((f) => f.id)
			];

			// Load bookmarks if not already loaded
			if (bookmarksStore.items.length === 0) {
				await bookmarksStore.load();
			}

			// Update bookmarks that are in the deleted folder or its descendants
			const bookmarksToUpdate = bookmarksStore.items.filter(
				(b) => b.folderId && descendantIds.includes(b.folderId)
			);

			for (const bookmark of bookmarksToUpdate) {
				await bookmarksStore.update({
					...bookmark,
					folderId: null
				});
			}

			// Delete all descendant folders first
			const descendants = foldersStore.getDescendants(folderToDelete.id);
			for (const descendant of descendants) {
				await foldersStore.remove(descendant.id);
			}

			// Delete the folder itself
			await foldersStore.remove(folderToDelete.id);

			// If the deleted folder was selected, deselect it
			if (uiStateStore.selectedFolderId === folderToDelete.id) {
				uiStateStore.setSelectedFolderId(null);
			}

			closeDeleteFolderModal();
		} catch (error) {
			console.error('Failed to delete folder:', error);
		}
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex h-screen bg-gray-50 dark:bg-gray-900">
	<!-- Sidebar -->
	<aside
		class="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 {sidebarOpen
			? 'translate-x-0'
			: '-translate-x-full'} md:translate-x-0"
	>
		<!-- Sidebar Header -->
		<div class="p-4 border-b border-gray-200 dark:border-gray-700">
			<h1 class="text-xl font-bold text-gray-900 dark:text-white">BookmarkVault</h1>
		</div>

		<!-- Sidebar Content -->
		<div class="flex-1 overflow-y-auto p-4">
			<!-- Folders Section -->
			<div class="mb-6">
				<div class="flex items-center justify-between mb-2">
					<h2 class="text-sm font-semibold text-gray-600 dark:text-gray-400">FOLDERS</h2>
					<button
						onclick={() => openCreateFolderModal(null)}
						class="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
						aria-label="Create folder"
						title="Create folder"
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
				</div>
				<nav class="space-y-1">
					<!-- All Bookmarks -->
					<button
						onclick={() => selectFolder(null)}
						class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors {uiStateStore.selectedFolderId ===
						null
							? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
							: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}"
					>
						📚 All Bookmarks
					</button>

					<!-- Folder Tree -->
					{#if foldersStore.loading}
						<div class="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">Loading folders...</div>
					{:else if foldersStore.items.length === 0}
						<div class="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">No folders yet</div>
					{:else}
						<FolderTree
							parentId={null}
							selectedFolderId={uiStateStore.selectedFolderId}
							onSelectFolder={selectFolder}
							{expandedFolders}
							onToggleExpand={toggleFolderExpand}
							onEditFolder={openEditFolderModal}
							onDeleteFolder={openDeleteFolderModal}
							onCreateSubfolder={openCreateFolderModal}
						/>
					{/if}
				</nav>
			</div>

			<!-- Tags Section -->
			<div>
				<h2 class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">TAGS</h2>
				<div class="space-y-1">
					{#if tagsStore.loading}
						<div class="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">Loading tags...</div>
					{:else if tagsStore.items.length === 0}
						<div class="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">No tags yet</div>
					{:else}
						{#each tagsStore.items as tag (tag.id)}
							<button
								onclick={() => toggleTag(tag.id)}
								class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 {uiStateStore.selectedTagIds.includes(
									tag.id
								)
									? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
									: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}"
							>
								{#if tag.color}
									<span class="w-3 h-3 rounded-full" style="background-color: {tag.color}"></span>
								{:else}
									<span class="w-3 h-3 rounded-full bg-gray-400"></span>
								{/if}
								{tag.name}
							</button>
						{/each}
					{/if}
				</div>
			</div>
		</div>

		<!-- Sidebar Footer -->
		<div class="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
			<button
				onclick={openAddBookmarkModal}
				class="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
			>
				+ Add Bookmark
			</button>
			<button
				onclick={() => (bookmarkletModalOpen = true)}
				class="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-center gap-2"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
					/>
				</svg>
				Bookmarklet
			</button>
		</div>
	</aside>

	<!-- Mobile Sidebar Overlay -->
	{#if sidebarOpen}
		<button
			onclick={toggleSidebar}
			class="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
			aria-label="Close sidebar"
		></button>
	{/if}

	<!-- Main Content -->
	<main class="flex-1 flex flex-col overflow-hidden">
		<!-- Header -->
		<header
			class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4"
		>
			<div class="flex items-center justify-between gap-4 mb-4">
				<!-- Mobile Menu Button -->
				<button
					onclick={toggleSidebar}
					class="md:hidden text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
					aria-label="Toggle sidebar"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
				</button>

				<div class="flex-1 md:ml-0 ml-4">
					<h2 class="text-lg font-semibold text-gray-900 dark:text-white">
						{#if uiStateStore.selectedFolderId}
							{foldersStore.getById(uiStateStore.selectedFolderId)?.name || 'Folder'}
						{:else}
							All Bookmarks
						{/if}
					</h2>
				</div>

				<!-- View Mode Toggles and Theme Toggle -->
				<div class="flex items-center gap-2">
					<button
						onclick={() => uiStateStore.setViewMode('grid')}
						class="p-2 rounded-lg transition-colors {uiStateStore.viewMode === 'grid'
							? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
							: 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}"
						aria-label="Grid view"
					>
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
						</svg>
					</button>
					<button
						onclick={() => uiStateStore.setViewMode('list')}
						class="p-2 rounded-lg transition-colors {uiStateStore.viewMode === 'list'
							? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
							: 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}"
						aria-label="List view"
					>
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
							<path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" />
						</svg>
					</button>
					<div class="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
					<button
						onclick={cycleTheme}
						class="p-2 rounded-lg transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
						aria-label="Toggle theme (current: {uiStateStore.themeMode})"
						title="Theme: {uiStateStore.themeMode}"
					>
						{#if uiStateStore.themeMode === 'light'}
							<!-- Sun icon for light mode -->
							<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
								<path
									d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"
								/>
							</svg>
						{:else if uiStateStore.themeMode === 'dark'}
							<!-- Moon icon for dark mode -->
							<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
								<path
									fill-rule="evenodd"
									d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z"
									clip-rule="evenodd"
								/>
							</svg>
						{:else}
							<!-- Computer/System icon for system mode -->
							<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
								<path
									fill-rule="evenodd"
									d="M2 4.25A2.25 2.25 0 014.25 2h15.5A2.25 2.25 0 0122 4.25v11.5A2.25 2.25 0 0119.75 18h-5.738l.808 2.424a.75.75 0 01-.711.976H9.891a.75.75 0 01-.711-.976l.808-2.424H4.25A2.25 2.25 0 012 15.75V4.25zm2.25-.75a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h15.5a.75.75 0 00.75-.75V4.25a.75.75 0 00-.75-.75H4.25z"
									clip-rule="evenodd"
								/>
							</svg>
						{/if}
					</button>
				</div>
			</div>

			<!-- Search Bar and Filters -->
			<div class="flex items-center gap-3">
				<!-- Search Bar -->
				<div class="flex-1">
					<SearchBar />
				</div>

				<!-- Date Range Filter -->
				<div class="w-48">
					<DateRangeFilter />
				</div>

				<!-- Sort Selector -->
				<div class="w-48">
					<SortSelector />
				</div>

				<!-- Clear Filters Button -->
				{#if uiStateStore.hasActiveFilters()}
					<button
						onclick={() => uiStateStore.clearFilters()}
						class="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
						aria-label="Clear all filters"
						title="Clear all filters"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
						Clear
					</button>
				{/if}

				<!-- Export Menu -->
				<ExportMenu bookmarks={filteredBookmarks} folders={foldersStore.items} />
			</div>
		</header>

		<!-- Content Area -->
		<div class="flex-1 overflow-y-auto p-6">
			{@render children()}
		</div>
	</main>
</div>

<!-- Add Bookmark Modal -->
<Modal open={addBookmarkModalOpen} title="Add Bookmark" onClose={closeAddBookmarkModal}>
	<AddBookmarkForm
		onClose={closeAddBookmarkModal}
		initialUrl={urlParam}
		initialTitle={titleParam}
		initialDescription={descriptionParam}
	/>
</Modal>

<!-- Folder Create/Edit Modal -->
<Modal
	open={folderModalOpen}
	title={folderToEdit ? 'Rename Folder' : 'Create Folder'}
	onClose={closeFolderModal}
>
	<FolderForm folder={folderToEdit} parentId={parentIdForNewFolder} onClose={closeFolderModal} />
</Modal>

<!-- Delete Folder Confirmation Modal -->
{#if deleteFolderModalOpen && folderToDelete}
	<div
		class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
		role="presentation"
	>
		<div
			class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full"
			role="dialog"
			aria-modal="true"
			aria-labelledby="delete-folder-title"
		>
			<!-- Modal Header -->
			<div
				class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"
			>
				<h2 id="delete-folder-title" class="text-lg font-semibold text-gray-900 dark:text-white">
					Delete Folder
				</h2>
				<button
					onclick={closeDeleteFolderModal}
					class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
					aria-label="Close modal"
				>
					<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>
			</div>

			<!-- Modal Content -->
			<div class="px-6 py-4">
				<p class="text-gray-700 dark:text-gray-300 mb-4">
					Are you sure you want to delete the folder "{folderToDelete.name}"?
				</p>
				<p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
					{#if foldersStore.getChildren(folderToDelete.id).length > 0}
						This folder and all its subfolders will be deleted. Bookmarks will be moved to "All
						Bookmarks".
					{:else}
						Bookmarks in this folder will be moved to "All Bookmarks".
					{/if}
				</p>

				<!-- Actions -->
				<div class="flex gap-3 justify-end">
					<button
						type="button"
						onclick={closeDeleteFolderModal}
						class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
					>
						Cancel
					</button>
					<button
						type="button"
						onclick={confirmDeleteFolder}
						class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
					>
						Delete
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Bookmarklet Modal -->
<Modal
	open={bookmarkletModalOpen}
	title="Bookmarklet"
	onClose={() => (bookmarkletModalOpen = false)}
>
	<Bookmarklet />
</Modal>
