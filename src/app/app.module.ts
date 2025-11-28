import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { App } from './app';

// Interceptors
import { JwtInterceptor } from './core/interceptors/jwt.interceptor';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';

// Components
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { HomeComponent } from './features/public/home/home.component';
import { HotelListComponent } from './features/public/hotel-list/hotel-list.component';
import { HotelDetailComponent } from './features/public/hotel-detail/hotel-detail.component';
import { HostDashboardComponent } from './features/host/host-dashboard/host-dashboard.component';
import { CreateHotelComponent } from './features/host/create-hotel/create-hotel.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { ToastNotificationComponent } from './shared/components/toast-notification/toast-notification.component';

// Pipes
import { FilterPipe } from './shared/pipes/filter.pipe';
import { AdminDashboard } from './features/admin/admin-dashboard/admin-dashboard';
import { EditHotel } from './features/host/edit-hotel/edit-hotel';
import { Reservations } from './features/user/reservations/reservations';
import { PaymentComponent } from './features/user/payment/payment.component';
import { ManageRooms } from './features/host/manage-rooms/manage-rooms';
import { HotelReservations } from './features/host/hotel-reservations/hotel-reservations';

@NgModule({
  declarations: [
    App,
    LoginComponent,
    RegisterComponent,
    HomeComponent,
    HotelListComponent,
    HotelDetailComponent,
    HostDashboardComponent,
    CreateHotelComponent,
    NavbarComponent,
    ToastNotificationComponent,
    FilterPipe,
    AdminDashboard,
    EditHotel,
    Reservations,
    PaymentComponent,
    ManageRooms,
    HotelReservations
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    }
  ],
  bootstrap: [App]
})
export class AppModule { }
