import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { HttpErrorResponse } from '@angular/common/http';

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

  onSubmit() {
    console.log(`Form submitted with email: ${this.email} and password: ${this.password}`); // Debug log
    this.errorMessage = ''; // Clear any previous error messages

    this.authService.login(this.email, this.password).subscribe(
      res => {
        if (res) {
          // Navigate to the details page
          this.router.navigate(['/details'], {
            state: {
              username: res.username,
              email: res.email
            }
          });
        } else {
          this.errorMessage = 'Invalid email or password';
        }
      },
      error => {
        console.error("Error details:", error);
        if (error instanceof HttpErrorResponse) {
          console.error("Server returned code: ", error.status, ", body was: ", error.error);
        }
        this.errorMessage = 'Invalid email or password';
      }
    );
  }

}



