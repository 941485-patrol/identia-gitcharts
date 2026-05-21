import { Routes } from '@angular/router';

export const routes: Routes = [
  { 
    path: 'search', 
    loadComponent: () => import('./search/search.component').then(m => m.SearchComponent) 
  },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent) 
  },
  { path: '', redirectTo: '/search', pathMatch: 'full' }
];
