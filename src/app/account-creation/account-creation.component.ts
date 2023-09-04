import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AccountDataService } from '../account-data.service';

@Component({
  selector: 'app-account-creation',
  templateUrl: './account-creation.component.html',
  styleUrls: ['./account-creation.component.css']
})
export class AccountCreationComponent {
  username = '';
  email = '';
  password = '';

  errorMessage: string | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private accountDataService: AccountDataService
  ) { }

  onSubmit() {
    const payload = {
      username: this.username,
      email: this.email,
      password: this.password
    };

    this.http.post('http://localhost:3000/create-account', payload).subscribe(
      (response) => {
        console.log('Account created:', response);
        this.accountDataService.changeUsername(this.username);
        this.accountDataService.changeEmail(this.email);
        // Navigate to the details page
        console.log("Navigating with state:", { username: this.username, email: this.email });
        this.router.navigate(['/details'], { state: { username: 'testUser', email: 'testEmail' } });
        //this.router.navigate(['/details'], { state: { username: this.username, email: this.email } });
      },
      (error) => {
        console.log('Error:', error);
        if (error.status === 409) {
          // Handle conflict, i.e., email already exists
          alert('Email already exists.');
        } else {
          // Handle other types of errors
          alert('An error occurred.');
        }
      }
    );
  }
}



