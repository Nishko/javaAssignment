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
    this.socket = io('http://localhost:3000');

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
    this.groupService.getUserNameById(userId).subscribe(
      username => {
        this.currentUsername = username;
      },
      error => {
        console.error('Failed to fetch username:', error);
        this.errorMessages.push('Failed to fetch username.');
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
          uniqueUserIds.map(userId => this.groupService.getUserNameById(userId))
        ).subscribe(
          usernames => {
            const userMap = Object.fromEntries(
              uniqueUserIds.map((userId, index) => [userId, usernames[index]])
            );

            this.messages = data.map(message => ({
              ...message,
              sender: userMap[message.userId ?? -1] || 'Unknown'
            }));

            this.messages = [...this.messages];
            localStorage.setItem(`messages_${subChannelId}`, JSON.stringify(this.messages));
          },
          error => {
            console.error('Failed to fetch usernames:', error);
            this.errorMessages.push('Failed to fetch usernames.');
          }
        );
      },
      error => {
        console.error('Failed to fetch messages:', error);
        this.errorMessages.push('Failed to fetch messages.');
      }
    );
  }

  sendMessage(): void {
    if (this.newMessage.trim() === '') return;

    const userId = this.authService.getUserId();
    const subChannelId = this.route.snapshot.params['id'];

    const newChatMessage: ChatMessage = {
      userId,
      channelId: Number(subChannelId),
      text: this.newMessage,
      timestamp: new Date().toISOString()
    };

    this.socket.emit('send-message', newChatMessage);

    this.messages.push({ ...newChatMessage, sender: this.currentUsername || 'Unknown' });
    this.messages = [...this.messages];
    localStorage.setItem(`messages_${subChannelId}`, JSON.stringify(this.messages));
    this.newMessage = '';
  }
}
