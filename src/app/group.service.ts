import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable, Subject, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { ChatMessage } from './models/chat-message.model';


@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private apiUrl: string = 'http://localhost:3000';
  public errorSubject = new Subject<string>();

  constructor(private http: HttpClient, private authService: AuthService) { }

  createGroup(groupName: string): Observable<any> {
    const createdBy = this.authService.getUserId();
    return this.http.post(`${this.apiUrl}/create-group`, { name: groupName, createdBy })
      .pipe(
        tap(response => console.log('Group created:', response)),
        catchError(error => {
          console.error('Failed to create group:', error);
          return throwError(error);
        })
      );
  }

  deleteSubChannel(subChannelId: string): Observable<any> {
    const url = `${this.apiUrl}/subchannels/${subChannelId}`;
    console.log('Deleting subchannel with URL:', url);  // Debugging line
    return this.http.delete(url)
      .pipe(
        tap(response => console.log('Deleted subchannel:', response)),
        catchError(error => {
          console.error('Failed to delete subchannel:', error);
          return throwError(error);
        })
      );
  }

  uploadImage(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/upload-image`, formData);
  }

  getActiveGroups(): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-groups`)
      .pipe(
        tap(response => console.log('Fetched groups:', response)),
        catchError(error => {
          console.error('Failed to fetch groups:', error);
          return throwError(error);
        })
      );
  }

  addChannelMember(channelId: string, userId: string): Observable<any> {
    const url = `${this.apiUrl}/add-channel-member`;
    const payload = { channelId, userId };

    return this.http.post(url, payload)
      .pipe(
        tap(response => console.log('Member added:', response)),
        catchError(error => {
          console.error('Failed to add member:', error);
          return throwError(error);
        })
      );
  }

  createSubChannel(channelId: string, subChannelName: string): Observable<any> {
    const url = `${this.apiUrl}/api/subchannel/create`;
    const createdBy = this.authService.getUserId();
    const payload = {
      name: subChannelName,
      channelId,
      createdBy
    };
    console.log('Payload sent to server:', payload);

    return this.http.post(url, payload)
      .pipe(
        tap(response => console.log('Sub-channel created:', response)),
        catchError(error => {
          console.error('Failed to create sub-channel:', error);
          return throwError(error);
        })
      );
  }


  getSubChannels(channelId: string): Observable<any> {
    const url = `${this.apiUrl}/api/subchannel/${channelId}`;
    return this.http.get<any>(url)
      .pipe(
        tap(response => console.log('Fetched sub-channels:', response)),
        catchError(error => {
          console.error('Failed to fetch sub-channels:', error);
          return throwError(error);
        })
      );
  }

  getMessagesForSubChannel(subChannelId: string): Observable<ChatMessage[]> {
    const url = `${this.apiUrl}/api/subchannel/${subChannelId}/messages`;
    return this.http.get<ChatMessage[]>(url)
      .pipe(
        tap(response => {
          console.log('Fetched messages:', response);
          // Log the user IDs
          console.log('User IDs in fetched messages:', response.map(msg => msg.userId));
        }),
        catchError(error => {
          console.error('An error occurred while fetching messages:', error);
          return throwError(error);
        })
      );
  }


  sendMessageToSubChannel(subChannelId: string, message: ChatMessage): Observable<any> {
    if (!subChannelId || isNaN(Number(subChannelId)) || !message.userId || isNaN(Number(message.userId))) {
      console.error('Invalid subChannelId or userId');
      return throwError('Invalid subChannelId or userId');
    }

    if (!message.text || typeof message.text !== 'string') {
      console.error('Invalid message text');
      return throwError('Invalid message text');
    }

    const url = `${this.apiUrl}/api/subchannel/${subChannelId}/sendMessage`;
    return this.http.post(url, message)
      .pipe(
        tap(response => console.log('Message sent:', response)),
        catchError(error => {
          console.error(`Failed to send message to ${url}:`, error);
          return throwError(error);
        })
      );
  }

  requestGroupAdmin(userId: string, channelId: string): Observable<any> {
    const url = `${this.apiUrl}/request-group-admin`;
    return this.http.post(url, { userId, channelId })
      .pipe(
        tap(response => console.log('Requested group admin:', response)),
        catchError(error => {
          console.error('Failed to request group admin:', error);
          this.errorSubject.next('Failed to send message. Please try again.');
          return throwError(error);
        })
      );
  }

  getAdminRequests(): Observable<any> {
    const url = `${this.apiUrl}/get-admin-requests`;
    return this.http.get(url)
      .pipe(
        tap(response => console.log('Fetched admin requests:', response)),
        catchError(error => {
          console.error('Failed to fetch admin requests:', error);
          return throwError(error);
        })
      );
  }

  approveAdminRequest(requestId: number): Observable<any> {
    const url = `${this.apiUrl}/approve-admin-request`;
    return this.http.post(url, { requestId })
      .pipe(
        tap(response => console.log('Admin request approved:', response)),
        catchError(error => {
          console.error('Failed to approve admin request:', error);
          return throwError(error);
        })
      );
  }

  denyAdminRequest(requestId: number): Observable<any> {
    const url = `${this.apiUrl}/deny-admin-request`;
    return this.http.post(url, { requestId })
      .pipe(
        tap(response => console.log('Admin request denied:', response)),
        catchError(error => {
          console.error('Failed to deny admin request:', error);
          return throwError(error);
        })
      );
  }

  getUserDetailsById(userId: number): Observable<{ username: string, avatarPath: string }> {
    const url = `${this.apiUrl}/user/${userId}`;
    return this.http.get<any>(url)
      .pipe(
        map(response => {
          return {
            username: response.user ? response.user.name : '',
            avatarPath: response.user ? response.user.avatarPath : ''
          };
        }),
        catchError(error => {
          console.error('Failed to fetch user details:', error);
          return throwError(error);
        })
      );
  }


  getChannelNameById(channelId: number): Observable<string> {
    const url = `${this.apiUrl}/channel/${channelId}`;
    return this.http.get<any>(url)
      .pipe(
        map(response => response.channel ? response.channel.name : ''),
        catchError(error => {
          console.error('Failed to fetch channel:', error);
          return throwError(error);
        })
      );
  }
}
