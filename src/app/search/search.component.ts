import { Component, HostListener, inject, signal, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { GithubService } from '../services/github.service';
import { GithubRepo } from '../models/github.model';
import { debounceTime, filter, distinctUntilChanged, switchMap, tap, catchError } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import { toObservable, toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-search',
    standalone: true,
    imports: [ReactiveFormsModule, FormsModule, DecimalPipe],
    templateUrl: './search.component.html',
    styleUrl: './search.component.css'
})
export class SearchComponent {
    private readonly githubService = inject(GithubService);

    // Signals for data and UI
    readonly searchControl = new FormControl('', { nonNullable: true });
    readonly sortBy = signal('stars');
    readonly order = signal('desc');
    readonly page = signal(1);
    readonly repos = signal<GithubRepo[]>([]);
    readonly loading = signal(false);
    readonly error = signal<string | null>(null);
    readonly totalCount = signal(0);

    readonly hasMore = computed(() => this.repos().length < this.totalCount());

    private readonly query = toSignal(
        this.searchControl.valueChanges.pipe(
            debounceTime(500),
            distinctUntilChanged(),
            tap(() => this.resetSearch())
        ),
        { initialValue: '' }
    );

    constructor() {
        toObservable(computed(() => ({
            q: this.query(),
            sort: this.sortBy(),
            order: this.order(),
            page: this.page()
        }))).pipe(
            filter(p => p.q.trim().length >= 2),
            tap(() => {
                this.loading.set(true);
                this.error.set(null);
            }),
            switchMap(p => this.githubService.searchRepositories(p.q, p.sort, p.order, p.page).pipe(
                catchError(() => {
                    this.error.set('Failed to fetch repositories.');
                    this.loading.set(false);
                    return of({ items: [], totalCount: 0 });
                })
            )),
            takeUntilDestroyed()
        ).subscribe(response => {
            this.loading.set(false);
            this.totalCount.set(response.totalCount);

            if (this.page() === 1) {
                this.repos.set(response.items);
            } else {
                this.repos.update(prev => [...prev, ...response.items]);
            }
        });
    }

    @HostListener('window:scroll', [])
    onWindowScroll(): void {
        if (this.loading() || !this.hasMore() || this.query().length < 2) return;

        const pos = (window.innerHeight + window.scrollY);
        const max = document.documentElement.scrollHeight;

        if (pos > max - 300) {
            this.page.update(p => p + 1);
        }
    }

    addToDashboard(repo: GithubRepo) {
        this.githubService.addToDashboard(repo);
    }

    isInDashboard(repoId: number): boolean {
        return this.githubService.isInDashboard(repoId);
    }

    resetSearch() {
        this.page.set(1);
        this.repos.set([]);
        this.totalCount.set(0);
    }
}