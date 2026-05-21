import { Component, inject, signal, computed, effect, ElementRef, viewChild, OnDestroy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GithubService } from '../services/github.service';
import { DashboardRepo, GithubRepo } from '../models/github.model';
import { Chart, registerables } from 'chart.js';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
Chart.register(...registerables);

export type MetricType = 'stars' | 'forks' | 'openIssues' | 'watchers';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [RouterLink, FormsModule, DecimalPipe],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnDestroy {
    private readonly githubService = inject(GithubService);
    readonly repoChartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('repoChart');

    // Signals
    readonly dashboardRepos = signal<DashboardRepo[]>([]);
    readonly selectedMetric = signal<MetricType>('stars');
    readonly activeRepoIds = signal<Set<number>>(new Set());
    readonly loading = signal(false);
    readonly error = signal<string | null>(null);

    // Metrics
    readonly metrics: { label: string, value: MetricType }[] = [
        { label: 'Stars', value: 'stars' },
        { label: 'Forks', value: 'forks' },
        { label: 'Open Issues', value: 'openIssues' },
        { label: 'Watchers', value: 'watchers' }
    ];

    private chart: Chart | undefined;

    readonly filteredRepos = computed(() => {
        return this.dashboardRepos().filter(repo => this.activeRepoIds().has(repo.id));
    });


    constructor() {
        toObservable(this.githubService.dashboardRepos).pipe(
            tap(() => this.loading.set(true)),
            switchMap((stored): Observable<(GithubRepo | null)[]> => {
                if (!stored || stored.length === 0) return of([]);
                const requests = stored.map(repo =>
                    this.githubService.getRepositoryDetails(repo.fullName).pipe(
                        catchError(() => of(null))
                    )
                );
                return forkJoin(requests);
            }),
            map((details): DashboardRepo[] => {
                return details
                    .filter((data): data is GithubRepo => data !== null)
                    .map(data => ({
                        id: data.id,
                        name: data.name,
                        fullName: data.fullName,
                        url: data.url,
                        stars: data.stars,
                        forks: data.forks,
                        openIssues: data.openIssues,
                        watchers: data.watchers,
                        language: data.language ?? undefined
                    }));
            }),
            takeUntilDestroyed()
        ).subscribe({
            next: (repos) => {
                this.dashboardRepos.set(repos);
                this.loading.set(false);
                if (this.activeRepoIds().size === 0 && repos.length > 0) {
                    this.activeRepoIds.set(new Set(repos.map(r => r.id)));
                }
            },
            error: () => {
                this.error.set('Failed to refresh dashboard data.');
                this.loading.set(false);
            }
        });

        effect(() => {
            const repos = this.filteredRepos();
            const metric = this.selectedMetric();
            const canvas = this.repoChartCanvas();

            if (!canvas || repos.length === 0) return;

            if (!this.chart) {
                this.initChart(canvas.nativeElement, repos, metric);
            } else {
                this.updateChart(repos, metric);
            }
        });
    }

    private initChart(canvas: HTMLCanvasElement, repos: DashboardRepo[], metric: MetricType): void {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: repos.map(r => r.name),
                datasets: [{
                    label: this.metrics.find(m => m.value === metric)?.label || '',
                    data: repos.map(r => r[metric] as number),
                    backgroundColor: '#6FCF97',
                    borderColor: '#1F6F5F',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } },
                plugins: { legend: { display: false } }
            }
        });
    }

    private updateChart(repos: DashboardRepo[], metric: MetricType): void {
        if (!this.chart) return;
        this.chart.data.labels = repos.map(r => r.name);
        this.chart.data.datasets[0].data = repos.map(r => r[metric] as number);
        this.chart.data.datasets[0].label = this.metrics.find(m => m.value === metric)?.label || '';
        this.chart.update();
    }

    toggleRepo(repoId: number): void {
        this.activeRepoIds.update(ids => {
            const newIds = new Set(ids);
            newIds.has(repoId) ? newIds.delete(repoId) : newIds.add(repoId);
            return newIds;
        });
    }

    removeRepo(repoId: number): void {
        this.githubService.removeFromDashboard(repoId);
    }



    ngOnDestroy(): void {
        this.chart?.destroy();
    }
}