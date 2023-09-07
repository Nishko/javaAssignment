import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActiveChatGroupsComponent } from './active-chat-groups.component';

describe('ActiveChatGroupsComponent', () => {
  let component: ActiveChatGroupsComponent;
  let fixture: ComponentFixture<ActiveChatGroupsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ActiveChatGroupsComponent]
    });
    fixture = TestBed.createComponent(ActiveChatGroupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
