import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DataRefreshService {
  private refreshSource = new Subject<void>();
  readonly refresh$ = this.refreshSource.asObservable();

  triggerRefresh(): void {
    this.refreshSource.next();
  }
}
