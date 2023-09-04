import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private router: Router, private http: HttpClient) { }

  async onSubmit() {
    // Clear any previous error message
    this.errorMessage = '';

    const credentials = {
      email: this.email,
      password: this.password
    };

    try {
      const res: any = await this.http.post('http://localhost:3000/login', credentials).toPromise();

      // Navigate to details page
      this.router.navigate(['/details'], {
        state: {
          username: res.username,
          email: res.email
        }
      });
    } catch (error) {
      this.errorMessage = 'Invalid email or password';
    }
  }
}


