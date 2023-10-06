import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.css']
})
export class DetailsComponent implements OnInit {

  username: string = '';
  email: string = '';
  roles: string[] = [];
  userId: number = 0;
  selectedFile: File | null = null;
  avatarPath: string = ''; // Added to store the path to the user's avatar

  constructor(private authService: AuthService, private http: HttpClient, private router: Router) { }

  ngOnInit(): void {
    console.log("Details component initialized.");

    this.username = this.authService.getLoggedInUsername();
    this.email = this.authService.getLoggedInEmail();
    this.roles = this.authService.getRoles();
    this.userId = this.authService.getUserId();
    this.fetchAvatarPath(); // Fetch the avatar path on component initialization
  }

  // Fetch the user's avatar path from the server
  fetchAvatarPath(): void {
    this.http.get(`http://localhost:3000/user/${this.userId}`).subscribe(
      (response: any) => {
        this.avatarPath = response.user.avatarPath;
        console.log("Fetched avatarPath:", this.avatarPath);


        // Update the avatarPath if it's the default path
        if (this.avatarPath === "src/assets/image.jpg") {
          this.avatarPath = "/assets/image.jpg";
        }
      },
      (error) => {
        console.log('Error fetching user details', error);
      }
    );
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  onUpload(): void {
    if (this.selectedFile) {
      const uploadData = new FormData();
      uploadData.append('avatar', this.selectedFile, this.selectedFile.name);
      uploadData.append('userId', this.userId.toString());

      this.http.post('http://localhost:3000/upload-avatar', uploadData).subscribe(
        (response: any) => {
          console.log('Image uploaded successfully', response);
          this.avatarPath = response.filePath; // Update the avatarPath after successful upload
        },
        (error) => {
          console.log('Error uploading image', error);
        }
      );
    } else {
      console.log('No file selected');
    }
  }

  deleteAccount(): void {
    if (confirm("Are you sure you want to delete your account? This action is irreversible.")) {
      this.http.delete(`http://localhost:3000/api/user/${this.userId}`).subscribe(
        (response) => {
          console.log('Account successfully deleted');
          // Logout the user and navigate them to the login page
          this.authService.logout();
          this.router.navigate(['/login']);
        },
        (error) => {
          console.log('Error deleting account', error);
        }
      );
    }
  }
}
