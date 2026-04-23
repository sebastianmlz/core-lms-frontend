import { ChangeDetectionStrategy, Component, computed, signal, inject } from '@angular/core';
import { AdaptivePlanFormComponent } from '../../../features/reasoning/adaptive-plan-form/adaptive-plan-form.component';
import { CourseOverviewComponent } from '../../../features/course/course-overview/course-overview.component';
import { SessionStore, SessionStoreType } from '../../../entities/session/model/session.store';
import { CourseStore, CourseStoreType } from '../../../entities/course/model/course.store';
import { OnboardingModalComponent } from '../../../features/user/onboarding-modal/onboarding-modal.component';

@Component({
  selector: 'app-student-dashboard-page',
  imports: [CourseOverviewComponent, AdaptivePlanFormComponent, OnboardingModalComponent],
  templateUrl: './student-dashboard-page.component.html',
  styleUrl: './student-dashboard-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentDashboardPageComponent {
  readonly sessionStore = inject(SessionStore) as SessionStoreType;
  readonly courseStore = inject(CourseStore) as CourseStoreType;

  // KPIs dinámicos
  readonly activeCoursesCount = computed(() => this.courseStore.courses()?.length || 0);
  
  // Leemos desde el SessionStore permanentemente. Si es null mostramos "Pendiente"
  readonly dominantProfile = computed(() => {
     const vark = this.sessionStore.dominantVark();
     if (!vark) return 'Evaluando...';
     const spanishMap: Record<string, string> = {
       'visual': 'Visual', 'auditory': 'Auditivo', 'read_write': 'Lecto-Escritura', 'kinesthetic': 'Kinestésico' 
     };
     return spanishMap[vark] || vark;
  });
  
  readonly accuracyMetric = signal(82);
}
