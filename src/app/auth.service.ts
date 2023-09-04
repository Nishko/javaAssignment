import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  loggedInUsername: string = '';

  constructor(private http: HttpClient) { }

  login(email: string, password: string): Observable<any> {
    return this.http.post('/login', { email, password }).pipe(
      tap((response: any) => {
        if (response && response.username) {
          this.loggedInUsername = response.username;
        }
        console.log('Response from /login:', response); // Log the response to see if it contains 'username'
        console.log('Setting loggedInUsername:', this.loggedInUsername);
      })
    );
  }

  getUsername(): string {
    console.log('Getting Username:', this.loggedInUsername);
    return this.loggedInUsername;
  }
}



