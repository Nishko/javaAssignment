import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-account-creation',
  templateUrl: './account-creation.component.html',
  styleUrls: ['./account-creation.component.css']
})
export class AccountCreationComponent {
  username = '';
  email = '';
  password = '';

  constructor(private http: HttpClient) { }

  onSubmit() {
    const payload = {
      username: this.username,
      email: this.email,
      password: this.password
    };

    this.http.post('http://localhost:3000/create-account', payload).subscribe(
      (response) => {
        console.log('Account created:', response);
      },
      (error) => {
        console.log('Error:', error);
      }
    );
  }
}

