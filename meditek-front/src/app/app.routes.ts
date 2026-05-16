import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DashboardMedicoComponent } from './dashboard-medico/dashboard-medico.component';
import { DashboardPacienteComponent } from './dashboard-paciente/dashboard-paciente.component';
import { FarmaciaComponent } from './farmacia/farmacia.component';
import { AboutComponent } from './about/about.component';
import { ServicesComponent } from './services/services.component';
import { ContactComponent } from './contact/contact.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'dashboard-medico', component: DashboardMedicoComponent },
  { path: 'dashboard-paciente', component: DashboardPacienteComponent },
  { path: 'farmacia', component: FarmaciaComponent },
  { path: 'nosotros', component: AboutComponent },
  { path: 'servicios', component: ServicesComponent },
  { path: 'contacto', component: ContactComponent },
];
