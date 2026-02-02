<script lang="ts">
	/**
	 * Bookmarklet component
	 * Generates a bookmarklet link that allows users to save the current page to BookmarkVault
	 */

	// The app URL - in production this would be the deployed Netlify URL
	// Users can customize this if self-hosting
	let appUrl = $state(
		typeof window !== 'undefined' ? window.location.origin : 'https://your-app.netlify.app'
	);

	/**
	 * Generate the bookmarklet JavaScript code
	 * This code runs on any page and opens BookmarkVault with pre-filled data
	 */
	let bookmarkletCode = $derived.by(() => {
		// The JavaScript code that will run when the bookmarklet is clicked
		const jsCode = `(function(){
	const url = encodeURIComponent(window.location.href);
	const title = encodeURIComponent(document.title);
	const selection = encodeURIComponent(window.getSelection().toString().trim());
	const description = selection || encodeURIComponent(
		document.querySelector('meta[name="description"]')?.content ||
		document.querySelector('meta[property="og:description"]')?.content ||
		''
	);
	const appUrl = '${appUrl}';
	const targetUrl = appUrl + '?url=' + url + '&title=' + title + '&description=' + description;
	window.open(targetUrl, '_blank', 'width=600,height=700,menubar=no,toolbar=no,location=no');
})();`;

		// Return as a javascript: URL (bookmarklet format)
		return `javascript:${encodeURIComponent(jsCode)}`;
	});

	let copied = $state(false);
	let showInstructions = $state(false);

	/**
	 * Copy bookmarklet code to clipboard
	 */
	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(bookmarkletCode);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch (err) {
			console.error('Failed to copy:', err);
		}
	}
</script>

<div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
	<div class="flex items-start justify-between mb-4">
		<div>
			<h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
				Save to BookmarkVault
			</h2>
			<p class="text-sm text-gray-600 dark:text-gray-400">
				Drag this button to your bookmarks bar, or right-click and add to bookmarks
			</p>
		</div>
		<button
			onclick={() => (showInstructions = !showInstructions)}
			class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
			aria-label="Toggle instructions"
		>
			{showInstructions ? 'Hide' : 'Show'} instructions
		</button>
	</div>

	<!-- The bookmarklet link -->
	<div class="mb-4">
		<a
			href={bookmarkletCode}
			onclick={(e) => {
				e.preventDefault();
				alert(
					'To use this bookmarklet:\n\n1. Drag this button to your bookmarks bar\n2. Or right-click and select "Bookmark This Link"\n3. Click the bookmark when viewing any page to save it to BookmarkVault'
				);
			}}
			class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-md hover:shadow-lg cursor-move"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
				/>
			</svg>
			Save to BookmarkVault
		</a>
	</div>

	<!-- Copy to clipboard button -->
	<div class="mb-4">
		<button
			onclick={copyToClipboard}
			class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
		>
			{#if copied}
				<svg
					class="w-4 h-4 text-green-600 dark:text-green-400"
					fill="currentColor"
					viewBox="0 0 20 20"
				>
					<path
						fill-rule="evenodd"
						d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
						clip-rule="evenodd"
					/>
				</svg>
				Copied!
			{:else}
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
					/>
				</svg>
				Copy bookmarklet code
			{/if}
		</button>
	</div>

	<!-- Instructions (collapsible) -->
	{#if showInstructions}
		<div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
			<h3 class="font-semibold text-gray-900 dark:text-white mb-3">How to install:</h3>
			<ol class="space-y-3 text-sm text-gray-700 dark:text-gray-300">
				<li class="flex gap-3">
					<span class="font-semibold text-blue-600 dark:text-blue-400">1.</span>
					<div>
						<strong>Drag and drop:</strong> Drag the "Save to BookmarkVault" button above to your browser's
						bookmarks bar (press Ctrl+Shift+B or Cmd+Shift+B to show it if hidden)
					</div>
				</li>
				<li class="flex gap-3">
					<span class="font-semibold text-blue-600 dark:text-blue-400">2.</span>
					<div>
						<strong>Or right-click:</strong> Right-click the button and select "Bookmark This Link" or
						"Add to Bookmarks"
					</div>
				</li>
				<li class="flex gap-3">
					<span class="font-semibold text-blue-600 dark:text-blue-400">3.</span>
					<div>
						<strong>Or manual:</strong> Create a new bookmark manually and paste the copied code as the
						URL
					</div>
				</li>
			</ol>

			<h3 class="font-semibold text-gray-900 dark:text-white mb-3 mt-6">How to use:</h3>
			<ol class="space-y-3 text-sm text-gray-700 dark:text-gray-300">
				<li class="flex gap-3">
					<span class="font-semibold text-blue-600 dark:text-blue-400">1.</span>
					<div>Navigate to any webpage you want to save</div>
				</li>
				<li class="flex gap-3">
					<span class="font-semibold text-blue-600 dark:text-blue-400">2.</span>
					<div>Optionally, select text on the page to use as the bookmark description</div>
				</li>
				<li class="flex gap-3">
					<span class="font-semibold text-blue-600 dark:text-blue-400">3.</span>
					<div>Click the "Save to BookmarkVault" bookmark in your bookmarks bar</div>
				</li>
				<li class="flex gap-3">
					<span class="font-semibold text-blue-600 dark:text-blue-400">4.</span>
					<div>
						A new window will open with the bookmark form pre-filled with the page URL, title, and
						description
					</div>
				</li>
			</ol>

			<!-- Custom app URL (for self-hosting) -->
			<div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
				<h3 class="font-semibold text-gray-900 dark:text-white mb-2">Advanced: Custom app URL</h3>
				<p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
					If you're self-hosting BookmarkVault, update the app URL below:
				</p>
				<input
					type="url"
					bind:value={appUrl}
					placeholder="https://your-app.netlify.app"
					class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
				/>
				<p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
					The bookmarklet will automatically update to use this URL
				</p>
			</div>
		</div>
	{/if}
</div>
