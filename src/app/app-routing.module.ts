import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Components
import { HomeComponent } from './features/public/home/home.component';
import { HotelListComponent } from './features/public/hotel-list/hotel-list.component';
import { HotelDetailComponent } from './features/public/hotel-detail/hotel-detail.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { HostDashboardComponent } from './features/host/host-dashboard/host-dashboard.component';
import { CreateHotelComponent } from './features/host/create-hotel/create-hotel.component';
import { EditHotel } from './features/host/edit-hotel/edit-hotel';
import { AdminDashboard } from './features/admin/admin-dashboard/admin-dashboard';
import { Reservations } from './features/user/reservations/reservations';
import { PaymentComponent } from './features/user/payment/payment.component';
import { ManageRooms } from './features/host/manage-rooms/manage-rooms';
import { HotelReservations } from './features/host/hotel-reservations/hotel-reservations';

// Guards
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'hotels', component: HotelListComponent },
  { path: 'hotels/:id', component: HotelDetailComponent },
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent },
  { 
    path: 'host', 
    component: HostDashboardComponent, 
    canActivate: [AuthGuard],
    data: { role: 'host' }
  },
  { 
    path: 'host/create-hotel', 
    component: CreateHotelComponent, 
    canActivate: [AuthGuard],
    data: { role: 'host' }
  },
  { 
    path: 'host/edit-hotel/:id', 
    component: EditHotel, 
    canActivate: [AuthGuard],
    data: { role: 'host' }
  },
  { 
    path: 'host/manage-rooms/:id', 
    component: ManageRooms, 
    canActivate: [AuthGuard],
    data: { role: 'host' }
  },
  { 
    path: 'host/reservations/:id', 
    component: HotelReservations, 
    canActivate: [AuthGuard],
    data: { role: 'host' }
  },
  { 
    path: 'admin', 
    component: AdminDashboard, 
    canActivate: [AuthGuard],
    data: { role: 'admin' }
  },
  { 
    path: 'user/reservations', 
    component: Reservations, 
    canActivate: [AuthGuard]
  },
  { 
    path: 'user/payment/:id', 
    component: PaymentComponent, 
    canActivate: [AuthGuard]
  },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
