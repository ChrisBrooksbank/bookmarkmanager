<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { foldersStore } from '$lib/stores/folders.svelte';
	import { tagsStore } from '$lib/stores/tags.svelte';
	import { uiStateStore } from '$lib/stores/uiState.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();

	// Sidebar state
	let sidebarOpen = $state(true);

	// Load stores on mount
	onMount(() => {
		foldersStore.load();
		tagsStore.load();
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

				<!-- View Mode Toggles -->
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
				</div>
			</div>
		</header>

		<!-- Content Area -->
		<div class="flex-1 overflow-y-auto p-6">
			{@render children()}
		</div>
	</main>
</div>
