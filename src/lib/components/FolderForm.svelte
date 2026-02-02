<script lang="ts">
	import { foldersStore } from '$lib/stores/folders.svelte';
	import type { Folder } from '$lib/types';

	interface Props {
		/** Folder to edit (null for create mode) */
		folder?: Folder | null;
		/** Parent folder ID for new folders */
		parentId?: string | null;
		/** Callback when form is closed */
		onClose?: () => void;
	}

	let { folder = null, parentId = null, onClose }: Props = $props();

	// Form state
	let name = $state(folder?.name || '');
	let submitting = $state(false);
	let error = $state('');

	// Determine if we're in edit mode
	let isEditMode = $derived(folder !== null);

	/**
	 * Validate folder name
	 */
	function validateName(folderName: string): boolean {
		const trimmed = folderName.trim();

		if (!trimmed) {
			error = 'Folder name is required';
			return false;
		}

		if (trimmed.length > 100) {
			error = 'Folder name must be 100 characters or less';
			return false;
		}

		// Check for duplicate names at the same level
		const currentParentId = isEditMode && folder ? (folder.parentId ?? null) : (parentId ?? null);
		const siblings = foldersStore.getByParentId(currentParentId);
		const duplicate = siblings.find(
			(f) => f.name.toLowerCase() === trimmed.toLowerCase() && f.id !== folder?.id
		);

		if (duplicate) {
			error = 'A folder with this name already exists at this level';
			return false;
		}

		error = '';
		return true;
	}

	/**
	 * Handle form submission
	 */
	async function handleSubmit() {
		if (!validateName(name)) {
			return;
		}

		submitting = true;
		error = '';

		try {
			const trimmedName = name.trim();

			if (isEditMode && folder) {
				// Update existing folder
				const updated: Folder = {
					...folder,
					name: trimmedName
				};
				await foldersStore.update(updated);
			} else {
				// Create new folder
				const newFolder: Folder = {
					id: crypto.randomUUID(),
					name: trimmedName,
					parentId: parentId || null,
					createdAt: Date.now()
				};
				await foldersStore.add(newFolder);
			}

			// Reset form and close
			name = '';
			error = '';
			onClose?.();
		} catch (err) {
			console.error('Failed to save folder:', err);
			error = 'Failed to save folder. Please try again.';
		} finally {
			submitting = false;
		}
	}

	/**
	 * Clear error when user starts typing
	 */
	function handleInput() {
		if (error) {
			error = '';
		}
	}
</script>

<form
	onsubmit={(e) => {
		e.preventDefault();
		handleSubmit();
	}}
	class="space-y-4"
>
	<!-- Folder Name Input -->
	<div>
		<label
			for="folder-name"
			class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
		>
			Folder Name *
		</label>
		<input
			type="text"
			id="folder-name"
			bind:value={name}
			oninput={handleInput}
			placeholder="Enter folder name"
			class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent {error
				? 'border-red-500 dark:border-red-500'
				: 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
			disabled={submitting}
			required
		/>
		{#if error}
			<p class="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
		{/if}
	</div>

	<!-- Form Actions -->
	<div class="flex gap-3 justify-end">
		{#if onClose}
			<button
				type="button"
				onclick={onClose}
				disabled={submitting}
				class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				Cancel
			</button>
		{/if}
		<button
			type="submit"
			disabled={submitting || !name.trim()}
			class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
		>
			{submitting ? (isEditMode ? 'Saving...' : 'Creating...') : isEditMode ? 'Save' : 'Create'}
		</button>
	</div>
</form>
