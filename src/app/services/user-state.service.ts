import { Injectable, signal } from '@angular/core';
import { User } from '../models';

@Injectable({ providedIn: 'root' })
export class UserStateService {
  readonly currentUser = signal<User | null>(null);

  setUser(user: User) {
    this.currentUser.set(user);
  }
}
