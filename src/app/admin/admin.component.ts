import { Component, OnInit } from '@angular/core';
import { GroupService } from '../group.service';
import { forkJoin, map } from 'rxjs';
import { of, EMPTY, catchError } from 'rxjs';

interface AdminRequest {
  id: number;
  user_id: number;
  channel_id: number;
  status: string;
  userName?: string;
  channelName?: string;
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  adminRequests: AdminRequest[] = [];

  constructor(private groupService: GroupService) { }

  ngOnInit(): void {
    this.fetchAdminRequests();
  }

  fetchAdminRequests(): void {
    this.groupService.getAdminRequests().pipe(
      catchError(err => {
        console.error('Error fetching admin requests:', err);
        return EMPTY;
      })
    ).subscribe(
      data => {
        console.log("Fetched admin requests:", data);
        const requests = data.adminRequests as AdminRequest[];

        const augmentedRequests = requests.map((request: AdminRequest) => {
          const userDetails$ = this.groupService.getUserDetailsById(request.user_id).pipe(
            catchError(err => {
              console.error('Error fetching user details:', err);
              return of({ username: 'Unknown', avatarPath: '' });
            })
          );
          const channelName$ = this.groupService.getChannelNameById(request.channel_id).pipe(
            catchError(err => {
              console.error('Error fetching channel name:', err);
              return of('Unknown');
            })
          );
          return forkJoin([userDetails$, channelName$]).pipe(
            map(([userDetails, channelName]) => {
              return { ...request, userName: userDetails.username, channelName };
            })
          );
        });

        forkJoin(augmentedRequests).pipe(
          catchError(err => {
            console.error('Error in forkJoin:', err);
            return EMPTY;
          })
        ).subscribe(
          augmentedData => {
            this.adminRequests = augmentedData;
          }
        );
      },
      () => {
        console.log('Fetching of admin requests complete.');
      }
    );
  }


  approveRequest(requestId: number): void {
    this.groupService.approveAdminRequest(requestId).subscribe(
      response => {
        console.log('Successfully approved request:', response);
        // Remove the approved request from the list
        this.adminRequests = this.adminRequests.filter(request => request.id !== requestId);
      },
      error => {
        console.error('Failed to approve request:', error);
      }
    );
  }

  denyRequest(requestId: number): void {
    this.groupService.denyAdminRequest(requestId).subscribe(
      response => {
        console.log('Successfully denied request:', response);
        // Remove the denied request from the list
        this.adminRequests = this.adminRequests.filter(request => request.id !== requestId);
      },
      error => {
        console.error('Failed to deny request:', error);
      }
    );
  }
}
