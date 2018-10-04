import {NgModule} from '@angular/core';
import {ApplicationDashboardComponent} from './application-dashboard.component';
import {ApplicationSelectComponent} from './components/application-select/application-select.component';
import {SharedModule} from "../shared/shared.module";
import {ApplicationDashboardService} from "./services/application-dashboard.service";
import {PageComponent} from './components/page/page.component';
import {RouterModule, Routes} from "@angular/router";
import {CsiValueComponent} from "./components/csi-value/csi-value.component";
import {CsiGraphComponent} from './components/csi-graph/csi-graph.component';
import {PageMetricComponent} from './components/page-metric/page-metric.component';
import {CsiInfoComponent} from "./components/csi-info/csi-info.component";

const DashboardRoutes: Routes = [
  {path: '', component: ApplicationDashboardComponent},
  {path: ':applicationId', component: ApplicationDashboardComponent}
];

@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild(DashboardRoutes)
  ],
  declarations: [
    ApplicationDashboardComponent,
    ApplicationSelectComponent,
    PageComponent,
    CsiValueComponent,
    CsiGraphComponent,
    CsiInfoComponent,
    PageMetricComponent
  ],
  exports: [
    RouterModule
  ],
  providers: [
    ApplicationDashboardService
  ]
})
export class ApplicationDashboardModule {
}
