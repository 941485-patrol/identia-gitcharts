export interface GithubRepoDto {
  readonly id: number;
  readonly name: string;
  readonly full_name: string;
  readonly description: string;
  readonly stargazers_count: number;
  readonly forks_count: number;
  readonly open_issues_count: number;
  readonly subscribers_count?: number;
  readonly language: string;
  readonly html_url: string;
}

export interface GithubSearchResponseDto {
  readonly total_count: number;
  readonly incomplete_results: boolean;
  readonly items: GithubRepoDto[];
}

export interface GithubRepo {
  readonly id: number;
  readonly name: string;
  readonly fullName: string;
  readonly description: string;
  readonly stars: number;
  readonly forks: number;
  readonly openIssues: number;
  readonly watchers: number;
  readonly language: string;
  readonly url: string;
}

export interface DashboardRepo {
  readonly id: number;
  readonly name: string;
  readonly fullName: string;
  readonly url: string;
  readonly stars: number;
  readonly forks: number;
  readonly openIssues: number;
  readonly watchers: number;
  readonly language?: string;
}

export interface GithubSearchResponse {
  readonly totalCount: number;
  readonly items: GithubRepo[];
}
