I want to implement 4 new phases.  Before changing anything, make concrete plans for each phases and update all of the Get Shit Done planning docs.  Ask questions if you need any clarifications.  Then execute in parallel, if possible, using subagents.

1. 
Goal: Google sign-in so I can view the admin features within my site.  

On the top-right in the nav bar, I want a sign-in button (if signed in, it should be a blue circle with 
my initial in white).

This will allow me to see the admin features of my site.  It will also allow me to see projects in
my repo that are private.

Scope: only touch the navbar of the UI, and the backend code that is required to enable sign-in with Google.

Constraints: don't touch any other copy, frontend functionality, or anything else other than my sign-in.

Acceptance Criteria: When I first visit the site (or any of the subfolders before I sign in), it should say "Sign in" in the top-right of the screen, in the nav bar.  When I click on it, it should ask me to sign-in with google.  When I sign-in successfully, it returns me to whatever screen I was on, with the sign-in button gone, replaced by a blue circle with a white "D" in it.

Output format: unified diff only

2. MVP Admin features
Goal: I want a new section of my site.  It should include a new navbar option that says "Control Center" that's only available when signed in.  The Control Center has all of my repos displayed as cards, regardless of whether the repo is private or public.   The cards should have the name of the project, last commit, and project Purpose, as sourced from the repo's README.md.  When I click on the card, it opens a new window with that repo's homepage in github

Scope: all new code should be part of the new admin portion of the site and not affect what's visible to a user who is not signed in.  The only user who can see this control center is daniel.weinbeck@gmail.com

3. Additional Admin features:
Goal: Hook into my Todoist account and Display my projects with their to-do lists

Scope: all new code should be part of the new admin portion of the site and not affect what's visible to a user who is not signed in.  The only user who can see this control center is daniel.weinbeck@gmail.com

Acceptance Criteria: when I log in, I see a Control Center option in the nav bar.  When I click on it - I see a Projects Section with my repos, and a To Do Lists section with my Todoist projects.  When I click on a Todoist project, I get the to do lists broken out by section in the board style

4. Change my email address to daniel.weinbeck@gmail.com on the main site.  Update my repo's documentation to make sure everything is up to date.