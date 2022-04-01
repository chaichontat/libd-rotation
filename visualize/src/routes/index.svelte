<script>
	import Test from './test.svelte';
</script>

<h1 class="order-1 mb-4 text-3xl font-bold text-slate-100 sm:text-5xl sm:leading-none">
	Visium <span class="fancy">IF</span>
</h1>

<Test />

<style lang="postcss">
	.fancy {
		@apply bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500  bg-clip-text text-transparent;
	}
</style>
