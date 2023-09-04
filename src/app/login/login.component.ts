import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  async onSubmit() {
    this.errorMessage = ''; // Clear any previous error messages

    try {
      const res = await this.authService.login(this.email, this.password).toPromise();
      if (!res) {
        throw new Error('Invalid login');
      }

      // Navigate to the details page
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



