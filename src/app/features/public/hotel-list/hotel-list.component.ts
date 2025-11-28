import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HotelService } from '../../../core/services/hotel.service';
import { Hotel, HotelSearchRequest } from '../../../models/hotel.model';

@Component({
  selector: 'app-hotel-list',
  templateUrl: './hotel-list.component.html',
  styleUrls: ['./hotel-list.component.scss'],
  standalone: false
})
export class HotelListComponent implements OnInit {
  hotels: Hotel[] = [];
  loading = false;
  currentPage = 0;
  pageSize = 12;
  totalPages = 0;
  totalElements = 0;

  // Filtros
  searchFilters: HotelSearchRequest = {
    page: 0,
    size: 12,
    sortBy: 'nombre',
    sortDirection: 'ASC'
  };

  // Filtros avanzados
  showFilters = false;
  priceRange = { min: 0, max: 1000 };
  selectedStars: number | null = null;
  selectedAmenities: string[] = [];
  availableAmenities = [
    'WiFi Gratis',
    'Piscina',
    'Gimnasio',
    'Estacionamiento',
    'Restaurant',
    'Room Service',
    'Spa',
    'Bar'
  ];

  constructor(
    private hotelService: HotelService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadHotels();
  }

  loadHotels(): void {
    this.loading = true;
    this.searchFilters.page = this.currentPage;
    this.searchFilters.size = this.pageSize;

    this.hotelService.searchHotels(this.searchFilters).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.hotels = response.data.content;
          this.totalPages = response.data.totalPages;
          this.totalElements = response.data.totalElements;
          this.currentPage = response.data.pageNumber;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando hoteles:', error);
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadHotels();
  }

  clearFilters(): void {
    this.searchFilters = {
      page: 0,
      size: 12,
      sortBy: 'nombre',
      sortDirection: 'ASC'
    };
    this.priceRange = { min: 0, max: 1000 };
    this.selectedStars = null;
    this.selectedAmenities = [];
    this.currentPage = 0;
    this.loadHotels();
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  filterByStars(stars: number): void {
    this.selectedStars = this.selectedStars === stars ? null : stars;
    this.searchFilters.estrellas = this.selectedStars || undefined;
    this.onSearch();
  }

  onPriceChange(): void {
    this.searchFilters.precioMinimo = this.priceRange.min;
    this.searchFilters.precioMaximo = this.priceRange.max;
    this.onSearch();
  }

  toggleAmenity(amenity: string): void {
    const index = this.selectedAmenities.indexOf(amenity);
    if (index > -1) {
      this.selectedAmenities.splice(index, 1);
    } else {
      this.selectedAmenities.push(amenity);
    }
    this.searchFilters.amenidades = this.selectedAmenities.length > 0 ? this.selectedAmenities : undefined;
    this.onSearch();
  }

  isAmenitySelected(amenity: string): boolean {
    return this.selectedAmenities.includes(amenity);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadHotels();
      window.scrollTo(0, 0);
    }
  }

  viewHotelDetail(hotelId: number): void {
    this.router.navigate(['/hotels', hotelId]);
  }

  getStarsArray(stars: number): number[] {
    return Array(stars).fill(0);
  }
}
