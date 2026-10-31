# studypot

**CodePath WEB103 Final Project**

**Designed and developed by:** 
Dinakar Balehonniga Lingaraju
Manushri Muruga Kumar
Khushal Sai
Tsheten Sherpa

**Link to deployed app:** Coming soon 

## About

### Description and Purpose

studypot is a web application that helps college students find and connect with others who want to study together. Students can create study sessions, explore sessions based on subjects, and join groups that match their interests and schedules.

The purpose of studypot is to make group studying easier and more organized. Instead of relying on group chats or asking around to find study partners, students can use one platform to discover study opportunities and collaborate with their peers.

Our goal is to create a simple, user-friendly space where students can stay motivated, share knowledge, and build better study habits together.

### Inspiration

Finding a study partner isn't always easy, especially when students have different class schedules or don't know many people taking the same courses. Most students end up asking in group chats or making last-minute plans, which can get messy.

We wanted to build something that makes this process simpler. studypot brings study sessions into one place so students can see what's happening, organize their own sessions, and meet people who are studying similar subjects. The idea is to make studying with others more accessible and less stressful.

## Tech Stack

**Frontend:** React, React Router, JavaScript, HTML, CSS

**Backend:** Node.js, Express.js, REST API

**Database:** PostgreSQL

**Deployment:** Render 

## Features

The features below are **planned** for the final app. We will check them off and add demo GIFs as we implement them in later milestones.

### 1. Study Session Dashboard

Students can browse upcoming study sessions in one place. Each session card will show useful information like the subject, date, time, and location so students can quickly decide which sessions interest them.

- [ ] Implemented
- **Demo GIF:** To be added

### 2. Create a Study Session

Students can create a study session by entering a title, subject, date, time, location, and short description. Once saved, the new session will appear in the dashboard for others to discover.

- [ ] Implemented
- **Demo GIF:** To be added

### 3. Edit and Delete Sessions

Students can update the details of sessions they created or delete sessions they no longer want to host. Changes will be saved to the database and reflected in the app.

- [ ] Implemented
- **Demo GIF:** To be added

### 4. Join and Leave Study Sessions

Students can join sessions they are interested in and leave them if their plans change. The app will keep track of which students are attending each session.

- [ ] Implemented
- **Demo GIF:** To be added

### 5. Study Session Details

Students can open a dedicated page for any study session to see its full description, subject, schedule, location, and list of participants.

- [ ] Implemented
- **Demo GIF:** To be added

### 6. Search and Filter Sessions

Students can search for study sessions and filter them by subject or date. This will help them find relevant sessions without scrolling through every available option.

- [ ] Implemented
- **Demo GIF:** To be added

### 7. Create Session Modal

Students can open a modal from the dashboard to create a study session without leaving the page. After submitting the form, the dashboard will update to show the new session.

- [ ] Implemented
- **Demo GIF:** To be added

## Installation Instructions

### Prerequisites

- Node.js 20.19+ and npm

### Run the app locally

1. Install dependencies from the repository root:

   ```sh
   npm install
   ```

2. Start the React frontend and Express API together:

   ```sh
   npm run dev
   ```

3. Open the frontend at `http://localhost:5173`. The page displays the API connection status.

The API runs at `http://localhost:3000`; its `GET /api/health` endpoint returns a JSON status response. Vite proxies `/api` requests to the backend during development.
