import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ViolationService, LookupService, ToasterService, DataRefreshService } from '../../services';
import { SessionAuthService } from '../../services/session.service';
import { trigger, transition, style, animate } from '@angular/animations';
import L from 'leaflet';

@Component({
  selector: 'app-reportviolation',
  imports: [FormsModule, CommonModule],
  templateUrl: './reportviolation.html',
  styleUrl: './reportviolation.scss',
  standalone: true,
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-in', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
})
export class Reportviolation implements OnInit, AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  
  currentStep = 0;
  submitted = false;
  isSubmitting = false;
  locationLoading = false;
  addressLoading = false;
  imageValidationError = '';
  
  successMessage = '';
  errorMessage = '';

  violationTypes: any[] = [];
  vehicleTypes: any[] = [
    { id: 1, name: 'Car' },
    { id: 2, name: 'Motorcycle' },
    { id: 3, name: 'Truck' },
    { id: 4, name: 'Bus' },
    { id: 5, name: 'Auto-rickshaw' },
    { id: 6, name: 'SUV' },
    { id: 7, name: 'Sedan' },
    { id: 8, name: 'Van' },
    { id: 9, name: 'Others' }
  ];
  vehicleColors: any[] = [
    { id: 1, name: 'White' },
    { id: 2, name: 'Black' },
    { id: 3, name: 'Red' },
    { id: 4, name: 'Blue' },
    { id: 5, name: 'Green' },
    { id: 6, name: 'Yellow' },
    { id: 7, name: 'Orange' },
    { id: 8, name: 'Gray' },
    { id: 9, name: 'Silver' },
    { id: 10, name: 'Brown' },
    { id: 11, name: 'Gold' },
    { id: 12, name: 'Purple' },
    { id: 13, name: 'Others' }
  ];
  indianStates: any[] = [
    { code: 'AP', name: 'Andhra Pradesh' },
    { code: 'AR', name: 'Arunachal Pradesh' },
    { code: 'AS', name: 'Assam' },
    { code: 'BR', name: 'Bihar' },
    { code: 'CG', name: 'Chhattisgarh' },
    { code: 'GA', name: 'Goa' },
    { code: 'GJ', name: 'Gujarat' },
    { code: 'HR', name: 'Haryana' },
    { code: 'HP', name: 'Himachal Pradesh' },
    { code: 'JK', name: 'Jammu & Kashmir' },
    { code: 'JH', name: 'Jharkhand' },
    { code: 'KA', name: 'Karnataka' },
    { code: 'KL', name: 'Kerala' },
    { code: 'MP', name: 'Madhya Pradesh' },
    { code: 'MH', name: 'Maharashtra' },
    { code: 'MN', name: 'Manipur' },
    { code: 'ML', name: 'Meghalaya' },
    { code: 'MZ', name: 'Mizoram' },
    { code: 'NL', name: 'Nagaland' },
    { code: 'OD', name: 'Odisha' },
    { code: 'PB', name: 'Punjab' },
    { code: 'RJ', name: 'Rajasthan' },
    { code: 'SK', name: 'Sikkim' },
    { code: 'TN', name: 'Tamil Nadu' },
    { code: 'TG', name: 'Telangana' },
    { code: 'TR', name: 'Tripura' },
    { code: 'UP', name: 'Uttar Pradesh' },
    { code: 'UT', name: 'Uttarakhand' },
    { code: 'WB', name: 'West Bengal' },
    { code: 'DL', name: 'Delhi' },
    { code: 'LA', name: 'Ladakh' },
    { code: 'PY', name: 'Puducherry' }
  ];
  private map: any;
  private marker: any;
  
  steps = [
    'Violation Type',
    'Location',
    'Upload Photo',
    'Review & Submit'
  ];

  form: any = {
    category: '',
    description: '',
    vehicle_type_id: '',
    vehicle_color: '',
    plate_state: 'TG',
    plate_district_code: '',
    plate_series: '',
    plate_number: '',
    vehicle_plate_number: '',
    latitude: null,
    longitude: null,
    address: '',
    image: null
  };

  preview: any;

  constructor(private violationService: ViolationService, private lookupService: LookupService, private sessionService: SessionAuthService, private toasterService: ToasterService, private router: Router, private dataRefresh: DataRefreshService) {
    // Set fallback categories immediately for faster UX
    this.violationTypes = [
      { id: 1, name: 'Speeding' },
      { id: 2, name: 'Red Light Violation' },
      { id: 3, name: 'Rash Driving' },
      { id: 4, name: 'Wrong Way' },
      { id: 5, name: 'Parking Violation' },
      { id: 6, name: 'No Seat Belt' },
      { id: 7, name: 'Mobile Phone Usage' },
      { id: 8, name: 'Lane Change Violation' },
      { id: 9, name: 'Other' }
    ];
  }

  ngOnInit() {
    console.log('Reportviolation component initialized');
    this.loadViolationTypes();
    this.loadVehicleTypes();
  }

  ngAfterViewInit() {
    // Initialize map when view is ready
    setTimeout(() => this.initializeMap(), 100);
  }

  /**
   * Load violation types from service
   */
  loadViolationTypes() {
    this.violationService.listViolationCategories().subscribe({
      next: (response: any) => {
        if (response && Array.isArray(response.data)) {
          this.violationTypes = response.data.map((category: any) => ({
            id: category.category_id,
            name: category.category_name
          }));
        } else {
          console.error('Invalid categories response:', response);
          this.setFallbackCategories();
        }
      },
      error: (error: any) => {
        console.error('Error fetching violation categories:', error);
        this.setFallbackCategories();
      }
    });
  }

  /**
   * Set fallback categories if API fails
   */
  private setFallbackCategories() {
    this.violationTypes = [
      { id: 1, name: 'Speeding' },
      { id: 2, name: 'Red Light Violation' },
      { id: 3, name: 'Rash Driving' },
      { id: 4, name: 'Wrong Way' },
      { id: 5, name: 'Parking Violation' },
      { id: 6, name: 'No Seat Belt' },
      { id: 7, name: 'Mobile Phone Usage' },
      { id: 8, name: 'Lane Change Violation' },
      { id: 9, name: 'Other' }
    ];
  }

  /**
   * Load vehicle types from API
   */
  loadVehicleTypes() {
    this.lookupService.getVehicleTypes().subscribe({
      next: (response: any) => {
        if (response && Array.isArray(response.data)) {
          this.vehicleTypes = response.data.map((vehicle: any) => ({
            id: vehicle.vehicle_type_id,
            name: vehicle.type_name
          }));
          console.log('Vehicle types loaded:', this.vehicleTypes);
        } else {
          console.error('Invalid vehicle types response:', response);
          this.setFallbackVehicleTypes();
        }
      },
      error: (error: any) => {
        console.error('Error fetching vehicle types:', error);
        this.setFallbackVehicleTypes();
      }
    });
  }

  /**
   * Set fallback vehicle types if API fails
   */
  private setFallbackVehicleTypes() {
    this.vehicleTypes = [
      { id: 1, name: 'Car' },
      { id: 2, name: 'Motorcycle' },
      { id: 3, name: 'Truck' },
      { id: 4, name: 'Bus' },
      { id: 5, name: 'Auto-rickshaw' },
      { id: 6, name: 'SUV' },
      { id: 7, name: 'Sedan' },
      { id: 8, name: 'Van' },
      { id: 9, name: 'Others' }
    ];
  }

  /**
   * Get current user's location
   */
  getCurrentLocation() {
    if (!navigator.geolocation) {
      this.errorMessage = 'Geolocation is not supported by your browser';
      this.toasterService.error('Geolocation is not supported by your browser');
      return;
    }

    this.locationLoading = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.form.latitude = position.coords.latitude;
        this.form.longitude = position.coords.longitude;
        this.locationLoading = false;
        this.updateMapMarker();
        this.getAddressFromCoordinates();
        this.successMessage = 'Location captured successfully';
        this.toasterService.success('Location captured successfully');
      },
      (error) => {
        this.locationLoading = false;
        this.errorMessage = `Failed to get location: ${error.message}`;
        this.toasterService.error(`Failed to get location: ${error.message}`);
      }
    );
  }

  /**
   * Initialize Leaflet map
   */
  private initializeMap() {
    // Don't reinitialize if map already exists
    if (this.map) return;
    
    if (!this.mapContainer) return;

    const mapElement = this.mapContainer.nativeElement;
    if (!mapElement || mapElement.offsetHeight === 0) {
      // Element not visible yet, retry
      setTimeout(() => this.initializeMap(), 200);
      return;
    }

    try {
      const defaultLat = 40.7128; // New York latitude
      const defaultLng = -74.0060; // New York longitude

      this.map = L.map(mapElement).setView([defaultLat, defaultLng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(this.map);

      // Handle map click
      this.map.on('click', (e: any) => {
        this.form.latitude = e.latlng.lat;
        this.form.longitude = e.latlng.lng;
        this.updateMapMarker();
        this.getAddressFromCoordinates();
      });

      // Trigger map resize after initialization
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 100);

      // If form already has coordinates, show marker
      if (this.form.latitude && this.form.longitude) {
        this.updateMapMarker();
      }
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  /**
   * Update marker position on map
   */
  private updateMapMarker() {
    if (!this.map || !this.form.latitude || !this.form.longitude) return;

    if (this.marker) {
      this.marker.setLatLng([this.form.latitude, this.form.longitude]);
    } else {
      this.marker = L.marker([this.form.latitude, this.form.longitude], {
        draggable: true
      }).addTo(this.map);

      // Handle marker drag
      this.marker.on('dragend', () => {
        const position = this.marker.getLatLng();
        this.form.latitude = position.lat;
        this.form.longitude = position.lng;
        this.getAddressFromCoordinates();
      });
    }

    this.map.setView([this.form.latitude, this.form.longitude], 15);
  }

  /**
   * Get address from coordinates using reverse geocoding (Nominatim)
   */
  private getAddressFromCoordinates() {
    if (!this.form.latitude || !this.form.longitude) return;

    this.addressLoading = true;
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${this.form.latitude}&lon=${this.form.longitude}`;

    fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SafeRoad-App'
      }
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.address) {
          const address = this.formatAddress(data.address);
          this.form.address = address;
          this.addressLoading = false;
        }
      })
      .catch((error) => {
        console.error('Error fetching address:', error);
        this.addressLoading = false;
      });
  }

  /**
   * Format address from Nominatim response
   */
  private formatAddress(addressObj: any): string {
    const parts = [];
    if (addressObj.road) parts.push(addressObj.road);
    if (addressObj.city) parts.push(addressObj.city);
    if (addressObj.state) parts.push(addressObj.state);
    if (addressObj.country) parts.push(addressObj.country);
    
    return parts.join(', ') || 'Address not found';
  }

  /**
   * Handle coordinate input changes
   */
  onCoordinateChange() {
    if (this.form.latitude && this.form.longitude) {
      this.updateMapMarker();
      this.getAddressFromCoordinates();
    }
  }

  /**
   * Handle file selection
   */
  onFileChange(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file';
      this.toasterService.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 100KB)
    const maxSizeKb = 100;
    if (file.size > maxSizeKb * 1024) {
      this.imageValidationError = `Image size must be less than ${maxSizeKb}KB. Current size: ${(file.size / 1024).toFixed(1)}KB`;
      this.toasterService.error(this.imageValidationError);
      return;
    }

    this.imageValidationError = '';
    this.form.image = file;
    this.generatePreview(file);

    // Instant filename-based content validation
    if (this.form.vehicle_type_id) {
      this.validateImageContent(file);
    }
  }

  /**
   * Map vehicle type ID to keywords expected in the image filename
   */
  private getKeywordsForVehicleType(vehicleTypeId: number): string[] {
    const map: { [key: number]: string[] } = {
      1: ['car', 'vehicle', 'auto'],
      2: ['bike', 'motorcycle', 'moto', 'cycle', 'two'],
      3: ['truck', 'lorry', 'vehicle'],
      4: ['bus', 'vehicle'],
      5: ['auto', 'rickshaw', 'vehicle'],
      6: ['suv', 'car', 'vehicle'],
      7: ['car', 'sedan', 'vehicle'],
      8: ['van', 'car', 'vehicle'],
      9: []                           // Others — skip validation
    };
    return map[vehicleTypeId] || [];
  }

  /**
   * Validate image filename contains keywords matching the selected vehicle type.
   * Shows a warning (soft block) if no keyword match is found.
   */
  private validateImageContent(_file: File): void {
    const keywords = this.getKeywordsForVehicleType(Number(this.form.vehicle_type_id));
    if (keywords.length === 0) return;

    const nameLower = _file.name.toLowerCase();
    const found = keywords.some(kw => nameLower.includes(kw));

    if (!found) {
      const vehicleTypeName = this.getVehicleTypeName(this.form.vehicle_type_id);
      this.imageValidationError = `Filename does not suggest a ${vehicleTypeName} image. Please confirm this image shows a ${vehicleTypeName}.`;
    }
  }

  /**
   * Handle drag over event
   */
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Handle drag leave event
   */
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Handle file drop
   */
  onDropFile(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.onFileChange({ target: { files } });
    }
  }

  /**
   * Generate image preview
   */
  private generatePreview(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      this.preview = reader.result;
    };
    reader.readAsDataURL(file);
  }

  /**
   * Remove uploaded file
   */
  removeFile() {
    this.form.image = null;
    this.preview = null;
  }

  /**
   * Check if current step is valid before proceeding
   */
  canProceed(): boolean {
    switch (this.currentStep) {
      case 0: // Violation Type
        return !!this.form.category;
      case 1: // Location
        return !!this.form.latitude && !!this.form.longitude;
      case 2: // Upload Photo
        return !!this.form.image;
      case 3: // Review
        return true;
      default:
        return false;
    }
  }

  /**
   * Move to next step
   */
  next() {
    if (this.canProceed() && this.currentStep < this.steps.length - 1) {
      this.submitted = false;
      this.currentStep++;
      // Initialize map when moving to location step
      if (this.currentStep === 1) {
        setTimeout(() => this.initializeMap(), 100);
      }
    } else {
      this.submitted = true;
    }
  }

  /**
   * Move to previous step
   */
  prev() {
    if (this.currentStep > 0) {
      this.submitted = false;
      this.currentStep--;
    }
  }

  /**
   * Get vehicle type name by ID
   */
  getVehicleTypeName(typeId: any): string {
    if (!typeId) return 'Not specified';
    const vehicleType = this.vehicleTypes.find(t => String(t.id) === String(typeId));
    return vehicleType ? vehicleType.name : 'Not specified';
  }

  /**
   * Get category name by ID
   */
  getCategoryName(categoryId: any): string {
    if (!categoryId) return 'Not specified';
    const category = this.violationTypes.find(t => String(t.id) === String(categoryId));
    return category ? category.name : 'Not specified';
  }

  /**
   * Clear error message
   */
  clearError() {
    this.errorMessage = '';
  }

  /**
   * Submit the violation report
   */
  submit() {
    if (!this.canProceed()) {
      this.submitted = true;
      return;
    }

    this.isSubmitting = true;

    // Convert image to base64
    if (!this.form.image) {
      this.errorMessage = 'Image is required';
      this.toasterService.error('Image is required');
      this.isSubmitting = false;
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result as string;
      const base64String = imageData.split(',')[1]; // Remove data:image/jpeg;base64, prefix

      // Get reporter ID from session
      const reporterId = this.sessionService.getUserId();
      if (!reporterId) {
        this.errorMessage = 'User session not found. Please login again.';
        this.toasterService.error('User session not found. Please login again.');
        this.isSubmitting = false;
        return;
      }

      // Prepare payload with only required fields
      const violationPayload: any = {
        reporter_id: parseInt(reporterId),
        category_id: parseInt(String(this.form.category)),
        violation_datetime: new Date().toISOString(),
        location_latitude: this.form.latitude,
        location_longitude: this.form.longitude,
        location_address: this.form.address || '',
        image_data: base64String,
        image_mime_type: this.form.image.type || 'image/jpeg',
        description: this.form.description || '',
        vehicle_plate_number: this.form.vehicle_plate_number || ''
      };

      // Add optional vehicle information if provided
      if (this.form.vehicle_type_id) {
        violationPayload.vehicle_type_id = parseInt(String(this.form.vehicle_type_id));
      }
      if (this.form.vehicle_color) {
        violationPayload.vehicle_color = this.form.vehicle_color;
      }

      console.log('Submitting violation payload:', violationPayload);

      this.violationService.reportViolation(violationPayload).subscribe({
        next: (response: any) => {
          // Success - server returned a response without error
          this.isSubmitting = false;
          this.successMessage = 'Violation reported successfully! Thank you for helping keep roads safe. Redirecting to My Reports...';
          this.toasterService.success('Violation reported successfully! Thank you for helping keep roads safe.');
          console.log('Violation report response:', response);
          
          // Broadcast refresh so dashboard, violations, rewards all update immediately
          this.dataRefresh.triggerRefresh();

          // Reset form and redirect to violations page after 1.5 seconds
          setTimeout(() => {
            this.resetForm();
            this.successMessage = '';
            // Navigate to violations list page - component will auto-load fresh data
            this.router.navigate(['/violations']);
          }, 1500);
        },
        error: (error: any) => {
          this.isSubmitting = false;
          console.error('Error submitting violation:', error);
          
          // Extract HTTP status code
          const status = error?.status || error?.error?.status || 'Unknown';
          
          // Extract error message from different possible response formats
          let errorMsg = 'Failed to submit violation report. Please try again.';
          let detailMsg = '';
          
          // Check for server errors (5xx)
          if (status >= 500) {
            errorMsg = `Server Error (${status}): The server encountered an error. Please try again later.`;
            detailMsg = error?.error?.detail || error?.error?.message || '';
          }
          // Check for client errors (4xx)
          else if (status >= 400) {
            if (error?.error?.detail) {
              errorMsg = `Error: ${error.error.detail}`;
            } else if (error?.error?.message) {
              errorMsg = `Error: ${error.error.message}`;
            } else if (typeof error?.error === 'string') {
              errorMsg = `Error: ${error.error}`;
            } else {
              errorMsg = `Client Error (${status}): Invalid request data. Please check your input and try again.`;
            }
          }
          // Network errors or timeout
          else if (error?.status === 0) {
            errorMsg = 'Network Error: Unable to connect to the server. Please check your internet connection.';
          }
          // Generic error
          else if (error?.error) {
            if (typeof error.error === 'string') {
              errorMsg = error.error;
            } else if (error.error.detail) {
              errorMsg = error.error.detail;
            } else if (error.error.message) {
              errorMsg = error.error.message;
            } else if (error.error.error) {
              errorMsg = error.error.error;
            }
          }
          
          this.errorMessage = errorMsg;
          this.toasterService.error(errorMsg);
          if (detailMsg) {
            console.error('Error details:', detailMsg);
          }
          console.error('Full error details:', error);
          
          // Keep error visible - don't auto-clear
          // User must see the error before trying again
        }
      });
    };

    reader.readAsDataURL(this.form.image);
  }

  /**
   * Format plate number whenever any part changes
   */
  formatPlateNumber() {
    const state = (this.form.plate_state || 'TG').toUpperCase();
    const districtCode = (this.form.plate_district_code || '').padStart(2, '0').substring(0, 2);
    const series = (this.form.plate_series || '').toUpperCase().substring(0, 2);
    const number = (this.form.plate_number || '').padStart(4, '0').substring(0, 4);
    
    // Format: TG 01 FE 1234
    this.form.vehicle_plate_number = `${state} ${districtCode} ${series} ${number}`.trim();
  }

  /**
   * Handle plate district code input - max 2 digits only
   */
  onPlateDistrictCodeChange(event: any) {
    let value = event.target.value.replace(/[^0-9]/g, '');
    if (value.length > 2) {
      value = value.substring(0, 2);
    }
    this.form.plate_district_code = value;
    this.formatPlateNumber();
  }

  /**
   * Handle plate series input - max 2 characters, uppercase
   */
  onPlateSeriesChange(event: any) {
    let value = event.target.value.toUpperCase();
    if (value.length > 2) {
      value = value.substring(0, 2);
    }
    this.form.plate_series = value;
    this.formatPlateNumber();
  }

  /**
   * Handle plate number input - only digits, max 4
   */
  onPlateNumberChange(event: any) {
    let value = event.target.value.replace(/[^0-9]/g, '');
    if (value.length > 4) {
      value = value.substring(0, 4);
    }
    this.form.plate_number = value;
    this.formatPlateNumber();
  }

  /**
   * Reset form to initial state
   */
  private resetForm() {
    this.currentStep = 0;
    this.submitted = false;
    this.successMessage = '';
    this.errorMessage = '';
    this.form = {
      category: '',
      description: '',
      vehicle_type_id: '',
      vehicle_color: '',
      plate_state: 'TG',
      plate_district_code: '',
      plate_series: '',
      plate_number: '',
      vehicle_plate_number: '',
      latitude: null,
      longitude: null,
      address: '',
      image: null
    };
    this.preview = null;
  }
}
