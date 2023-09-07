import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.css']
})
export class DetailsComponent implements OnInit {

  username: string = '';
  email: string = '';

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    console.log("Details component initialized.");

    // Use the getter methods to retrieve the values
    this.username = this.authService.getLoggedInUsername();
    this.email = this.authService.getLoggedInEmail();
  }
}






