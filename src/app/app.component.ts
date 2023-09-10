import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from './auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

  isLoggedIn: boolean = false;
  private authSubscription: Subscription;

  constructor(private authService: AuthService) {
    console.log('AppComponent initialized.');
    this.authSubscription = new Subscription();
  }

  ngOnInit(): void {
    this.authSubscription = this.authService.getAuthStatus().subscribe(isAuthenticated => {
      this.isLoggedIn = isAuthenticated;
    });
  }

  onLogoutClick(): void {
    this.authService.logout();
    // isLoggedIn will be updated through the subscription
  }

  ngOnDestroy(): void {
    this.authSubscription.unsubscribe(); // Unsubscribe to prevent memory leaks
  }

  get loggedInUsername(): string {
    return this.authService.getLoggedInUsername();
  }
}




