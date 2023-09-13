import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GroupService } from '../group.service';
import { ChatMessage } from '../models/chat-message.model';
import { AuthService } from '../auth.service';
import { forkJoin, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private groupService: GroupService,
    private authService: AuthService
  ) {
    this.loadCurrentUsername();
  }

  ngOnInit(): void {
    const subChannelId = this.route.snapshot.params['id'];
    const savedMessages = localStorage.getItem(`messages_${subChannelId}`);
    if (savedMessages) {
      this.messages = JSON.parse(savedMessages);
    }
    this.loadCurrentUsername();

    this.authService.getAuthStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuthenticated => {
        if (isAuthenticated) {
          this.loadMessages(subChannelId);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

            // Storing messages to localStorage
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

    this.groupService.sendMessageToSubChannel(subChannelId, newChatMessage).subscribe(
      () => {
        this.messages.push({ ...newChatMessage, sender: this.currentUsername || 'Unknown' });

        this.messages = [...this.messages];

        // Storing messages to localStorage
        localStorage.setItem(`messages_${subChannelId}`, JSON.stringify(this.messages));
        this.newMessage = '';
      },
      error => {
        console.error('Failed to send message:', error);
        this.errorMessages.push('Failed to send message.');
      }
    );
  }
}
