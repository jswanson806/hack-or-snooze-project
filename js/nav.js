"use strict";

/******************************************************************************
 * Handling navbar clicks and updating navbar
 */

/** Show main list of all stories when click site name */

function navAllStories(evt) {
  console.debug("navAllStories", evt);
  hidePageComponents(); //in main.js
  putStoriesOnPage(); //in stories.js
}

$body.on("click", "#nav-all", navAllStories);

/** Show login/signup on click on "login" */

function navLoginClick(evt) {
  console.debug("navLoginClick", evt);
  hidePageComponents(); //in main.js
  $loginForm.show();
  $signupForm.show();
}

$navLogin.on("click", navLoginClick);

/** When a user first logs in, update the navbar to reflect that. */

function updateNavOnLogin() {
  console.debug("updateNavOnLogin");
  $(".main-nav-links").show();
  $navLogin.hide();
  $navLogOut.show();
  $navUserActions.show();
  $navUserProfile.text(`${currentUser.username}`).show();
  $allStoriesList.hide();
  putStoriesOnPage(); //in stories.js
}

/**  Show New Post Form on click on "Submit"  */

function navSubmitClick(evt) {
  console.debug("navPostClick", evt);
  hidePageComponents(); //in main.js
  $allStoriesList.hide();
  $submitForm.show();
}

$navSubmit.on('click', navSubmitClick);

function navFavoritesClick(evt) {
  console.debug("navFavoritesClick", evt);
  hidePageComponents(); //in main.js
  putFavoriteStoriesOnPage(); //in stories.js
  $favStoriesList.show();
}

$navFavorites.on('click', navFavoritesClick);