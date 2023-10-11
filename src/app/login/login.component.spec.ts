import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { LoginComponent } from './login.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: AuthService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [HttpClientTestingModule, FormsModule],
      providers: [AuthService, { provide: Router, useClass: class { navigate = jasmine.createSpy('navigate'); } }]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router = TestBed.get(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should log in successfully and navigate to details', () => {
    const user = { username: 'test', email: 'test@example.com' };
    spyOn(authService, 'login').and.returnValue(of(user));

    component.email = 'test@example.com';
    component.password = 'password';
    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password');
    expect(router.navigate).toHaveBeenCalledWith(['/details'], { state: { username: user.username, email: user.email } });
  });

  it('should display an error message on login failure', () => {
    const errorResponse = new HttpErrorResponse({
      error: 'test 404 error',
      status: 404,
      statusText: 'Not Found'
    });

    spyOn(authService, 'login').and.returnValue(throwError(errorResponse));

    component.email = 'wrong@example.com';
    component.password = 'wrongpassword';
    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith('wrong@example.com', 'wrongpassword');
    expect(component.errorMessage).toBe('Invalid email or password');
  });
});
