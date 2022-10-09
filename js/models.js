"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/******************************************************************************
 * Story: a single story in the system
 */

class Story {

  /** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** Parses hostname out of URL and returns it. */

  getHostName() {
    //hold obj with url info
    let url = new URL(this.url);
    //return the hostname from the url obj
    return url.hostname;
  }
}


/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  static async getStories() {

    // query the /stories endpoint (no auth required)
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "GET",
    });

    // turn plain old story objects from API into instances of Story class
    const stories = response.data.stories.map(story => new Story(story));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  /** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   * 
   * auth required
   */

  async addStory(user, {title, author, url}) {
    const token = user.loginToken;
    const response = await axios({
      method: "POST",
      url: `${BASE_URL}/stories`,
      data: {
        token, 
        story: {title, author, url} 
      },
    });

    const story = new Story(response.data.story);
    //add the story to the top of the stories arr
    this.stories.unshift(story);
    //add the story to the users ownStories[]
    currentUser.ownStories.push(story);

    return story;
  }


  /** Remove story data from API, removes a Story instance, 
   * removes it from story list and ownStories list.
   * 
   * - user - the current instance of User who will remove the story
   * - storyId - the target story to remove
   *
   *  auth required
   */

   async removeStory(user, storyId) {
    const token = user.loginToken;

    //call to api
    const response = await axios({
      url: `${BASE_URL}/stories/${storyId}`,
      method: "DELETE",
      data: { token: user.loginToken },
    });

      //use lodash to filter out story from the instance of storyList
    this.stories = _.filter(this.stories, function(s) {
      return s.storyId !== storyId;
    })
      //use lodash to filter out story from current user's ownStories[]
      user.ownStories = _.filter(user.ownStories, function(s) {
      return s.storyId !== storyId;
    })

}
}




/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

  constructor({
                username,
                name,
                createdAt,
                favorites = [],
                ownStories = []
              },
              token) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map(s => new Story(s));
    this.ownStories = ownStories.map(s => new Story(s));

    // store the login token on the user so it's easy to find for API calls.
    this.loginToken = token;
  }

  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(username, password, name) {
    const response = await axios({
      url: `${BASE_URL}/signup`,
      method: "POST",
      data: { user: { username, password, name } },
    });

    let { user } = response.data

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** Login in user with API, make User instance & return it.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await axios({
      url: `${BASE_URL}/login`,
      method: "POST",
      data: { user: { username, password } },
    });

    let { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   * 
   *  auth required
   */

  static async loginViaStoredCredentials(token, username) {
    //try to get user info from api
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token },
      });

      //object to hold user data from api response
      let { user } = response.data;

      //create a new instance of User with user info from api response
      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        token
      );
      //catch a failed login attempt and display error in the console
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  };

  /** Add or remove favorites from user and update api*/

  //push story to user favorites[] > call handleFavoriteStories()
  async addFavorite(story) {
 
    //push story to favorites[]
    this.favorites.push(story);

    //call handleFavoriteStories > pass api call method and story 
    //"push" should evaluate to "POST" 
    await this.handleFavoriteStories("push", story);
  };

  //remove story and update user favorites[] > call handleFavoriteStories()
  async removeFavorite(story) {
   
    //update user favorites[] by filtering out story passed as an argument
    this.favorites = this.favorites.filter(i => i.storyId !== story.storyId);

    //call handleFavoriteStories and pass api call method and story > 
    //"remove" should evaluate to "DELETE"
    await this.handleFavoriteStories("remove", story);
  };

  
   // call api to post or delete story based on method passed as apiCallMethod - auth required
   
  async handleFavoriteStories(apiCallMethod, story) {
    //if we are adding the story, method = POST, if we are removing, method = DELETE
    const method = apiCallMethod === "push" ? "POST" : "DELETE";

    //call api using method variable
    const token = this.loginToken;
    await axios({
      url: `${BASE_URL}/users/${this.username}/favorites/${story.storyId}`,
      method: method,
      data: { token },
    })

    
  };

  //checks if story is part of the users favorites[] > returns true or false
  isInFavorites(story) {
    return this.favorites.some(i => (i.storyId === story.storyId));
  }

  /** 
   * checks if story is part of the users ownStories[] > returns true or false 
   */

  isOwnStory(story) {
    return this.ownStories.some(i => (i.storyId === story.storyId));
  }
  
}
