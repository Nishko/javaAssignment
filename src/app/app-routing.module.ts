import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccountCreationComponent } from './account-creation/account-creation.component';
import { DetailsComponent } from './details/details.component';
import { LoginComponent } from './login/login.component';
import { ActiveChatGroupsComponent } from './active-chat-groups/active-chat-groups.component';
import { ChannelComponent } from './channel/channel.component';
import { AdminComponent } from './admin/admin.component';

const routes: Routes = [
  { path: 'admin', component: AdminComponent },
  { path: 'create-account', component: AccountCreationComponent },
  { path: 'login', component: LoginComponent },
  { path: 'active-chat-groups', component: ActiveChatGroupsComponent },
  { path: 'channel/:id', component: ChannelComponent },
  { path: '', component: AccountCreationComponent },
  { path: 'details', component: DetailsComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

