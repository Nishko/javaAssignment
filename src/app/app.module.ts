import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AccountCreationComponent } from './account-creation/account-creation.component';
import { DetailsComponent } from './details/details.component';
import { LoginComponent } from './login/login.component';
import { ActiveChatGroupsComponent } from './active-chat-groups/active-chat-groups.component';
import { AdminComponent } from './admin/admin.component';
import { ChannelComponent } from './channel/channel.component';

@NgModule({
  declarations: [
    AppComponent,
    AccountCreationComponent,
    DetailsComponent,
    LoginComponent,
    ActiveChatGroupsComponent,
    AdminComponent,
    ChannelComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
