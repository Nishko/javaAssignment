import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccountDataService {
  private usernameSource = new BehaviorSubject<string>('');
  private emailSource = new BehaviorSubject<string>('');

  currentUsername = this.usernameSource.asObservable();
  currentEmail = this.emailSource.asObservable();

  constructor() { }

  changeUsername(username: string) {
    this.usernameSource.next(username);
  }

  changeEmail(email: string) {
    this.emailSource.next(email);
  }
}
