import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.css']
})
export class DetailsComponent implements OnInit {

  username: string = '';
  email: string = '';
  roles: string[] = [];
  userId: number = 0;

  constructor(private authService: AuthService, private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    console.log("Details component initialized.");

    this.username = this.authService.getLoggedInUsername();
    this.email = this.authService.getLoggedInEmail();
    this.roles = this.authService.getRoles();
    this.userId = this.authService.getUserId();
  }

  deleteAccount(): void {
    if (confirm("Are you sure you want to delete your account? This action is irreversible.")) {
      this.http.delete(`http://localhost:3000/api/user/${this.userId}`).subscribe(
        (response) => {
          console.log('Account successfully deleted');
          // Logout the user and navigate them to the login page
          this.authService.logout();
          this.router.navigate(['/login']);
        },
        (error) => {
          console.log('Error deleting account', error);
        }
      );
    }
  }
}








