import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AdaptivePlanFormComponent } from '../../../features/reasoning/adaptive-plan-form/adaptive-plan-form.component';
import { CourseOverviewComponent } from '../../../features/course/course-overview/course-overview.component';

@Component({
  selector: 'app-student-dashboard-page',
  imports: [CourseOverviewComponent, AdaptivePlanFormComponent],
  templateUrl: './student-dashboard-page.component.html',
  styleUrl: './student-dashboard-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentDashboardPageComponent {}
