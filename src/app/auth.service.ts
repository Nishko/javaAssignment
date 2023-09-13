import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000';
  private loggedInUsername: string = '';
  private loggedInEmail: string = '';
  private authStatus = new BehaviorSubject<boolean>(this.isAuthenticated());
  roles: string[] = [];
  userId: number = 0;

  constructor(private http: HttpClient, private router: Router) {
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

    // Clear localStorage
    localStorage.clear();

    this.router.navigate(['/login']);
  }

  // Login Method
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((response: any) => {
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
        }
      })
    );
  }

  getAdminRequests(): Observable<any> {
    return this.http.get('/api/get-admin-requests');
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
