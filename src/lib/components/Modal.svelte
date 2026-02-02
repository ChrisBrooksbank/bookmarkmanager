<script lang="ts">
	import { type Snippet } from 'svelte';

	interface Props {
		open: boolean;
		title: string;
		onClose: () => void;
		children: Snippet;
	}

	let { open, title, onClose, children }: Props = $props();

	/**
	 * Handle escape key to close modal
	 */
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			onClose();
		}
	}

	/**
	 * Handle backdrop click to close modal
	 */
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
		onclick={handleBackdropClick}
		role="presentation"
	>
		<div
			class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
		>
			<!-- Modal Header -->
			<div
				class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between"
			>
				<h2 id="modal-title" class="text-lg font-semibold text-gray-900 dark:text-white">
					{title}
				</h2>
				<button
					onclick={onClose}
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
				{@render children()}
			</div>
		</div>
	</div>
{/if}
