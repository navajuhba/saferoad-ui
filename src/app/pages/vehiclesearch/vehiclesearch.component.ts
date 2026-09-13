import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Violation, ViolationCategory } from '../../models';
import { ViolationService } from '../../services/violation.service';
import { ToasterService } from '../../services/toaster.service';
import { resolveMediaUrl } from '../../utils/media.util';

@Component({
  selector: 'app-vehiclesearch',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehiclesearch.component.html',
  styleUrls: ['./vehiclesearch.component.scss']
})
export class VehiclesearchComponent {
  plateNumber = '';
  isLoading = false;
  hasSearched = false;
  errorMessage: string | null = null;

  searchedPlate = '';
  totalChallans = 0;
  results: Violation[] = [];

  violationCategories: ViolationCategory[] = [];

  vehicleTypes = [
    { id: 1, name: 'Car' }, { id: 2, name: 'Motorcycle' }, { id: 3, name: 'Truck' },
    { id: 4, name: 'Bus' }, { id: 5, name: 'Auto-rickshaw' }, { id: 6, name: 'SUV' },
    { id: 7, name: 'Sedan' }, { id: 8, name: 'Van' }, { id: 9, name: 'Others' }
  ];

  violationStatuses = [
    { id: 1, name: 'Pending', badge: 'pending' },
    { id: 2, name: 'Verified', badge: 'verified' },
    { id: 3, name: 'Rejected', badge: 'rejected' }
  ];

  constructor(
    private violationService: ViolationService,
    private toaster: ToasterService,
    private cdr: ChangeDetectorRef
  ) {
    this.loadCategories();
  }

  private loadCategories(): void {
    this.violationService.listViolationCategories().subscribe({
      next: (response: any) => {
        this.violationCategories = response?.data || (Array.isArray(response) ? response : []);
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  resolveImageUrl(path?: string): string | undefined {
    return resolveMediaUrl(path);
  }

  search(): void {
    const plate = this.plateNumber.trim();
    if (!plate) {
      this.toaster.warning('Enter a vehicle plate number to search.');
      return;
    }

    this.isLoading = true;
    this.hasSearched = true;
    this.errorMessage = null;

    this.violationService.listViolationsByPlate(plate).subscribe({
      next: (response: any) => {
        const data = response?.data || response || {};
        this.searchedPlate = data.vehicle_plate_number || plate;
        this.results = data.violations || (Array.isArray(data) ? data : []);
        this.totalChallans = data.total_challans ?? this.results.length;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        const detail = err?.error?.detail || err?.error?.message;
        this.errorMessage = `Failed to search vehicle records${detail ? ': ' + detail : ''}.`;
        this.results = [];
        this.totalChallans = 0;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  clear(): void {
    this.plateNumber = '';
    this.hasSearched = false;
    this.results = [];
    this.totalChallans = 0;
    this.errorMessage = null;
  }

  getCategoryName(categoryId?: number): string {
    return this.violationCategories.find(c => c.category_id === categoryId)?.category_name || 'Unknown';
  }

  getVehicleTypeName(id?: number): string {
    return this.vehicleTypes.find(t => t.id === id)?.name || 'Unknown';
  }

  getStatusName(statusId?: number): string {
    return this.violationStatuses.find(s => s.id === statusId)?.name || 'Unknown';
  }

  getStatusBadge(statusId?: number): string {
    return this.violationStatuses.find(s => s.id === statusId)?.badge || '';
  }
}
