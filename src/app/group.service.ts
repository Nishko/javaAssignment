import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

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

  addChatter(channelId: string): Observable<any> {
    const userId = this.authService.getUserId();
    return this.http.post(`http://localhost:3000/add-chatter`, { channelId, userId });
  }

}



