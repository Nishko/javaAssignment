import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable, forkJoin } from 'rxjs';
import { tap, catchError } from 'rxjs';
import { throwError } from 'rxjs';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  constructor(private http: HttpClient, private authService: AuthService) { }

  createGroup(groupName: string): Observable<any> {
    const createdBy = this.authService.getUserId();
    return this.http.post('http://localhost:3000/create-group', { name: groupName, createdBy });
  }

  getActiveGroups(): Observable<any> {
    return this.http.get('http://localhost:3000/get-groups');
  }

  addChannelMember(channelId: string, userId: string): Observable<any> {
    const url = `http://localhost:3000/add-channel-member`;
    const payload = { channelId: channelId, userId: userId };

    return this.http.post(url, payload).pipe(
      tap((response) => {
        console.log('API response:', response);
      }),
      catchError((error) => {
        console.error('API error:', error);
        return throwError(error);
      })
    );
  }

  createSubChannel(channelId: string, subChannelName: string): Observable<any> {
    const url = `http://localhost:3000/api/subchannel/create`;
    const payload = {
      parentChannelId: channelId,
      name: subChannelName
    };

    return this.http.post(url, payload).pipe(
      tap(response => console.log('Sub-channel created:', response)),
      catchError(error => {
        console.error('Failed to create sub-channel:', error);
        return throwError(error);
      })
    );
  }

  requestGroupAdmin(userId: string, channelId: string): Observable<any> {
    return this.http.post('http://localhost:3000/request-group-admin', { userId, channelId });
  }

  getAdminRequests(): Observable<any> {
    return this.http.get('http://localhost:3000/get-admin-requests');
  }

  approveAdminRequest(requestId: number): Observable<any> {
    return this.http.post(`http://localhost:3000/approve-admin-request`, { requestId });
  }

  denyAdminRequest(requestId: number): Observable<any> {
    return this.http.post(`http://localhost:3000/deny-admin-request`, { requestId });
  }

  getUserNameById(userId: number): Observable<string> {
    console.log("Fetching user with ID:", userId);
    return this.http.get<any>(`http://localhost:3000/user/${userId}`).pipe(
      map(response => response.user ? response.user.name : '')
    );
  }

  getChannelNameById(channelId: number): Observable<string> {
    return this.http.get<any>(`http://localhost:3000/channel/${channelId}`).pipe(
      map(response => response.channel ? response.channel.name : '')
    );
  }
}




