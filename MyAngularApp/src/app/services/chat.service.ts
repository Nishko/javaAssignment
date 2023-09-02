import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://localhost:3000';
  constructor(private http: HttpClient) { }

  login(username: string, password: string): Observable<any> {
    return this.http.post('http://localhost:3000/login', { username, password }, { withCredentials: true });
  }

  getGroups(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/groups`);
  }

  promoteUser(username: string) {
    return this.http.post('/api/promoteUser', { username });
  }

  removeUser(username: string) {
    return this.http.delete(`/api/removeUser/${username}`);
  }

  createGroup(groupName: string) {
    return this.http.post('/api/createGroup', { groupName });
  }

  removeGroup(groupName: string) {
    return this.http.delete(`/api/removeGroup/${groupName}`);
  }

  joinChannel(groupName: string, channelName: string) {
    return this.http.post('/api/joinChannel', { groupName, channelName });
  }
}

