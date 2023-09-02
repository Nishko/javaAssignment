// login.component.ts

import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username!: string;
  password!: string;
  authenticated: boolean = false;

  constructor(private http: HttpClient, private router: Router) { }

  onSubmit() {
    const credentials = {
      username: this.username,
      password: this.password
    };

    this.http.post('/login', credentials).subscribe((response: any) => {
      if (response.authenticated) {
        this.authenticated = true;
        this.router.navigate(['/chat']); // Add chat route for this soon
        console.log('Login successful');
      } else {
        this.authenticated = false;
        console.log('Login failed');
      }
    });
  }
}

