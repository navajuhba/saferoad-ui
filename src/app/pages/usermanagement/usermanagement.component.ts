import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { ToasterService } from '../../services/toaster.service';

interface UserRow {
  user_id: number;
  email: string;
  username: string;
  full_name: string;
  phone: string;
  profile_picture_url?: string;
  user_type_id: number;
  user_type: string;
  status_id: number;
  created_at: string;
}

@Component({
  selector: 'app-usermanagement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usermanagement.component.html',
  styleUrls: ['./usermanagement.component.scss']
})
export class UsermanagementComponent implements OnInit {
  users: UserRow[] = [];
  filteredUsers: UserRow[] = [];
  isLoading = false;
  errorMessage: string | null = null;

  searchText = '';
  filterType = '1'; // default to Reporter only

  // Edit modal state
  editModalOpen = false;
  editingUser: Partial<UserRow> = {};
  isSaving = false;

  // Delete confirmation state
  deleteConfirmId: number | null = null;
  isDeleting = false;

  userTypes = [
    { id: 1, name: 'Reporter' },
    { id: 2, name: 'Admin' }
  ];

  constructor(
    private userService: UserService,
    private toaster: ToasterService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.userService.listAllUsers().subscribe({
      next: (response: any) => {
        this.users = response?.data || (Array.isArray(response) ? response : []);
        // pre-filter to reporters so the list is meaningful on first load
        this.applyFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.errorMessage = err?.status === 403
          ? 'You do not have permission to view users.'
          : 'Failed to load users. Please try again.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilters(): void {
    const search = this.searchText.toLowerCase();
    this.filteredUsers = this.users.filter(u => {
      const matchSearch =
        u.full_name?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search) ||
        u.username?.toLowerCase().includes(search) ||
        u.user_id?.toString().includes(search);
      const matchType =
        this.filterType === 'all' || u.user_type_id?.toString() === this.filterType;
      return matchSearch && matchType;
    });
  }

  openEdit(user: UserRow): void {
    this.editingUser = { ...user };
    this.editModalOpen = true;
  }

  closeEdit(): void {
    this.editModalOpen = false;
    this.editingUser = {};
  }

  saveEdit(): void {
    if (!this.editingUser.user_id) return;
    this.isSaving = true;

    // API only accepts these three fields
    const payload = {
      full_name: this.editingUser.full_name,
      phone: this.editingUser.phone,
      profile_picture_url: this.editingUser.profile_picture_url || ''
    };

    this.userService.updateUser(String(this.editingUser.user_id), payload).subscribe({
      next: (response: any) => {
        const idx = this.users.findIndex(u => u.user_id === this.editingUser.user_id);
        if (idx !== -1) {
          this.users[idx] = {
            ...this.users[idx],
            full_name: this.editingUser.full_name || this.users[idx].full_name,
            phone: this.editingUser.phone || this.users[idx].phone
          };
        }
        this.applyFilters();
        this.toaster.success(response?.message || 'User updated successfully.');
        this.isSaving = false;
        this.closeEdit();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        const msg = this.extractErrorMessage(err, 'Failed to update user.');
        this.toaster.error(msg);
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  confirmDelete(userId: number): void {
    this.deleteConfirmId = userId;
  }

  cancelDelete(): void {
    this.deleteConfirmId = null;
  }

  executeDelete(userId: number): void {
    this.isDeleting = true;
    this.userService.deleteUser(String(userId)).subscribe({
      next: (response: any) => {
        this.users = this.users.filter(u => u.user_id !== userId);
        this.applyFilters();
        this.toaster.success(response?.message || 'User deleted successfully.');
        this.deleteConfirmId = null;
        this.isDeleting = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        const msg = this.extractErrorMessage(err, 'Failed to delete user.');
        this.toaster.error(msg);
        this.deleteConfirmId = null;
        this.isDeleting = false;
        this.cdr.detectChanges();
      }
    });
  }

  private extractErrorMessage(err: any, fallback: string): string {
    if (err?.status === 0) return 'Network error: unable to reach the server.';
    if (err?.status === 403) return 'You do not have permission to perform this action.';
    if (err?.status === 404) return 'User not found.';
    const detail = err?.error?.detail;
    if (Array.isArray(detail)) {
      return detail.map((d: any) => `• ${d.loc?.slice(-1)[0] ?? 'field'}: ${d.msg}`).join('\n');
    }
    return typeof detail === 'string' ? detail : (err?.error?.message || fallback);
  }

  getUserTypeName(typeId?: number): string {
    return this.userTypes.find(t => t.id === typeId)?.name || 'Unknown';
  }

  getUsernameById(userId: number): string {
    return this.users.find(u => u.user_id === userId)?.username || `#${userId}`;
  }

  getStatusLabel(statusId: number): string {
    return statusId === 1 ? 'Active' : 'Inactive';
  }
}
