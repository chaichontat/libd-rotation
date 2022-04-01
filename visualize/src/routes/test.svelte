<script lang="ts">
	import { browser } from '$app/env';
	import Chart from 'chart.js/auto/auto.js';
	import colormap from 'colormap';
	import pako from 'pako';
	import coords from './coords.json';
	import astro from './astro.json';
	import excit_a from './excit_a.json';
	import by_row from './by_row.json';

	import LRU from 'lru-cache';
	let curr = 0;
	let visium: 'astro' | 'excit_a' = 'astro';

	let myChart: Chart<'scatter', number[], string>;
	let bar: Chart<'bar', number[], string>;

	function genColor(data: number[]): string[] {
		const max = Math.max(...data);
		return data.map((v) => colors[Math.round((v / max) * 255)]);
	}

	function genLRU<T extends unknown[], R>(f: (...args: T) => R) {
		const cache = new LRU({ max: 100 });
		return (...args: T): R => {
			if (cache.has(args)) {
				return cache.get(args);
			} else {
				const r = f(...args);
				cache.set(args, r);
				return r;
			}
		};
	}

	const getColor = genLRU(genColor);

	const colors = colormap({ colormap: 'viridis', nshades: 255, format: 'hex' });

	// console.log(data['columns']);
	const max = Math.max(...astro);
	const normed = astro.map((v) => colors[Math.round((v / 5) * 255)]);

	const maxe = Math.max(...excit_a);
	const exc = excit_a.map((v) => colors[Math.round((v / 5) * 255)]);

	function changeColor(chart: Chart, name: 'astro' | 'excit_a'): void {
		if (!chart) return;
		let color;
		if (visium === 'astro') color = normed;
		if (visium === 'excit_a') color = exc;

		chart.data.datasets[0].backgroundColor = color;
		chart.update();
	}

	if (browser) {
		const ctx = document.getElementById('myChart').getContext('2d');
		myChart = new Chart(ctx, {
			type: 'scatter',
			data: {
				datasets: [
					{
						label: 'Astrocyte',
						data: coords,
						backgroundColor: normed
					}
				]
			},
			options: {
				animation: false,
				aspectRatio: 1,
				scales: {
					x: { ticks: { display: false } },
					y: { ticks: { display: false } }
				},
				plugins: {
					legend: { display: false },
					tooltip: {
						callbacks: {
							label: (tooltipItem) => {
								curr = tooltipItem.dataIndex;
								return curr;
							}
						}
					}
				}
			}
		});

		const ctx2 = document.getElementById('bar').getContext('2d');
		bar = new Chart(ctx2, {
			type: 'bar',
			data: {
				datasets: [
					{
						label: 'Value',
						data: by_row[0],
						backgroundColor: 'white'
					}
				]
			},
			options: {
				scales: {
					x: { color: 'white', grid: { borderColor: 'white' }, ticks: { color: 'white' } },
					y: { min: 0, max: 10, grid: { borderColor: 'white' }, ticks: { color: 'white' } }
				},
				animation: { duration: 200 },
				plugins: {
					tooltip: { enabled: false },
					legend: { display: false }
				}
			}
		});
	}

	$: changeColor(myChart, visium);

	$: if (bar) {
		bar.data.datasets[0].data = by_row[curr];
		bar.update();
	}
</script>

<section class="flex flex-col gap-y-2">
	<div>
		<p class="text-lg text-slate-100">Now showing: <span class="text-white">{visium}</span></p>
		<p class="text-slate-100">Sample: Br6432</p>
	</div>

	<div class="mt-2">
		<button
			type="button"
			class="mr-2 mb-2 rounded-lg border-gray-700 bg-gray-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-700 "
			class:bg-gray-600={visium === 'astro'}
			class:hover:bg-gray-500={visium === 'astro'}
			on:click={() => (visium = 'astro')}
		>
			Astro
		</button>

		<button
			type="button"
			class="mr-2 mb-2 rounded-lg border-gray-700 bg-gray-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-700"
			class:bg-gray-600={visium === 'excit_a'}
			class:hover:bg-gray-500={visium === 'excit_a'}
			on:click={() => (visium = 'excit_a')}
		>
			ExctA
		</button>
	</div>

	<div class="mt-2 flex">
		<div class="chart-container"><canvas id="myChart" /></div>
		<div class="chart-container"><canvas id="bar" /></div>
	</div>
</section>

<style lang="postcss">
	.chart-container {
		@apply relative h-[40vh] w-[40vw];
	}
</style>
