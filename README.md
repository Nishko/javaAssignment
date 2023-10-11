# JavaScriptAssignment: Angular-based Chat Application

"JavaScriptAssignment" is a real-time chat application built using Angular. It offers features such as user authentication, group chats, and admin functionalities.

> Developed by Rowan Anderson (s5092185)

## Table of Contents

- [Project Organization](#project-organization)
- [Data Structures](#data-structures)
- [Angular Architecture](#angular-architecture)
- [API Endpoints](#api-endpoints)
- [User Interactions](#user-interactions)
- [Development Setup](#development-setup)
- [Additional Commands](#additional-commands)

## Project Organization

The project utilizes Git for version control, with two primary branches: 
- `main`: Stable, well-tested features.
- `newStart`: Experimental features and ongoing development.

> Note: The `main` branch contains the first part of the assignment, while `newStart` is used for the second part. The `attempt2` branch was a contingency during significant changes.

Commits are structured to reflect milestones and stable checkpoints.

## Data Structures

The application interacts with a MongoDB database (`assignmentCluster`) and local storage, handling entities like users, groups, channels, messages, and roles. A separate test database (`testDatabase`) is also maintained.

### Entities

#### User
- **username**: String (user's name)
- **email**: String (user's login email)
- **password**: Hashed string
- **roles**: Array of strings (user's roles)
- **avatarPath**: String (path to the user's avatar)
- **groups**: Array of group IDs

#### Group
- **name**: String (group name)
- **createdBy**: String (ID of the creator)
- **createdAt**: Date (creation time)

#### Channel
- **name**: String (channel name)
- **createdBy**: String (ID of the creator)
- **createdAt**: Date (creation time)
- **members**: Array of user IDs

#### Sub-channel
- **name**: String (sub-channel name)
- **channelId**: String (parent channel ID)
- **createdBy**: String (ID of the creator)
- **createdAt**: Date (creation time)

#### Message
- **channelId**: String (channel or sub-channel ID)
- **userId**: String (sender's ID)
- **text**: String (message content)
- **timestamp**: Date (sending time)

## Angular Architecture

The frontend is structured around multiple Angular components, each serving distinct functionalities. Helper TypeScript files, such as `auth.service.ts` and `group.service.ts`, are created to handle specific tasks like authentication and group management.

## API Endpoints

Below is a list of available API endpoints with their purpose, required parameters, and return values.

### 1. GET /subscribe

- **Purpose**: Subscribe to events or retrieve specific events if they exist.
- **Parameters**: 
  - `lastEventId` (query parameter)
- **Return values**: If an event with the specified ID exists, it returns the event; otherwise, it keeps the connection open for future events.

### 2. POST /publish

- **Purpose**: Publish a new message to all subscribed clients.
- **Parameters**: 
  - `message` (in the request body)
- **Return values**: Status message indicating the message was published.

### 3. GET /get-groups

- **Purpose**: Retrieve all groups from the database.
- **Parameters**: None
- **Return values**: An array of groups or an error message.

### 4. POST /create-account

- **Purpose**: Create a new user account.
- **Parameters**: 
  - `username`
  - `email`
  - `password` (all in the request body)
- **Return values**: Status message indicating the account was created or an error message.

### 5. POST /create-group

- **Purpose**: Create a new group.
- **Parameters**: 
  - `name`
  - `createdBy` (in the request body)
- **Return values**: Status message with the group's ID or an error message.

### 6. POST /add-channel-member

- **Purpose**: Add a member to a channel.
- **Parameters**: 
  - `channelId`
  - `userId` (in the request body)
- **Return values**: Status message indicating the member was added or an error message.

### 7. POST /request-group-admin

- **Purpose**: Request admin permissions for a group.
- **Parameters**: 
  - `userId`
  - `channelId` (in the request body)
- **Return values**: Status message with the request's ID or an error message.

### 8. GET /get-admin-requests

- **Purpose**: Retrieve all admin requests.
- **Parameters**: None
- **Return values**: An array of admin requests or an error message.

### 9. POST /api/subchannel/create

- **Purpose**: Create a new sub-channel.
- **Parameters**: 
  - `name`
  - `channelId`
  - `createdBy` (in the request body)
- **Return values**: Status message with the sub-channel's ID or an error message.

### 10. DELETE /subchannels/:id

- **Purpose**: Delete a sub-channel and its related messages.
- **Parameters**: 
  - `id` (in the URL)
- **Return values**: Status message indicating the sub-channel was deleted or an error message.

### 11. GET /api/subchannel/:channelId

- **Purpose**: Fetch all sub-channels for a given channel.
- **Parameters**: 
  - `channelId` (in the URL)
- **Return values**: An array of sub-channels or an error message.

### 12. GET /user/:id

- **Purpose**: Fetch a user by their ID.
- **Parameters**: 
  - `id` (in the URL)
- **Return values**: User object or an error message.

### 13. GET /channel/:id

- **Purpose**: Fetch a channel by its ID.
- **Parameters**: 
  - `id` (in the URL)
- **Return values**: Channel object or an error message.

### 14. POST /api/subchannel/:subChannelId/sendMessage

- **Purpose**: Send a message in a specific sub-channel.
- **Parameters**: 
  - `userId`
  - `text` (in the request body)
  - `subChannelId` (in the URL)
- **Return values**: Status message with the message's ID or an error message.

### 15. GET /api/subchannel/:subChannelId/messages

- **Purpose**: Fetch all messages for a specific sub-channel.
- **Parameters**: 
  - `subChannelId` (in the URL)
- **Return values**: An array of messages or an error message.

### 16. DELETE /api/user/:userId

- **Purpose**: Delete a user account.
- **Parameters**: 
  - `userId` (in the URL)
- **Return values**: Status message indicating the user was deleted or an error message.

### 17. POST /upload-avatar

- **Purpose**: Upload a display image for a user.
- **Parameters**: 
  - `avatar` (file in the request body)
  - `userId` (in the request body)
- **Return values**: Status message with the file's path or an error message.

### 18. POST /upload-image

- **Purpose**: Upload an image.
- **Parameters**: 
  - `image` (file in the request body)
- **Return values**: Object containing the image's path or an error message.

### 19. POST /login

- **Purpose**: Log in a user.
- **Parameters**: 
  - `email`
  - `password` (in the request body)
- **Return values**: User object with `username`, `email`, `roles`, `id`, and `avatarPath` or an error message.


## User Interactions

Depending on the user's role, different UI elements are visible. For instance:

- Super Admins have special tabs to approve/deny admin requests.
- Authenticated users see the active chat channels, whereas guests do not.
- Various controls are role-specific (Admin-only, Guest-only, etc.).
- Users can send messages and have them updated in real time.
- Users are displayed in a chat by their username and avatar displayed.

## Development Setup

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.2.1. Run `ng serve` and navigate to `http://localhost:4200/` for local development.

## Additional Commands

- **Generate Component**: `ng generate component component-name`
- **Build**: `ng build`
- **Unit Tests**: `ng test`
- **End-to-End Tests**: `ng e2e`

For further help with Angular CLI, see the [Angular CLI Overview and Command Reference](https://angular.io/cli).
