import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GroupService } from '../group.service';
import { ChatMessage } from '../models/chat-message.model';
import { AuthService } from '../auth.service';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { io } from 'socket.io-client';
import { ChangeDetectorRef, NgZone } from '@angular/core';


@Component({
  selector: 'app-sub-channel-chat',
  templateUrl: './sub-channel-chat.component.html',
  styleUrls: ['./sub-channel-chat.component.css']
})
export class SubChannelChatComponent implements OnInit, OnDestroy {
  public messages: ChatMessage[] = [];
  public newMessage: string = '';
  public currentUsername?: string;
  public errorMessages: string[] = [];
  private socket: any;
  private destroy$ = new Subject<void>();
  selectedImage?: File;

  constructor(
    private route: ActivatedRoute,
    private groupService: GroupService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.loadCurrentUsername();
  }

  ngOnInit(): void {
    const subChannelId = this.route.snapshot.params['id'];
    this.loadMessagesFromLocalStorage(subChannelId);
    this.loadCurrentUsername();
    this.socket = io('http://localhost:3000', { withCredentials: true });

    // Listen to new messages
    this.socket.on('new-message', (message: ChatMessage) => {
      this.ngZone.run(() => {  // Using NgZone to ensure Angular picks up the changes
        this.messages.push(message);
        this.messages = [...this.messages];
        localStorage.setItem(`messages_${subChannelId}`, JSON.stringify(this.messages));
      });
    });

    this.authService.getAuthStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuthenticated => {
        if (isAuthenticated) {
          this.loadMessages(subChannelId);
          this.loadMessagesFromLocalStorage(subChannelId);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.socket.disconnect();
  }

  isAdminOrGroupAdmin(): boolean {
    const roles = this.authService.getRoles();
    return roles.includes('Super Admin') || roles.includes('Group Admin');
  }

  deleteSubChannel(): void {
    if (window.confirm('Are you sure you want to delete this subchannel?')) {
      const subChannelId = this.route.snapshot.params['id'];
      this.groupService.deleteSubChannel(subChannelId).subscribe(
        () => {
          this.router.navigate(['/active-chat-groups']);
        },
        (error) => {
          console.error('Failed to delete subchannel:', error);
        }
      );
    }
  }

  loadCurrentUsername(): void {
    const userId = this.authService.getUserId().toString();
    this.groupService.getUserDetailsById(String(userId)).subscribe(
      userDetails => {
        this.currentUsername = userDetails.username;
      },
      error => {
        console.error('Failed to fetch user details:', error);
        this.errorMessages.push('Failed to fetch user details.');
      }
    );
  }

  loadMessagesFromLocalStorage(subChannelId: string): void {
    const savedMessages = localStorage.getItem(`messages_${subChannelId}`);
    if (savedMessages) {
      this.messages = JSON.parse(savedMessages);
    }
  }

  loadMessages(subChannelId: string): void {
    this.groupService.getMessagesForSubChannel(subChannelId).subscribe(
      (data: ChatMessage[]) => {
        console.log('Raw fetched messages:', data);
        const uniqueUserIds = Array.from(new Set(data.map(message => message.userId))).filter(Boolean) as string[];

        forkJoin(
          uniqueUserIds.map(userId => this.groupService.getUserDetailsById(String(userId)))
        ).subscribe(
          userDetailsArray => {
            const userDetailsMap = Object.fromEntries(
              uniqueUserIds.map((userId, index) => [userId, userDetailsArray[index]])
            );
            console.log('userDetailsMap:', userDetailsMap);
            console.log('Complete userDetailsArray:', userDetailsArray);

            this.messages = data.map(message => {
              console.log('message.userId:', message.userId);
              const userIdForMessage = message.userId ?? '-1';
              const userDataFromMap = userDetailsMap[userIdForMessage];
              console.log(`Data for userId ${userIdForMessage} in map:`, userDataFromMap);
              const usernameFromMap = userDataFromMap?.username;
              const avatarPath = userDataFromMap?.avatarPath || '';
              console.log("Extracted username from map:", usernameFromMap);

              return {
                ...message,
                sender: usernameFromMap || 'Unknown',
                avatarPath
              };
            });

            this.messages = [...this.messages];
            localStorage.setItem(`messages_${subChannelId}`, JSON.stringify(this.messages));
          },
          error => {
            console.error('Failed to fetch user details:', error);
            this.errorMessages.push('Failed to fetch user details.');
          }
        );
      },
      error => {
        console.error('Failed to fetch messages:', error);
        this.errorMessages.push('Failed to fetch messages.');
      }
    );
  }



  uploadImage(event: any): void {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('image', file, file.name);

    // Use the service method to handle HTTP requests:
    this.groupService.uploadImage(formData).subscribe(response => {
      const serverAddress = 'http://localhost:3000'; // Include the server address
      const imagePath = `${serverAddress}${response.imagePath}`;
      const newChatMessage: ChatMessage = {
        userId: this.authService.getUserId().toString(), // Convert userId to string
        channelId: this.route.snapshot.params['id'],
        type: 'image',
        content: imagePath,
        timestamp: new Date().toISOString()
      };
      this.socket.emit('send-message', newChatMessage);
    });
  }


  onImageError(event: any) {
    console.error('Error loading the image:', event);
  }

  sendMessage(): void {
    const userId = this.authService.getUserId().toString();
    const subChannelId = this.route.snapshot.params['id'];
    console.log("Current subChannelId:", subChannelId);
    const serverAddress = 'http://localhost:3000'; // Define the server address here to reuse it

    this.ngZone.run(() => {  // Using NgZone here too
      if (this.newMessage.trim() !== '') {
        const newChatMessage: ChatMessage = {
          userId,
          channelId: subChannelId,
          type: 'text',
          content: this.newMessage,
          timestamp: new Date().toISOString()
        };
        this.socket.emit('send-message', newChatMessage);
        this.messages.push({ ...newChatMessage, sender: this.currentUsername || 'Unknown' });
        this.newMessage = '';
      }

      if (this.selectedImage) {
        const formData = new FormData();
        formData.append('image', this.selectedImage, this.selectedImage.name);
        this.groupService.uploadImage(formData).subscribe(response => {
          const imagePath = `${serverAddress}/uploads/${response.imagePath}`;
          const newChatMessage: ChatMessage = {
            userId,
            channelId: subChannelId,
            type: 'image',
            content: imagePath,
            timestamp: new Date().toISOString()
          };
          this.socket.emit('send-message', newChatMessage);
        });
        this.selectedImage = undefined;
      }

      this.messages = [...this.messages];
      localStorage.setItem(`messages_${subChannelId}`, JSON.stringify(this.messages));
    });
  }

}
