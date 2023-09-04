import { Component, OnInit } from '@angular/core';
import { AccountDataService } from '../account-data.service'; // Import the service

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.css']
})
export class DetailsComponent implements OnInit {

  username: string = '';
  email: string = '';

  // Inject the service in the constructor
  constructor(private accountDataService: AccountDataService) { }

  ngOnInit(): void {
    console.log("Details component initialized.");

    // Subscribe to username and email changes from the service
    this.accountDataService.currentUsername.subscribe(username => this.username = username);
    this.accountDataService.currentEmail.subscribe(email => this.email = email);
  }
}




