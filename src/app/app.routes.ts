import { Routes } from '@angular/router';
import { AppShellComponent } from './widgets/app-shell/app-shell.component';
import { authGuard } from './shared/lib/guards/auth.guard';
import { roleGuard } from './shared/lib/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/auth/login-page/login-page.component').then(
        (m) => m.LoginPageComponent,
      ),
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'student',
        canActivate: [roleGuard],
        data: { role: 'STUDENT' },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/student/dashboard-page/student-dashboard-page.component').then(
                (m) => m.StudentDashboardPageComponent,
              ),
          },
          {
            path: 'course/:courseId',
            loadComponent: () =>
              import('./pages/student/course-viewer-page/course-viewer-page.component').then(
                (m) => m.CourseViewerPageComponent,
              ),
          },
        ],
      },
      {
        path: 'tutor',
        canActivate: [roleGuard],
        data: { role: 'TUTOR' },
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./pages/tutor/dashboard-page/tutor-dashboard-page.component').then(
                (m) => m.TutorDashboardPageComponent,
              ),
          },
          {
            path: 'course/:courseId',
            loadComponent: () =>
              import('./pages/tutor/course-viewer-page/course-viewer-page.component').then(
                (m) => m.TutorCourseViewerPageComponent,
              ),
          },
        ],
      },
      { path: '', pathMatch: 'full', redirectTo: 'student' },
    ],
  },
  {
    path: 'certificate/:hash',
    loadComponent: () =>
      import('./pages/public/certificate-viewer-page/certificate-viewer-page.component').then(
        (m) => m.CertificateViewerPageComponent,
      ),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found-page.component').then(
        (m) => m.NotFoundPageComponent,
      ),
  },
];
