import { Component } from '@angular/core';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {


  constructor(private authService: AuthService) {
    console.log('AppComponenet initialized.');
  }

  // Create a getter to retrieve the logged-in username
  get loggedInUsername(): string {
    const username = this.authService.getUsername();
    console.log('Username in AppComponent:', username); // Log here
    return username;
  }
}

