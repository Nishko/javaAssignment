import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GroupService } from '../group.service';
import { AuthService } from '../auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-channel',
  templateUrl: './channel.component.html',
  styleUrls: ['./channel.component.css']
})
export class ChannelComponent implements OnInit {

  showAdminRequestButton: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private groupService: GroupService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    const channelId = this.route.snapshot.params['id'];


    console.log(`Adding chatter for channel: ${channelId}`); // error loggin

    this.groupService.addChatter(channelId).subscribe(
      response => console.log('Added as a chatter'),
      error => {
        console.log('Failed to add as a chatter');
        console.error(error); // error logging
      }
    );
    this.showAdminRequestButton = true;
  }

  requestAdminStatus(): void {
    const channelId = this.route.snapshot.params['id'];
    const userId = this.authService.getUserId();

    // Log channelId to ensure it's correct
    console.log(`Requesting admin status for channel ${channelId}`);

    this.groupService.requestGroupAdmin(userId.toString(), channelId).subscribe(
      response => {
        console.log('Successfully sent admin request:', response);
      },
      error => {
        console.log('Failed to send admin request');
        console.error(error); // error logging
      }
    );
  }
}


