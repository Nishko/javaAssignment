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
}

