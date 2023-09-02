import { Component, OnInit } from '@angular/core';
import { ChatService } from './services/chat.service';
//import { NgForm } from '@angular/forms';

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
  title(title: any) {
    throw new Error('Method not implemented.');
  }
  authenticated = false;
  username = '';
  password = '';
  //Help display correct nav bar items
  isGroupAdmin = false;
  isSuperAdmin = false;
  userGroups = [
    { name: 'Group 1', channels: ['Channel 1', 'Channel 2'] },
    { name: 'Group 2', channels: ['Testing 1', 'Testing 2'] }
  ];


  constructor(private chatService: ChatService) { }

  ngOnInit() {

  }

  login() {
    if (this.username === 'super' && this.password === '123') {
      this.authenticated = true;
      this.isSuperAdmin = true;
    } else if (this.username === 'rowan' && this.password === 'rowan123') {
      this.authenticated = true;
      this.isGroupAdmin = true;
    } else if (this.username === 'joseph' && this.password === 'joseph123') {
      this.authenticated = true;
    } else {
      alert('Invalid username or password. Please try again.');
    }
  }



  logout() {
    this.authenticated = false;
    this.isGroupAdmin = false;
    this.isSuperAdmin = false;
  }
}
