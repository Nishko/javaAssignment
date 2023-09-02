import { Component, OnInit } from '@angular/core';
import { ChatService } from './services/chat.service';

@Component({
  selector: 'app-root',
  template: `
    <div *ngIf="!authenticated">
      <label>Username: <input [(ngModel)]="username"></label>
      <label>Password: <input [(ngModel)]="password"></label>
      <button (click)="login()">Login</button>
    </div>
    <div *ngIf="authenticated">
      <!-- User is logged in -->
      <!-- Show appropriate UI based on roles -->
    </div>
  `,
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  authenticated = false;
  username = '';
  password = '';
  userGroups: any[] = [];


  constructor(private chatService: ChatService) { }

  ngOnInit() {

  }

  login() {
    this.chatService.login(this.username, this.password).subscribe(res => {
      this.authenticated = res.authenticated;
      if (this.authenticated) {
        this.chatService.getGroups().subscribe(groups => {
          this.userGroups = groups;
        }, error => {
          console.error('Error whilst fetching grousp:', error);
        });
      }
    });
  }
}
