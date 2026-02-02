<script lang="ts">
	import { uiStateStore, type SortBy } from '$lib/stores/uiState.svelte';

	interface SortOption {
		value: SortBy;
		label: string;
	}

	const options: SortOption[] = [
		{ value: 'newest', label: 'Newest First' },
		{ value: 'oldest', label: 'Oldest First' },
		{ value: 'alphabetical', label: 'Alphabetical' },
		{ value: 'recently-updated', label: 'Recently Updated' }
	];

	/**
	 * Handle sort selection change
	 */
	function handleChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		uiStateStore.setSortBy(target.value as SortBy);
	}
</script>

<div class="relative">
	<label for="sort-selector" class="sr-only"> Sort bookmarks </label>
	<select
		id="sort-selector"
		value={uiStateStore.sortBy}
		onchange={handleChange}
		class="block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors cursor-pointer"
		aria-label="Sort bookmarks"
	>
		{#each options as option (option.value)}
			<option value={option.value}>
				{option.label}
			</option>
		{/each}
	</select>
	<!-- Dropdown Icon -->
	<div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
		<svg class="w-4 h-4 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20">
			<path
				fill-rule="evenodd"
				d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
				clip-rule="evenodd"
			/>
		</svg>
	</div>
</div>
