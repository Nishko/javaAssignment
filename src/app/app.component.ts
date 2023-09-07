import { Component, OnInit } from '@angular/core';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  isLoggedIn: boolean = false;

  constructor(private authService: AuthService) {
    console.log('AppComponent initialized.');
  }

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isAuthenticated(); // Use a method to check if the user is logged in
  }

  onLogoutClick(): void {
    this.authService.logout();
    this.isLoggedIn = false; // Update the login status after logout
  }

  get loggedInUsername(): string {
    const username = this.authService.getLoggedInUsername();
    console.log('Username in AppComponent:', username);
    return username;
  }
}



