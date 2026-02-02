<script lang="ts">
	import { uiStateStore, type DateRange } from '$lib/stores/uiState.svelte';

	interface DateRangeOption {
		value: DateRange;
		label: string;
	}

	const options: DateRangeOption[] = [
		{ value: 'all', label: 'All Time' },
		{ value: 'last-7-days', label: 'Last 7 Days' },
		{ value: 'last-30-days', label: 'Last 30 Days' },
		{ value: 'last-90-days', label: 'Last 90 Days' }
	];

	/**
	 * Handle date range selection change
	 */
	function handleChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		uiStateStore.setDateRange(target.value as DateRange);
	}
</script>

<div class="relative">
	<label for="date-range-filter" class="sr-only"> Filter by date range </label>
	<select
		id="date-range-filter"
		value={uiStateStore.dateRange}
		onchange={handleChange}
		class="block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors cursor-pointer"
		aria-label="Filter bookmarks by date range"
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
