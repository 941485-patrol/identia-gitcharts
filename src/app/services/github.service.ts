import { Injectable, inject, signal, effect } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
    GithubSearchResponseDto,
    GithubRepoDto,
    GithubRepo,
    DashboardRepo,
    GithubSearchResponse
} from '../models/github.model';

@Injectable({
    providedIn: 'root'
})
export class GithubService {
    private readonly http = inject(HttpClient);

    private readonly SEARCH_URL = 'https://api.github.com/search/repositories';
    private readonly REPO_URL = 'https://api.github.com/repos';
    private readonly STORAGE_KEY = 'github_dashboard_repos';
    private readonly _dashboardRepos = signal<DashboardRepo[]>(this.getStoredRepos());
    readonly dashboardRepos = this._dashboardRepos.asReadonly();

    constructor() {
        effect(() => {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._dashboardRepos()));
        });
    }

    searchRepositories(
        query: string,
        sort = 'stars',
        order = 'desc',
        page = 1,
        perPage = 30
    ): Observable<GithubSearchResponse> {
        const params = new HttpParams({
            fromObject: {
                q: query,
                sort,
                order,
                page: page.toString(),
                per_page: perPage.toString()
            }
        });

        return this.http.get<GithubSearchResponseDto>(this.SEARCH_URL, { params }).pipe(
            map(response => ({
                totalCount: response.total_count,
                items: response.items.map(dto => this.mapRepoDtoToModel(dto))
            }))
        );
    }

    getRepositoryDetails(fullName: string): Observable<GithubRepo> {
        return this.http.get<GithubRepoDto>(`${this.REPO_URL}/${fullName}`).pipe(
            map(dto => this.mapRepoDtoToModel(dto))
        );
    }

    private getStoredRepos(): DashboardRepo[] {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    addToDashboard(repo: GithubRepo): void {
        this._dashboardRepos.update(current => {
            if (current.some(r => r.id === repo.id)) return current;

            const newEntry: DashboardRepo = {
                id: repo.id,
                name: repo.name,
                fullName: repo.fullName,
                url: repo.url,
                stars: repo.stars,
                forks: repo.forks,
                openIssues: repo.openIssues,
                watchers: repo.watchers,
                language: repo.language ?? undefined
            };
            return [...current, newEntry];
        });
    }

    removeFromDashboard(repoId: number): void {
        this._dashboardRepos.update(current => current.filter(r => r.id !== repoId));
    }

    isInDashboard(repoId: number): boolean {
        return this._dashboardRepos().some(r => r.id === repoId);
    }

    private mapRepoDtoToModel(dto: GithubRepoDto): GithubRepo {
        return {
            id: dto.id,
            name: dto.name,
            fullName: dto.full_name,
            description: dto.description,
            stars: dto.stargazers_count,
            forks: dto.forks_count,
            openIssues: dto.open_issues_count,
            watchers: dto.subscribers_count || 0,
            language: dto.language,
            url: dto.html_url
        };
    }
}