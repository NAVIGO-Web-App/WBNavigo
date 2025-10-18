<<<<<<< HEAD

=======
# NAVIGO - A Campus Quest Adventure
**Project Overview**
- NAVIGO is a location-based game for university students that encourages exploration through quests, treasure hunts and rewards. The application consists of:
  - **Frontend**:  Vite, TypeScript React.js + Tailwind CSS, shadcn-ui
  -  **Backend**: Node.js + Express.js
  -  **Database**: Firebase Firestore
  -  **Authentication**: Firebase Auth
  -  **External API**: Google Maps APi for location verification

- We are using the Agile and SCRUM Methodology.
        
**Documentation Hosting**
- https://navigo-documentation.netlify.app/
- Hosted using Netlify
  
**Repository Structure**
- The source codes are stored in the source folder and compiled there.
- The main branch is used to store build files which are compiled to run static files.
  - Our deployment to Netlify is done from main branch.
    
- The other branches are created by each member for their commits and changes to the main branch. This is done to ensure a clean workflow for each member.

**Git Methodology**

Git is used for version control, allowing the team to track changes, collaborate, and maintain a history of the project. The methodology includes:

 **Branching Strategy**

* **Main Branch (`main`/`master`)**: Always stable and deployable.
* **Feature Branches**: Created for each new feature or task.

  * Naming convention: `contributor-name/feature-name`
* **Bugfix Branches**: For fixing issues in the project.

  * Naming convention: `contributor-name/bugfix-name`
* **Merge Strategy**: Feature or bugfix branches are merged into `main` after code review.

### **Commit Practices**

* Commit frequently with small, meaningful changes.
* Use clear messages that describe the change:

  
  git commit -m "Add login functionality with Firebase Auth"

* Include references to task IDs or issue numbers when relevant.

### **Pull Requests / Code Review**

* Team members create a pull request (PR) before merging to `main`.
* PRs are reviewed by at least one other team member to ensure code quality and consistency.

### **Versioning & Releases**

* Tag releases when reaching milestones:

  
  git tag -a v1.0 -m "Initial working version"
  
* Helps track progress and rollback if needed.

### **Collaboration Workflow**

* All team members pull the latest changes before starting work:

  
  git pull origin main
  
* Push changes to the feature branch, then create a PR for merging.


**Running the project**
- Install Node.js & npm
- Verify with:
  node -v
  npm -v
- Navigate to Project & Install Dependencies
  cd your-project
  npm install
- Set Up TailwindCSS
  npm install -D tailwindcss postcss autoprefixer
  npx tailwindcss init -p
- In your CSS file:
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
- Run Tailwind build:
  npm run dev
- Run server:
  node server.js
  or
  npx nodemon server.js
  
**Testing Strategy**
- Unit Testing : Jest
- Integration Testing : Cypress
- API Testing : Postman
  
**Contributors**
- Katleho Sefuba
- Kgaogelo Nkwana
- Yanga Peter
- Yonwaba Vunda
- Yamkela Vutula
- Kuhle Bikitsha

>>>>>>> 11a75aa2258d3e6ed976247f71bb1cc4fb91b70d
