import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../auth.service';

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

  constructor(private http: HttpClient, private authService: AuthService) {
    // Debugging line to check roles when component is constructed
    console.log('Roles in AuthService at construction:', authService.getRoles());
  }

  ngOnInit(): void {
    this.isSuperAdmin = this.authService.getRoles().includes('Super Admin');
    // Debugging line to check if user is a 'Super Admin'
    console.log('Is Super Admin:', this.isSuperAdmin);

    // Initialize activeGroups from the server
    // Fetch the active groups from your API and populate activeGroups
  }

  createGroup(): void {
    const createdBy = this.authService.getUserId();
    this.http.post<GroupResponse>('/api/create-group', { name: this.groupName, createdBy })
      .subscribe(
        response => {
          this.activeGroups.push({ id: response.groupId, name: this.groupName });
          this.showCreateGroupForm = false;
        },
        (error: HttpErrorResponse) => {
          console.error('Group creation failed:', error);
        }
      );
  }
}





