<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
	import { tagsStore } from '$lib/stores/tags.svelte';
	import { bookmarksStore } from '$lib/stores/bookmarks.svelte';
	import type { Tag } from '$lib/types';

	interface Props {
		/** Display mode: 'cloud' (sized by usage) or 'list' (flat list) */
		mode?: 'cloud' | 'list';
		/** Selected tag IDs for filtering */
		selectedTagIds?: string[];
		/** Callback when a tag is selected/deselected */
		onToggleTag?: (tagId: string) => void;
		/** Callback when a tag edit is requested */
		onEditTag?: (tag: Tag) => void;
		/** Callback when a tag delete is requested */
		onDeleteTag?: (tag: Tag) => void;
	}

	let {
		mode = 'cloud',
		selectedTagIds = [],
		onToggleTag,
		onEditTag,
		onDeleteTag
	}: Props = $props();

	/**
	 * Get all tags sorted alphabetically
	 */
	let tags = $derived(
		[...tagsStore.items].sort((a, b) =>
			a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
		)
	);

	/**
	 * Calculate tag usage counts for sizing in cloud mode
	 */
	let tagUsageCounts = $derived.by(() => {
		const counts = new SvelteMap<string, number>();
		for (const bookmark of bookmarksStore.items) {
			for (const tagId of bookmark.tags) {
				counts.set(tagId, (counts.get(tagId) || 0) + 1);
			}
		}
		return counts;
	});

	/**
	 * Get the maximum usage count for scaling
	 */
	let maxUsageCount = $derived(tagUsageCounts.size > 0 ? Math.max(...tagUsageCounts.values()) : 1);

	/**
	 * Calculate font size for cloud mode based on usage
	 */
	function getCloudSize(tagId: string): string {
		const count = tagUsageCounts.get(tagId) || 0;
		if (count === 0) return 'text-xs';

		const ratio = count / maxUsageCount;
		if (ratio >= 0.8) return 'text-xl';
		if (ratio >= 0.6) return 'text-lg';
		if (ratio >= 0.4) return 'text-base';
		if (ratio >= 0.2) return 'text-sm';
		return 'text-xs';
	}

	/**
	 * Get the usage count for a tag
	 */
	function getUsageCount(tagId: string): number {
		return tagUsageCounts.get(tagId) || 0;
	}

	/**
	 * Check if a tag is selected
	 */
	function isSelected(tagId: string): boolean {
		return selectedTagIds.includes(tagId);
	}

	/**
	 * Handle tag click (toggle selection)
	 */
	function handleTagClick(tagId: string) {
		onToggleTag?.(tagId);
	}

	/**
	 * State to track which tag's actions are shown
	 */
	let hoveredTagId = $state<string | null>(null);
</script>

{#if tags.length === 0}
	<div class="text-sm text-gray-500 dark:text-gray-400 p-4 text-center">No tags yet</div>
{:else if mode === 'cloud'}
	<!-- Tag Cloud View -->
	<div class="flex flex-wrap gap-2 p-4">
		{#each tags as tag (tag.id)}
			<div
				role="group"
				class="relative"
				onmouseenter={() => (hoveredTagId = tag.id)}
				onmouseleave={() => (hoveredTagId = null)}
			>
				<button
					onclick={() => handleTagClick(tag.id)}
					class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all {getCloudSize(
						tag.id
					)} {isSelected(tag.id)
						? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500'
						: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}"
					style={tag.color ? `background-color: ${tag.color}20; color: ${tag.color};` : ''}
					aria-pressed={isSelected(tag.id)}
				>
					<span class="font-medium">{tag.name}</span>
					<span class="text-xs opacity-70">({getUsageCount(tag.id)})</span>
				</button>

				<!-- Action Buttons (shown on hover) -->
				{#if hoveredTagId === tag.id && (onEditTag || onDeleteTag)}
					<div
						class="absolute -top-1 -right-1 flex items-center gap-0.5 bg-white dark:bg-gray-800 rounded-full shadow-md border border-gray-200 dark:border-gray-700"
					>
						<!-- Edit Button -->
						{#if onEditTag}
							<button
								onclick={(e) => {
									e.stopPropagation();
									onEditTag?.(tag);
								}}
								class="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
								aria-label="Edit tag"
								title="Edit tag"
							>
								<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
									<path
										d="M16.862 3.487a2.25 2.25 0 113.182 3.182L7.5 19.213l-4.125.688.688-4.125L16.862 3.487z"
									/>
								</svg>
							</button>
						{/if}

						<!-- Delete Button -->
						{#if onDeleteTag}
							<button
								onclick={(e) => {
									e.stopPropagation();
									onDeleteTag?.(tag);
								}}
								class="p-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
								aria-label="Delete tag"
								title="Delete tag"
							>
								<svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
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
		{/each}
	</div>
{:else}
	<!-- List View -->
	<div class="divide-y divide-gray-200 dark:divide-gray-700">
		{#each tags as tag (tag.id)}
			<div
				role="group"
				class="group"
				onmouseenter={() => (hoveredTagId = tag.id)}
				onmouseleave={() => (hoveredTagId = null)}
			>
				<div
					class="flex items-center justify-between px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
				>
					<button
						onclick={() => handleTagClick(tag.id)}
						class="flex-1 flex items-center gap-2 text-left"
						aria-pressed={isSelected(tag.id)}
					>
						<!-- Tag Color Indicator -->
						<div
							class="w-3 h-3 rounded-full {isSelected(tag.id) ? 'ring-2 ring-blue-500' : ''}"
							style={tag.color ? `background-color: ${tag.color};` : 'background-color: #9ca3af;'}
						></div>

						<!-- Tag Name -->
						<span
							class="font-medium {isSelected(tag.id)
								? 'text-blue-700 dark:text-blue-300'
								: 'text-gray-700 dark:text-gray-300'}"
						>
							{tag.name}
						</span>

						<!-- Usage Count -->
						<span class="text-xs text-gray-500 dark:text-gray-400">
							({getUsageCount(tag.id)})
						</span>
					</button>

					<!-- Action Buttons (shown on hover) -->
					{#if hoveredTagId === tag.id && (onEditTag || onDeleteTag)}
						<div class="flex items-center gap-1 ml-2">
							<!-- Edit Button -->
							{#if onEditTag}
								<button
									onclick={() => onEditTag?.(tag)}
									class="p-1 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
									aria-label="Edit tag"
									title="Edit tag"
								>
									<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
										<path
											d="M16.862 3.487a2.25 2.25 0 113.182 3.182L7.5 19.213l-4.125.688.688-4.125L16.862 3.487z"
										/>
									</svg>
								</button>
							{/if}

							<!-- Delete Button -->
							{#if onDeleteTag}
								<button
									onclick={() => onDeleteTag?.(tag)}
									class="p-1 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
									aria-label="Delete tag"
									title="Delete tag"
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
			</div>
		{/each}
	</div>
{/if}
