import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../auth.service';
import { GroupService } from '../group.service';

interface GroupResponse {
  message: string;
  groupId: number;
}

@Component({
  selector: 'app-active-chat-groups',
  templateUrl: './active-chat-groups.component.html',
  styleUrls: ['./active-chat-groups.component.css']
})
export class ActiveChatGroupsComponent implements OnInit {
  isSuperAdmin: boolean = false;
  showCreateGroupForm: boolean = false;
  groupName: string = '';
  activeGroups: any[] = [];
  groupData: any;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private groupService: GroupService
  ) {
    console.log('Roles in AuthService at construction:', authService.getRoles());
  }

  // Function to check if a user is logged in
  isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  createGroup() {
    this.groupData = { name: this.groupName, createdBy: this.authService.getUserId() };

    this.groupService.createGroup(this.groupName).subscribe(
      (response: GroupResponse) => {
        console.log('Group created successfully', response);
        this.fetchActiveGroups();  // Re-fetch groups after creating
      },
      error => {
        console.log('An error occurred', error);
      }
    );
  }

  fetchActiveGroups() {
    this.groupService.getActiveGroups().subscribe(
      (groups: any) => {
        console.log('Fetched active groups:', groups);
        this.activeGroups = groups as any[];
      },
      error => {
        console.error('Failed to fetch active groups:', error);
      }
    );
  }

  ngOnInit(): void {
    this.isSuperAdmin = this.authService.getRoles().includes('Super Admin');
    console.log('Is Super Admin:', this.isSuperAdmin);
    this.fetchActiveGroups();
  }
}








