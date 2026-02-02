<script lang="ts">
	import { uiStateStore } from '$lib/stores/uiState.svelte';
	import { browser } from '$app/environment';

	interface Props {
		placeholder?: string;
		debounceMs?: number;
	}

	let { placeholder = 'Search bookmarks...', debounceMs = 300 }: Props = $props();

	let inputElement: HTMLInputElement;
	let inputValue = $state(uiStateStore.searchQuery);
	let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

	/**
	 * Update the search query in the store with debouncing
	 */
	function updateSearchQuery(value: string) {
		// Clear existing timeout
		if (debounceTimeout) {
			clearTimeout(debounceTimeout);
		}

		// Update input value immediately for responsive UI
		inputValue = value;

		// Debounce the store update
		debounceTimeout = setTimeout(() => {
			uiStateStore.setSearchQuery(value);
		}, debounceMs);
	}

	/**
	 * Clear the search query
	 */
	function clearSearch() {
		inputValue = '';
		uiStateStore.setSearchQuery('');
		inputElement?.focus();
	}

	/**
	 * Handle keyboard shortcuts (Ctrl/Cmd + K)
	 */
	function handleGlobalKeydown(event: KeyboardEvent) {
		// Ctrl/Cmd + K to focus search
		if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
			event.preventDefault();
			inputElement?.focus();
		}

		// Escape to clear search (when focused)
		if (event.key === 'Escape' && document.activeElement === inputElement) {
			clearSearch();
		}
	}

	/**
	 * Initialize keyboard shortcuts using $effect
	 */
	$effect(() => {
		if (!browser) return;

		window.addEventListener('keydown', handleGlobalKeydown);

		return () => {
			window.removeEventListener('keydown', handleGlobalKeydown);
			if (debounceTimeout) {
				clearTimeout(debounceTimeout);
			}
		};
	});
</script>

<div class="relative w-full">
	<!-- Search Icon -->
	<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
		<svg
			class="h-5 w-5 text-gray-400 dark:text-gray-500"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
			/>
		</svg>
	</div>

	<!-- Search Input -->
	<input
		bind:this={inputElement}
		type="text"
		value={inputValue}
		oninput={(e) => updateSearchQuery(e.currentTarget.value)}
		{placeholder}
		class="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
		aria-label="Search bookmarks"
	/>

	<!-- Clear Button -->
	{#if inputValue}
		<button
			type="button"
			onclick={clearSearch}
			class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
			aria-label="Clear search"
		>
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M6 18L18 6M6 6l12 12"
				/>
			</svg>
		</button>
	{:else}
		<!-- Keyboard Hint -->
		<div
			class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs text-gray-400 dark:text-gray-500"
		>
			<kbd
				class="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded"
			>
				{#if typeof navigator !== 'undefined' && navigator.platform.indexOf('Mac') > -1}
					⌘K
				{:else}
					Ctrl+K
				{/if}
			</kbd>
		</div>
	{/if}
</div>
