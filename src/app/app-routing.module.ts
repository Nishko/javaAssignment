import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccountCreationComponent } from './account-creation/account-creation.component';
import { DetailsComponent } from './details/details.component';
import { LoginComponent } from './login/login.component';
import { ActiveChatGroupsComponent } from './active-chat-groups/active-chat-groups.component';

const routes: Routes = [
  { path: 'create-account', component: AccountCreationComponent },
  { path: 'login', component: LoginComponent },
  { path: 'active-chat-groups', component: ActiveChatGroupsComponent },
  { path: '', component: AccountCreationComponent },
  { path: 'details', component: DetailsComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

