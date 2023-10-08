import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GroupService } from '../group.service';
import { AuthService } from '../auth.service';
import { ChangeDetectorRef } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-channel',
  templateUrl: './channel.component.html',
  styleUrls: ['./channel.component.css']
})
export class ChannelComponent implements OnInit {
  showAdminRequestButton: boolean = false;
  showCreateSubChannelForm: boolean = false;  // Toggle form visibility
  subChannelName: string = '';  // Bind to form input
  subChannels: any[] = [];  // List to keep track of sub-channels
  error: string | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private groupService: GroupService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    const channelId = this.route.snapshot.params['id'];
    const userId = this.authService.getUserId();
    const userIdStr = userId.toString();

    console.log(`Adding chatter for channel: ${channelId} `); // Debugging

    this.groupService.addChannelMember(channelId, userIdStr).subscribe(
      response => {
        console.log('Added as a chatter');  // Debugging
      },
      error => {
        console.log('Failed to add as a chatter');  // Debugging
        this.error = 'Failed to add as a chatter';
        console.error(error);  // Debugging
      }
    );

    this.showAdminRequestButton = true;  // Show admin request button

    this.fetchSubChannels(channelId);  // Fetch sub-channels from backend
  }

  fetchSubChannels(channelId: string): void {
    this.groupService.getSubChannels(channelId).subscribe(
      (response: any) => {
        this.subChannels = response.data;
        console.log("Has sub channels: ", this.hasSubChannels);
      },
      (error: any) => {
        console.error('Failed to fetch sub-channels:', error);
        this.error = 'Failed to fetch sub-channels. Please try again.';
      }
    );
  }

  requestAdminStatus(): void {
    const channelId = this.route.snapshot.params['id'];
    const userId = this.authService.getUserId();

    console.log(`Requesting admin status for channel ${channelId}`);  // Debugging

    this.groupService.requestGroupAdmin(userId.toString(), channelId).subscribe(
      response => {
        console.log('Successfully sent admin request:', response);  // Debugging
      },
      error => {
        console.log('Failed to send admin request');  // Debugging
        console.error(error);  // Debugging
      }
    );
  }

  createSubChannel(): void {
    const channelId = this.route.snapshot.params['id'];

    console.log(`Preparing to create sub - channel for channel: ${channelId} `);

    this.groupService.createSubChannel(channelId, this.subChannelName)
      .subscribe(
        (response) => {
          console.log('Successfully created sub-channel:', response);
          this.fetchSubChannels(channelId);  // Refresh the list of sub-channels
          this.showCreateSubChannelForm = false;
          this.subChannelName = '';
        },
        (error) => {
          console.log('Failed to create sub-channel');
          console.error(error);
        }
      );
  }

  get hasSubChannels(): boolean {
    return this.subChannels && this.subChannels.length > 0;
  }

  isSuperAdmin(): boolean {
    return this.authService.getRoles().includes('Super Admin');
  }

  isGroupAdmin(): boolean {
    return this.authService.getRoles().includes('Group Admin');
  }

  toggleCreateSubChannelForm(): void {
    this.showCreateSubChannelForm = !this.showCreateSubChannelForm;
  }

  canCreateSubChannel(): boolean {
    return this.isSuperAdmin() || this.isGroupAdmin();
  }
}
