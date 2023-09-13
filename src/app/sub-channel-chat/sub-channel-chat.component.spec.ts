import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubChannelChatComponent } from './sub-channel-chat.component';

describe('SubChannelChatComponent', () => {
  let component: SubChannelChatComponent;
  let fixture: ComponentFixture<SubChannelChatComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SubChannelChatComponent]
    });
    fixture = TestBed.createComponent(SubChannelChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
