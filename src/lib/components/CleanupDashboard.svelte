<script lang="ts">
	import { bookmarksStore } from '$lib/stores/bookmarks.svelte';
	import { tagsStore } from '$lib/stores/tags.svelte';
	import { uiStateStore } from '$lib/stores/uiState.svelte';
	import type { Bookmark, Tag } from '$lib/types';
	import {
		checkBookmarkHealth,
		getDomain,
		getDomainClusters,
		getDuplicateGroups,
		getStaleCandidates,
		getSuggestedTagGroups,
		normalizeUrlForComparison,
		type LinkHealthResult,
		type LinkHealthStatus
	} from '$lib/utils/bookmarkAudit';

	type CleanupTab = 'health' | 'duplicates' | 'domains' | 'tags' | 'review' | 'rules';

	const HEALTH_LABELS: Record<LinkHealthStatus, string> = {
		unchecked: 'Unchecked',
		ok: 'OK',
		redirected: 'Redirected',
		broken: 'Broken',
		timeout: 'Timeout',
		unknown: 'Unknown'
	};

	let activeTab = $state<CleanupTab>('health');
	let isCheckingLinks = $state(false);
	let checkedCount = $state(0);
	let healthResults = $state<Record<string, LinkHealthResult>>({});
	let reviewIndex = $state(0);

	let healthByBookmarkId = $derived(new Map(Object.entries(healthResults)));
	let duplicateGroups = $derived(getDuplicateGroups(bookmarksStore.items));
	let domainClusters = $derived(getDomainClusters(bookmarksStore.items));
	let suggestedTagGroups = $derived(getSuggestedTagGroups(bookmarksStore.items, tagsStore.items));
	let staleCandidates = $derived(getStaleCandidates(bookmarksStore.items, healthByBookmarkId));
	let reviewBookmarks = $derived(staleCandidates.map((candidate) => candidate.bookmark));
	let reviewBookmark = $derived(reviewBookmarks[reviewIndex] ?? null);
	let brokenBookmarkIds = $derived(
		Object.values(healthResults)
			.filter((result) => result.status === 'broken' || result.status === 'timeout')
			.map((result) => result.bookmarkId)
	);
	let normalizedBookmarks = $derived(
		bookmarksStore.items.filter(
			(bookmark) => normalizeUrlForComparison(bookmark.url) !== bookmark.url
		)
	);

	function setTab(tab: CleanupTab) {
		activeTab = tab;
	}

	function selectBookmarks(bookmarkIds: string[]) {
		uiStateStore.selectBookmarks(bookmarkIds);
	}

	function getTagByName(name: string): Tag | undefined {
		return tagsStore.items.find((tag) => tag.name.toLowerCase() === name.toLowerCase());
	}

	async function ensureTag(name: string): Promise<Tag> {
		const existing = getTagByName(name);
		if (existing) return existing;

		const tag: Tag = { id: crypto.randomUUID(), name };
		await tagsStore.add(tag);
		return tag;
	}

	async function runLinkCheck() {
		if (isCheckingLinks) return;
		isCheckingLinks = true;
		checkedCount = 0;

		for (const bookmark of bookmarksStore.items) {
			const result = await checkBookmarkHealth(bookmark);
			healthResults = { ...healthResults, [bookmark.id]: result };
			checkedCount += 1;
		}

		isCheckingLinks = false;
	}

	async function applySuggestedTag(tagName: string, bookmarkIds: string[]) {
		const tag = await ensureTag(tagName);
		await bookmarksStore.bulkAddTags(bookmarkIds, [tag.id]);
	}

	async function deleteDuplicateExtras(bookmarks: Bookmark[]) {
		const sorted = [...bookmarks].sort((a, b) => b.updatedAt - a.updatedAt);
		const duplicateIds = sorted.slice(1).map((bookmark) => bookmark.id);
		if (
			typeof window !== 'undefined' &&
			!window.confirm(
				`Delete ${duplicateIds.length} duplicate bookmark${duplicateIds.length === 1 ? '' : 's'}?`
			)
		) {
			return;
		}

		await bookmarksStore.bulkDelete(duplicateIds);
	}

	async function archiveBookmark(bookmark: Bookmark) {
		const tag = await ensureTag('archive');
		await bookmarksStore.bulkAddTags([bookmark.id], [tag.id]);
		nextReview();
	}

	async function deleteReviewBookmark(bookmark: Bookmark) {
		await bookmarksStore.remove(bookmark.id);
		nextReview();
	}

	function keepReviewBookmark() {
		nextReview();
	}

	function nextReview() {
		reviewIndex = Math.min(reviewIndex + 1, Math.max(0, reviewBookmarks.length - 1));
	}

	async function normalizeTrackingUrls() {
		const updated = normalizedBookmarks.map((bookmark) => ({
			...bookmark,
			url: normalizeUrlForComparison(bookmark.url),
			updatedAt: Date.now()
		}));
		await bookmarksStore.updateMany(updated);
	}

	function countHealth(status: LinkHealthStatus): number {
		return Object.values(healthResults).filter((result) => result.status === status).length;
	}

	function formatDomainCount(clusterSize: number): string {
		return `${clusterSize} bookmark${clusterSize === 1 ? '' : 's'}`;
	}
