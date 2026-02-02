<script lang="ts">
	import Modal from './Modal.svelte';

	interface Props {
		open: boolean;
		title: string;
		message: string;
		confirmText?: string;
		cancelText?: string;
		onConfirm: () => void;
		onCancel: () => void;
		danger?: boolean;
	}

	let {
		open,
		title,
		message,
		confirmText = 'Confirm',
		cancelText = 'Cancel',
		onConfirm,
		onCancel,
		danger = false
	}: Props = $props();
</script>

<Modal {open} {title} onClose={onCancel}>
	<div class="space-y-4">
		<p class="text-gray-700 dark:text-gray-300">
			{message}
		</p>

		<div class="flex gap-3 justify-end">
			<button
				type="button"
				onclick={onCancel}
				class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
			>
				{cancelText}
			</button>
			<button
				type="button"
				onclick={onConfirm}
				class="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors {danger
					? 'bg-red-600 hover:bg-red-700'
					: 'bg-blue-600 hover:bg-blue-700'}"
			>
				{confirmText}
			</button>
		</div>
	</div>
</Modal>
