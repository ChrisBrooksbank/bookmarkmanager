<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Modal from '$lib/components/Modal.svelte';
	import AddBookmarkForm from '$lib/components/AddBookmarkForm.svelte';
	import { foldersStore } from '$lib/stores/folders.svelte';
	import { tagsStore } from '$lib/stores/tags.svelte';
	import { uiStateStore } from '$lib/stores/uiState.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();

	// Sidebar state
	let sidebarOpen = $state(true);

	// Modal state
	let addBookmarkModalOpen = $state(false);

	// Load stores on mount
	onMount(() => {
		foldersStore.load();
		tagsStore.load();
		uiStateStore.initTheme();
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
				<h2 class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">FOLDERS</h2>
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

					<!-- Folder List -->
					{#if foldersStore.loading}
						<div class="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">Loading folders...</div>
					{:else if foldersStore.items.length === 0}
						<div class="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">No folders yet</div>
					{:else}
						{#each foldersStore.getRootFolders() as folder (folder.id)}
							<button
								onclick={() => selectFolder(folder.id)}
								class="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors {uiStateStore.selectedFolderId ===
								folder.id
									? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
									: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}"
							>
								📁 {folder.name}
							</button>
							<!-- Nested folders (TODO: implement recursive component in Phase 4) -->
						{/each}
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
		<div class="p-4 border-t border-gray-200 dark:border-gray-700">
			<button
				onclick={openAddBookmarkModal}
				class="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
			>
				+ Add Bookmark
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
			<div class="flex items-center justify-between">
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
		</header>

		<!-- Content Area -->
		<div class="flex-1 overflow-y-auto p-6">
			{@render children()}
		</div>
	</main>
</div>

<!-- Add Bookmark Modal -->
<Modal open={addBookmarkModalOpen} title="Add Bookmark" onClose={closeAddBookmarkModal}>
	<AddBookmarkForm onClose={closeAddBookmarkModal} />
</Modal>
