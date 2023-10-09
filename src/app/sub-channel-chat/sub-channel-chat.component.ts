import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GroupService } from '../group.service';
import { ChatMessage } from '../models/chat-message.model';
import { AuthService } from '../auth.service';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { io } from 'socket.io-client';

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
      this.messages.push(message);
      this.messages = [...this.messages];
      localStorage.setItem(`messages_${subChannelId}`, JSON.stringify(this.messages));
    });
    // Image Upload 
    this.socket.on('new-image', (imagePath: string) => {
      console.log("Received imagePath:", imagePath);  // <-- Added this line
      this.messages.push({ type: 'image', content: imagePath, sender: this.currentUsername || 'Unknown', timestamp: new Date().toISOString() });
      this.messages = [...this.messages];
      localStorage.setItem(`messages_${subChannelId}`, JSON.stringify(this.messages));
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
    const userId = this.authService.getUserId();
    this.groupService.getUserDetailsById(userId).subscribe(
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
        const uniqueUserIds = Array.from(new Set(data.map(message => message.userId))).filter(Boolean) as number[];

        forkJoin(
          uniqueUserIds.map(userId => this.groupService.getUserDetailsById(userId))
        ).subscribe(
          userDetailsArray => {
            const userDetailsMap = Object.fromEntries(
              uniqueUserIds.map((userId, index) => [userId, userDetailsArray[index]])
            );

            this.messages = data.map(message => {
              const avatarPath = userDetailsMap[message.userId ?? -1]?.avatarPath || '';
              return {
                ...message,
                sender: userDetailsMap[message.userId ?? -1]?.username || 'Unknown',
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

  onImageSelected(event: any): void {
    this.selectedImage = event.target.files[0];
    if (this.selectedImage) {
      const reader = new FileReader();
      reader.readAsDataURL(this.selectedImage);
      reader.onload = () => {
        this.socket.emit('send-image', reader.result);
      };
    }
  }

  uploadImage(event: any): void {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('image', file, file.name);

    // Use the service method to handle HTTP requests:
    this.groupService.uploadImage(formData).subscribe(response => {
      const imagePath = response.imagePath;
      const newChatMessage: ChatMessage = {
        userId: this.authService.getUserId(),
        channelId: Number(this.route.snapshot.params['id']),
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
    const userId = this.authService.getUserId();
    const subChannelId = this.route.snapshot.params['id'];

    if (this.newMessage.trim() !== '') {
      const newChatMessage: ChatMessage = {
        userId,
        channelId: Number(subChannelId),
        type: 'text',
        content: this.newMessage,
        timestamp: new Date().toISOString()
      };
      this.socket.emit('send-message', newChatMessage);
      this.messages.push({ ...newChatMessage, sender: this.currentUsername || 'Unknown' });
      this.newMessage = '';
    }

    if (this.selectedImage) {
      // Handle image sending here
      const formData = new FormData();
      formData.append('image', this.selectedImage, this.selectedImage.name);
      this.groupService.uploadImage(formData).subscribe(response => {
        const imagePath = response.imagePath;
        const newChatMessage: ChatMessage = {
          userId,
          channelId: Number(subChannelId),
          type: 'image',
          content: imagePath,
          timestamp: new Date().toISOString()
        };
        this.socket.emit('send-message', newChatMessage);
      });
      this.selectedImage = undefined; // Reset after sending
    }

    this.messages = [...this.messages];
    localStorage.setItem(`messages_${subChannelId}`, JSON.stringify(this.messages));
  }
}
