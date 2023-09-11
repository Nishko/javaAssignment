import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GroupService } from '../group.service';  // Update the import based on your project structure
import { Observable } from 'rxjs';

@Component({
  selector: 'app-channel',
  templateUrl: './channel.component.html',
  styleUrls: ['./channel.component.css']
})
export class ChannelComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private groupService: GroupService
  ) { }

  ngOnInit(): void {
    const channelId = this.route.snapshot.params['id'];

    // Assume addChatter is a method in your GroupService that communicates with the back-end
    this.groupService.addChatter(channelId).subscribe(
      response => console.log('Added as a chatter'),
      error => console.log('Failed to add as a chatter')
    );
  }
}

