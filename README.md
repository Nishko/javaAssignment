# JavaAssignment: An Angular-based Chat Application

This is a chat application built with Angular, featuring user authentication, group chats, and admin features.

## Table of Contents

1. [Project Organization](#project-organization)
2. [Data Structures](#data-structures)
3. [Angular Architecture](#angular-architecture)
4. [Server-Side Routes](#server-side-routes)
5. [User Interactions](#user-interactions)
6. [Development Setup](#development-setup)
7. [Additional Commands](#additional-commands)

## Project Organization

This project is managed with Git and features two main branches: `main` and a secondary experimental branch. The `main` branch is for stable, well-tested features, while the secondary branch is used for more experimental development.

Commits are made when substantial progress is achieved or when the code is in a stable state for the day.

## Data Structures

The backend relies on a SQLite database (`mydatabase.db`) for persisting information like users, groups, channels, messages, and roles. Additionally, local storage is used to tackle some persistence challenges.

## Angular Architecture

The frontend is structured around multiple Angular components, each serving distinct functionalities. Helper TypeScript files, such as `auth.service.ts` and `group.service.ts`, are created to handle specific tasks like authentication and group management.

## Server-Side Routes

- `GET /get-groups`: Fetches groups to display on the active chat page.
- `POST /create-account`: For account creation.
- `POST /create-group`: Allows admins to create new chat groups.
- `POST /add-channel-member`: Adds a user to a channel group.
- `POST /request-group-admin`: To request admin status for a group.
- `GET /get-admin-requests`: Fetches all admin status requests for Super Admin review.
- `POST /api/subchannel/create`: For creating subchannels.
- `DELETE /subchannels/:id`: To delete subchannels (Admin only).
- ... (Continue with remaining routes)

## User Interactions

Depending on the user's role, different UI elements are visible. For instance:

- Super Admins have special tabs to approve/deny admin requests.
- Authenticated users see the active chat channels, whereas guests do not.
- Various controls are role-specific (Admin-only, Guest-only, etc.).

## Development Setup

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.2.1. Run `ng serve` and navigate to `http://localhost:4200/` for local development.

## Additional Commands

- **Generate Component**: `ng generate component component-name`
- **Build**: `ng build`
- **Unit Tests**: `ng test`
- **End-to-End Tests**: `ng e2e`

For further help with Angular CLI, see the [Angular CLI Overview and Command Reference](https://angular.io/cli).
