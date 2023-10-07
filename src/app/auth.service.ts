import { Injectable } from '@angular/core';
import io from 'socket.io-client';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000';
  private socket = io(this.apiUrl); // Establish a connection to the server
  private loggedInUsername: string = '';
  private loggedInEmail: string = '';
  private authStatus = new BehaviorSubject<boolean>(this.isAuthenticated());
  roles: string[] = [];
  userId: number = 0;

  constructor(private router: Router) {
    // Load the saved state from localStorage
    this.loggedInUsername = localStorage.getItem('username') || '';
    this.loggedInEmail = localStorage.getItem('email') || '';
    this.roles = JSON.parse(localStorage.getItem('roles') || '[]');
    this.userId = Number(localStorage.getItem('userId') || 0);
    this.authStatus.next(this.isAuthenticated());
  }

  // Get Auth Status
  getAuthStatus(): Observable<boolean> {
    return this.authStatus.asObservable();
  }

  // Logout Method
  logout(): void {
    this.loggedInUsername = '';
    this.roles = [];
    this.userId = 0;
    this.authStatus.next(false);

    // Remove specific keys from localStorage
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('roles');
    localStorage.removeItem('userId');

    this.router.navigate(['/login']);
  }

  // Login Method using socket.io
  login(email: string, password: string): Observable<any> {
    const responseSubject = new Subject<any>();

    this.socket.emit('login', { email, password });
    this.socket.on('loginResponse', (response: any) => {
      if (response && response.username) {
        this.loggedInUsername = response.username;
        this.loggedInEmail = response.email;
        this.roles = response.roles || [];
        this.userId = response.id || 0;

        // Save to localStorage
        localStorage.setItem('username', this.loggedInUsername);
        localStorage.setItem('email', this.loggedInEmail);
        localStorage.setItem('roles', JSON.stringify(this.roles));
        localStorage.setItem('userId', this.userId.toString());

        this.authStatus.next(true);

        responseSubject.next(response);
      }
    });

    return responseSubject.asObservable();
  }

  getAdminRequests(): Observable<any> {
    const requestSubject = new Subject<any>();

    this.socket.emit('getAdminRequests');
    this.socket.on('adminRequestsData', (data: any) => {
      requestSubject.next(data);
    });

    return requestSubject.asObservable();
  }

  isAuthenticated(): boolean {
    return this.loggedInUsername !== '';
  }

  getLoggedInUsername(): string {
    return this.loggedInUsername;
  }

  getLoggedInEmail(): string {
    return this.loggedInEmail;
  }

  getRoles(): string[] {
    return this.roles;
  }

  getUserId(): number {
    return this.userId;
  }
}
