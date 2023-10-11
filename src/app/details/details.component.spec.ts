import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetailsComponent } from './details.component';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../auth.service';
import { of } from 'rxjs'; // for mocking observables

describe('DetailsComponent', () => {
  let component: DetailsComponent;
  let fixture: ComponentFixture<DetailsComponent>;
  let httpTestingController: HttpTestingController;
  let authService: AuthService; // Added to use the AuthService in our tests

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DetailsComponent],
      imports: [HttpClientTestingModule, RouterTestingModule], // imported for testing modules
      providers: [AuthService] // provided AuthService
    })
      .compileComponents();

    httpTestingController = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService); // Injected AuthService
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch user avatar on initialization', () => {
    // Mock response data
    const mockResponse = {
      user: {
        avatarPath: 'path_to_avatar'
      }
    };

    // Spy on the fetchAvatarPath method and mock its implementation
    spyOn(component, 'fetchAvatarPath').and.callFake(() => {
      component.avatarPath = mockResponse.user.avatarPath;
    });

    // Call ngOnInit which in turn calls fetchAvatarPath
    component.ngOnInit();

    // Expect the avatarPath to be the mocked one
    expect(component.avatarPath).toEqual(mockResponse.user.avatarPath);
  });

  it('should handle file selection', () => {
    const mockFile = new File([''], 'filename', { type: 'image/jpeg' });
    const event = { target: { files: [mockFile] } };

    component.onFileSelected(event);

    expect(component.selectedFile).toEqual(mockFile);
  });

  it('should upload selected file', () => {
    const mockFile = new File([''], 'filename', { type: 'image/jpeg' });
    const event = { target: { files: [mockFile] } };
    component.onFileSelected(event);

    const mockResponse = { filePath: 'path_to_file' };
    spyOn(component['http'], 'post').and.returnValue(of(mockResponse));

    component.onUpload();

    expect(component.avatarPath).toBe(mockResponse.filePath);
  });

  it('should delete user account', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    spyOn(component['http'], 'delete').and.returnValue(of({}));
    const logoutSpy = spyOn(authService, 'logout');
    const navigateSpy = spyOn(component['router'], 'navigate');

    component.deleteAccount();

    expect(logoutSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});

