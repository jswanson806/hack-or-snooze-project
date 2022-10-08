"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

//variable to hold star icon current value
let currStarIcon;
//star icon with no fill
const blankFavStar = '&#9734;';
//star icon filled with gold
const favStar = '&#11088;';


/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  //set storyList to array of story instances
  storyList = await StoryList.getStories(); //in models.js

  //remove the loading message when storyList has been filled
  $storiesLoadingMsg.remove();

  //put the stories on the page
  putStoriesOnPage();
}

function switchFavStarIcon(story){
 //check for loggedIn status
  if(loggedIn === true){
    //check for story in user favorites[] and set correct star icon
    currStarIcon = currentUser.isInFavorites(story) ? favStar : blankFavStar;
    //return markup for star icon
    return `<span id="fav-star">${currStarIcon}</span>`;
  } else {
    //if no user logged in, do not show stars
    currStarIcon = '';
    return '';
  }
}

/** 
 * check for story in ownStories and return markup for trash
 * button 
*/

function appendDeleteIcon(story){
  //check loggedIn status, check if story belongs to user
  if(loggedIn === true && currentUser.isOwnStory(story)){
      //return markup for delete button, uses font awesome library
      return `<button class="btn" id="trash"><i class="fa fa-trash"></i></button>`;
  } else {
    //if user is not logged in or story doesn't belong to user, return empty string
    return '';
  }
}


/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  console.debug("generateStoryMarkup");

  //holds hostname parsed out of URL
  const hostName = story.getHostName(); //in models.js

  //holds correct markup for star icon
  const favStarIcon = switchFavStarIcon(story);

  //holds correct markup for deleteIcon
  const deleteIcon = appendDeleteIcon(story);

  return $(`
      <li id="${story.storyId}">
      ${favStarIcon}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
        ${deleteIcon}
      </li>
    `);
  
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  //empty out the html list of all stories
  $allStoriesList.empty();

  // loop through all story instances > generate HTML > append to $allStoriesList in DOM
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  //show the html stories list
  $allStoriesList.show();
}

/** gathers form data from $submitForm, 
 * submits post request with currentUser and data, 
 * generates newStory HTML, 
 * puts the new story on the page
 * hides and resets $submitForm
 * */

async function putOwnStoryOnPage(evt) {
  console.debug("putNewStoryOnPage", evt);
  evt.preventDefault();
  
  //variables to hold the data from the form, current user's username, and story obj
  const title = $("#new-story-title").val();
  const author = $("#new-story-author").val();
  const url = $("#new-story-url").val();
  const username = currentUser.username;
  const storyObj = {title, url, author, username};

  //holds story instance returned from api response 
  const newStory = await storyList.addStory(currentUser, storyObj); //in models.js

  //holds markup for the story instance
  const $story = generateStoryMarkup(newStory);

  //adds the story markup to the DOM
  $allStoriesList.prepend($story);

  //hide the form and reset fields
  $submitForm.hide();
  $submitForm.trigger("reset");

  //display the stories from the DOM
  $allStoriesList.show();
}

//event listener for new story form submission > calls putNewStoryOnPage
$("#new-story-form").on('submit', putOwnStoryOnPage);


/** 
 * Handles adding or removing favorites and calls functions to make api
 * calls based on adding or removing > updates fav star icon
 * 
 * gets the target story and returns the matching story from storyList by
 * filtering based on storyId
 * 
 * if the story exists in favorites already, it is removed and the fav star
 * is changed to a blank star icon
 * 
 * if the story does not exist in favorites, it is added and the fav star
 * is changed to a gold star icon
 * 
 * */

function addOrRemoveFavorites(evt) {
  console.debug("addOrRemoveFavorites");
  const target = evt.target;

  //references the story id of the story being favorited
  const targetStoryId = target.closest('li').id;

  // use lodash to return the story instance matching the targetStoryId in storyList 
  let story = _.find(storyList.stories, function(i) {
    if(i.storyId === targetStoryId){
      
      return true;
    }
  });

  //check for story in favorites list by calling isInFavorites
  if(currentUser.isInFavorites(story) === false){
    //add the story to favorites if it is not already there
    currentUser.addFavorite(story); //in models.js

    //update favorite icon to gold star
    target.innerHTML = favStar;

  } else {
    //remove the story from favorites if it is already there
    currentUser.removeFavorite(story); //in models.js
  
    //update favorite icon to blank star
    target.innerHTML = blankFavStar;

  }
}

//event listener for click on span containing favorite star icon in all stories list > calls addOrRemoveFavorites
$(".stories-list").on('click', 'span', addOrRemoveFavorites);

/** Gets list of favorite stories from server, generates their HTML, and puts on page. */

function putFavoriteStoriesOnPage() {
  console.debug("putFavoriteStoriesOnPage");

  //empty out the html list of fav stories
  $favStoriesList.empty();

  // loop through fav stories > generate HTML > append to $favStoriesList
  for (let story of currentUser.favorites) {
    const $story = generateStoryMarkup(story);
    $favStoriesList.append($story);
  }

  //reveal the html fav stories list
  $favStoriesList.show();
}

async function deleteStory(evt) {
  console.debug('removeStory');
  const target = evt.target;
  
  //gets the story id of the story being removed
  const targetStoryId = target.closest('li').id;

  //call to api to delete story
  await  storyList.removeStory(currentUser, targetStoryId); //in models.js

  //hide all stories and refresh the stories on page
  $allStoriesList.hide();
  putStoriesOnPage();

}

//event listener for click on button containing trash icon > calls deleteStory()
  $(".stories-list").on('click', 'button', deleteStory);

