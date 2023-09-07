import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000';
  private loggedInUsername: string = '';
  private loggedInEmail: string = '';
  roles: string[] = [];
  userId: number = 0;

  constructor(private http: HttpClient, private router: Router) { }

  // Logout Method
  logout(): void {
    this.loggedInUsername = '';
    this.roles = [];
    this.userId = 0;

    // Navigate to the login page
    this.router.navigate(['/login']);
  }

  // Login Method
  login(email: string, password: string): Observable<any> {
    console.log(`Sending email: ${email}, password: ${password}`);  // Debug log
    return this.http.post(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((response: any) => {
        if (response && response.username) {
          this.loggedInUsername = response.username;
          this.loggedInEmail = response.email;
          this.roles = response.roles || [];

          this.userId = response.id || 0;

          console.log('Response from /login:', response);
          console.log('Setting loggedInUsername:', this.loggedInUsername);
          console.log('Setting roles:', this.roles); // Debug roles
        }
      })
    );
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
    console.log('Returning roles:', this.roles);
    return this.roles;
  }

  getUserId(): number {
    return this.userId;
  }
}





