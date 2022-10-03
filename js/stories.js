"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  return $(`
      <li id="${story.storyId}">
      <span id="blank-star">&#9734;</span>
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

/** gathers form data from $submitForm, 
 * submits post request with currentUser and data, 
 * generates newStory HTML, 
 * puts the new story on the page
 * hides and resets $submitForm
 * */

async function putNewStoryOnPage(evt) {
  console.debug("putNewStoryOnPage", evt);
  evt.preventDefault();
  
  //get the data from the form
  const title = $("#new-story-title").val();
  const author = $("#new-story-author").val();
  const url = $("#new-story-url").val();
  const username = currentUser.username;
  const storyObj = {title, url, author, username};

  //wait for call to addStory()
  const newStory = await storyList.addStory(currentUser, storyObj);

  //put the new story on the page
  const storyMarkup = generateStoryMarkup(newStory);
  $allStoriesList.prepend(storyMarkup);

  //hide the form and reset fields
  $submitForm.hide();
  $submitForm.trigger("reset");
  
}

$("#new-story-form").on('submit', putNewStoryOnPage);