</script>

<section
	class="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
>
	<div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
		<div class="flex items-center justify-between gap-3">
			<div>
				<h3 class="text-base font-semibold text-gray-900 dark:text-white">Cleanup</h3>
				<p class="text-sm text-gray-600 dark:text-gray-400">
					{bookmarksStore.items.length} bookmarks, {duplicateGroups.length} duplicate groups,
					{staleCandidates.length} review candidates
				</p>
			</div>
			<button
				onclick={runLinkCheck}
				disabled={isCheckingLinks || bookmarksStore.items.length === 0}
				class="px-3 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 rounded-lg transition-colors"
			>
				{isCheckingLinks
					? `Checking ${checkedCount}/${bookmarksStore.items.length}`
					: 'Check Links'}
			</button>
		</div>
	</div>

	<div class="flex flex-wrap gap-2 p-3 border-b border-gray-200 dark:border-gray-700">
		{#each [['health', 'Health'], ['duplicates', 'Duplicates'], ['domains', 'Domains'], ['tags', 'Tags'], ['review', 'Review'], ['rules', 'Rules']] as [tab, label] (tab)}
			<button
				onclick={() => setTab(tab as CleanupTab)}
				class="px-3 py-1.5 text-sm rounded-md transition-colors {activeTab === tab
					? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
					: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}"
			>
				{label}
			</button>
		{/each}
	</div>

	<div class="p-4">
		{#if activeTab === 'health'}
			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
				{#each ['ok', 'redirected', 'broken', 'timeout', 'unknown'] as status (status)}
					<button
						onclick={() =>
							selectBookmarks(
								Object.values(healthResults)
									.filter((result) => result.status === status)
									.map((result) => result.bookmarkId)
							)}
						class="text-left border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700"
					>
						<div class="text-xs uppercase text-gray-500 dark:text-gray-400">
							{HEALTH_LABELS[status as LinkHealthStatus]}
						</div>
						<div class="text-2xl font-semibold text-gray-900 dark:text-white">
							{countHealth(status as LinkHealthStatus)}
						</div>
					</button>
				{/each}
			</div>
			{#if brokenBookmarkIds.length > 0}
				<div class="mt-4 flex gap-2">
					<button
						onclick={() => selectBookmarks(brokenBookmarkIds)}
						class="px-3 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg"
					>
						Select broken and timed out
					</button>
				</div>
			{/if}
		{:else if activeTab === 'duplicates'}
			{#if duplicateGroups.length === 0}
				<div class="text-sm text-gray-500 dark:text-gray-400">No duplicate groups found.</div>
			{:else}
				<div class="space-y-3">
					{#each duplicateGroups.slice(0, 12) as group (group.key)}
						<div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
							<div class="flex items-center justify-between gap-3 mb-2">
								<div>
									<div class="font-medium text-gray-900 dark:text-white">
										{group.bookmarks.length} similar bookmarks
									</div>
									<div class="text-sm text-gray-500 dark:text-gray-400">{group.reason}</div>
								</div>
								<div class="flex gap-2">
									<button
										onclick={() => selectBookmarks(group.bookmarks.map((bookmark) => bookmark.id))}
										class="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded"
									>
										Select
									</button>
									<button
										onclick={() => deleteDuplicateExtras(group.bookmarks)}
										class="px-3 py-1.5 text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded"
									>
										Keep newest
									</button>
								</div>
							</div>
							<div class="space-y-1">
								{#each group.bookmarks as bookmark (bookmark.id)}
									<a
										href={bookmark.url}
										target="_blank"
										rel="noopener noreferrer"
										class="block text-sm text-blue-700 dark:text-blue-300 truncate"
									>
										{bookmark.title}
									</a>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{:else if activeTab === 'domains'}
			<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
				{#each domainClusters.slice(0, 30) as cluster (cluster.domain)}
					<button
						onclick={() => selectBookmarks(cluster.bookmarks.map((bookmark) => bookmark.id))}
						class="text-left border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700"
					>
						<div class="font-medium text-gray-900 dark:text-white truncate">{cluster.domain}</div>
						<div class="text-sm text-gray-500 dark:text-gray-400">
							{formatDomainCount(cluster.bookmarks.length)}
						</div>
					</button>
				{/each}
			</div>
		{:else if activeTab === 'tags'}
			{#if suggestedTagGroups.length === 0}
				<div class="text-sm text-gray-500 dark:text-gray-400">No tag suggestions right now.</div>
			{:else}
				<div class="grid gap-3 md:grid-cols-2">
					{#each suggestedTagGroups as suggestion (suggestion.tagName)}
						<div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
							<div class="flex items-center justify-between gap-3">
								<div>
									<div class="font-medium text-gray-900 dark:text-white">#{suggestion.tagName}</div>
									<div class="text-sm text-gray-500 dark:text-gray-400">
										{suggestion.bookmarkIds.length} matches, {suggestion.reason}
									</div>
								</div>
								<button
									onclick={() => applySuggestedTag(suggestion.tagName, suggestion.bookmarkIds)}
									class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded"
								>
									Apply
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{:else if activeTab === 'review'}
			{#if !reviewBookmark}
				<div class="text-sm text-gray-500 dark:text-gray-400">Nothing needs review right now.</div>
			{:else}
				<div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
					<div class="text-sm text-gray-500 dark:text-gray-400 mb-2">
						{Math.min(reviewIndex + 1, reviewBookmarks.length)} of {reviewBookmarks.length}
					</div>
					<a
						href={reviewBookmark.url}
						target="_blank"
						rel="noopener noreferrer"
						class="text-lg font-semibold text-blue-700 dark:text-blue-300"
					>
						{reviewBookmark.title}
					</a>
					<div class="mt-1 text-sm text-gray-600 dark:text-gray-400">
						{getDomain(reviewBookmark.url)}
					</div>
					<div class="mt-3 flex flex-wrap gap-2">
						{#each staleCandidates.find((candidate) => candidate.bookmark.id === reviewBookmark?.id)?.reasons ?? [] as reason (reason)}
							<span
								class="px-2 py-1 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded"
							>
								{reason}
							</span>
						{/each}
					</div>
					<div class="mt-4 flex flex-wrap gap-2">
						<button
							onclick={keepReviewBookmark}
							class="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg"
						>
							Keep
						</button>
						<button
							onclick={() => archiveBookmark(reviewBookmark)}
							class="px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg"
						>
							Archive
						</button>
						<button
							onclick={() => deleteReviewBookmark(reviewBookmark)}
							class="px-3 py-2 text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg"
						>
							Delete
						</button>
					</div>
				</div>
			{/if}
		{:else}
			<div class="space-y-3">
				<div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
					<div class="flex items-center justify-between gap-3">
						<div>
							<div class="font-medium text-gray-900 dark:text-white">
								Remove tracking parameters
							</div>
							<div class="text-sm text-gray-500 dark:text-gray-400">
								{normalizedBookmarks.length} URLs can be cleaned.
							</div>
						</div>
						<button
							onclick={normalizeTrackingUrls}
							disabled={normalizedBookmarks.length === 0}
							class="px-3 py-1.5 text-sm bg-blue-600 disabled:bg-gray-400 text-white rounded"
						>
							Clean URLs
						</button>
					</div>
				</div>
				<div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
					<div class="flex items-center justify-between gap-3">
						<div>
							<div class="font-medium text-gray-900 dark:text-white">
								Select likely stale bookmarks
							</div>
							<div class="text-sm text-gray-500 dark:text-gray-400">
								Use the existing bulk toolbar to move, tag, or delete them.
							</div>
						</div>
						<button
							onclick={() =>
								selectBookmarks(staleCandidates.map((candidate) => candidate.bookmark.id))}
							class="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
						>
							Select {staleCandidates.length}
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
</section>
