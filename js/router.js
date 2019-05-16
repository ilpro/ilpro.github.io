'use strict';
/** Router init **/
const route = router(SOCKET);

// pages where hashchange event must redirect to the same page
const reloadingPages = { profile: true, partners: true };

// pages that are visible only to logged users
const privatePages = {
  'messages': true,
  'dating': true,
  'subscribe': true,
  'music': true,
  'notifications': true,
  'settings': true,
  'bot': true,
  'bot-chat': true,
  'partners': true,
  'commercial-adware-statistics': true
};

/** Handle URL query changes **/
$(window).on('hashchange', e => {
  let page = urlHash.getState('page');

  // load main page if page not specified in query hash
  if (!page) page = 'main';
  // change page
  if (page !== route.currentPage || page in reloadingPages) {
    // exit if page doesn't exists in router
    if (!(page in route)) return;

    document.title = "Emoment–радио, новости, погода, пробки и гиф-анимация в одном месте";

    // load page and init it
    route[page]();

    // highlight menu item in sidebar
    if (page == "profile") {
      user.launchAfterUserInfoReceived(function () {
        if (user.info && user.info.userId == urlHash.getState('id'))
          sidebarMenu.highlight(page);
        else
          sidebarMenu.highlight("clear");
      });
    }
    else {
      sidebarMenu.highlight(page);
    }

    // change current page to new and add previous page to history
    route.previousPage = route.currentPage;
    route.currentPage = page;
  }
});

function router(socket) {
  /** Page init **/
  return {
    currentPage: '',
    previousPage: '', // to destroy previous page
    socket: socket,

    main() {
      if (user.hash) {
        $(".main-wrapper").load("pages/" + lang.lName + "/news.html", () => {
          user.launchAfterUserInfoReceived(pageMain.init, this.socket, pageMain);
        });
      }
      else
        window.location.hash = "page=news";
    },

    "demo-news"() {
      $(".main-wrapper").load("pages/" + lang.lName + "/feed.html", () => {
        pageDemoNews.init(this.socket);
      });
    },

    messages() {
      if (this.currentPage == 'messages') return;

      $(".main-wrapper").load("pages/" + lang.lName + "/messages.html", () => {
        user.launchAfterUserInfoReceived(pageMessages.init, { socket: this.socket, botsEnabled: false }, pageMessages);
      });
    },

    "bot-chat"() {
      if (this.currentPage == 'bot-chat') return;

      $(".main-wrapper").load("pages/" + lang.lName + "/messages.html", () => {
        user.launchAfterUserInfoReceived(pageMessages.init, { socket: this.socket, botsEnabled: true }, pageMessages);
      });
    },

    chat() {
      if (this.currentPage == 'chat') return;

      $(".main-wrapper").load("pages/" + lang.lName + "/chat.html", () => {
        user.launchAfterUserInfoReceived(chat.init, this.socket, chat);
      });
    },

    news() {
      $(".main-wrapper").load("pages/" + lang.lName + "/news.html", () => {
        user.launchAfterUserInfoReceived(pageMain.init, this.socket, pageMain);
      });
    },

    dating() {
      $(".main-wrapper").load("pages/" + lang.lName + "/dating.html", () => {
        user.launchAfterUserInfoReceived(pageDating.init, this.socket, pageDating);
      });
    },

    subscribe() {
      $(".main-wrapper").load("pages/" + lang.lName + "/subscribe.html", () => {
        user.launchAfterUserInfoReceived(pageSubscribe.init, this.socket, pageSubscribe);
      });
    },

    radio() {
      $(".main-wrapper").load("pages/" + lang.lName + "/radio.html", () => {
        user.launchAfterUserInfoReceived(pageRadio.init, this.socket, pageRadio);
      });
    },

    music() {
      $(".main-wrapper").load("pages/" + lang.lName + "/music.html", () => {
        user.launchAfterUserInfoReceived(pageMusic.init, this.socket, pageMusic);
      });
    },

    "construct-dating"() {
      $(".main-wrapper").load("pages/" + lang.lName + "/construct-widget-dating.html", () => {
        user.launchAfterUserInfoReceived(pageConstructWidgetDating.init, this.socket, pageConstructWidgetDating);
      });
    },

    "construct-widget-comments"() {
      $(".main-wrapper").load("pages/" + lang.lName + "/construct-widget-comments.html", () => {
        user.launchAfterUserInfoReceived(pageConstructWidgetComments.init, this.socket, pageConstructWidgetComments);
      });
    },

    "construct-widget-news"() {
      $(".main-wrapper").load("pages/" + lang.lName + "/construct-widget-news.html", () => {
        user.launchAfterUserInfoReceived(pageConstructWidgetNews.init, this.socket, pageConstructWidgetNews);
      });
    },

    "construct-counter"() {
      $(".main-wrapper").load("pages/" + lang.lName + "/construct-counter.html");
    },

    info() {
      $(".main-wrapper").load("pages/" + lang.lName + "/info.html", () => {
        user.launchAfterUserInfoReceived(pageInfo.init, this.socket, pageInfo);
      });
    },

    notifications() {
      $(".main-wrapper").load("pages/" + lang.lName + "/notifications.html", () => {
        user.launchAfterUserInfoReceived(pageNotifications.init, this.socket, pageNotifications);
      });
    },

    reviews() {
      $(".main-wrapper").load("pages/" + lang.lName + "/reviews.html", () => {
        user.launchAfterUserInfoReceived(pageInfo.init, this.socket, pageInfo);
      });
    },

    settings() {
      $(".main-wrapper").load("pages/" + lang.lName + "/settings.html", () => {
        user.launchAfterUserInfoReceived(pageSettings.init, this.socket, pageSettings);
      });
    },

    profile() {
      let socket = this.socket;
      let hashId = urlHash.getState('id');
      // check if profile Id exists in hash query
      if (hashId) {
        // and check if this ID is not already loaded
        pageProfile.profileId = hashId;
        $(".main-wrapper").load("pages/" + lang.lName + "/profile.html", () => {
          pageProfile.init({ socket: socket, profileId: hashId });
        });
      } else {
        // or get user ID from user info and loads page
        user.launchAfterUserInfoReceived(function () {
          urlHash.pushState({ id: user.info.userId });
        });
      }
    },

    userpost() {
      var socket = this.socket;
      var postId = urlHash.getState('id');
      $(".main-wrapper").load("pages/" + lang.lName + "/feed.html", () => {
        pageFeed.oneFeedInit({ socket: socket, postId: postId });
      });
    },

    'hashtag-search'() {
      var socket = this.socket;
      var tagName = urlHash.getState('tag');
      $(".main-wrapper").load("pages/" + lang.lName + "/feed.html", () => {
        pageFeed.hashTagSearchInit({ socket: socket, tagName: tagName });
      });
    },

    "bot"() {
      $(".main-wrapper").load("pages/" + lang.lName + "/bot.html", () => {
        user.launchAfterUserInfoReceived(pageProfile.getAllBot, this.socket, pageProfile);
      });
    },

    "bot-add"() {
      user.launchAfterUserInfoReceived(pageProfile.createBot, this.socket, pageProfile);
    },

    "bot-edit"() {
      $(".main-wrapper").load("pages/" + lang.lName + "/bot-edit.html", () => {
        user.launchAfterUserInfoReceived(pageProfile.editBot, this.socket, pageProfile);
      });
    },

    terms() {
      $(".main-wrapper").load("pages/" + lang.lName + "/terms.html", () => {
      });
    },

    'region-user'() {
      $(".main-wrapper").load("pages/" + lang.lName + "/region-user.html", () => {
        pageRegionUser.init({ socket: socket });
      });
    },

    error() {
      $(".main-wrapper").load("pages/" + lang.lName + "/error.html", () => {
      });
    },

    transactions() {
      $(".main-wrapper").load("pages/" + lang.lName + "/transactions-user.html", () => {
        pageTransaction.init({ socket: socket });
      });
    },

    'miss-city'() {
      $(".main-wrapper").load("pages/" + lang.lName + "/miss-city.html", () => {
        pageMissCity.init();
      });
    },

    'miss-city-settings'() {
      $(".main-wrapper").load("pages/" + lang.lName + "/miss-city-settings.html", () => {
        pageMissCitySettings.init();
      });
    },

    'market-item'() {
      $(".main-wrapper").load("pages/" + lang.lName + "/market-item.html", () => {
        pageMarketItem.init();
      });
    },

    confirm() {
      auth.confirm();
    },

    "partners"() {
      let id = urlHash.getState('id');
      if (id)
        $(".main-wrapper").load("pages/" + lang.lName + "/partners-transactions.html", () => {
          pagePartners.getPartnerTransaction({ socket: socket, profileId: id });
        });
      else
        $(".main-wrapper").load("pages/" + lang.lName + "/partners.html", () => {
          pagePartners.init({ socket: socket });
        });
    },

    "partnership-banners"() {
      $(".main-wrapper").load("pages/" + lang.lName + "/partnership-banners.html", () => {
        user.launchAfterUserInfoReceived(pagePartnershipBanners.init, this.socket, pagePartnershipBanners);
      });
    },

    "partnership-widget"() {
      $(".main-wrapper").load("pages/" + lang.lName + "/partnership-widget.html", () => {
        user.launchAfterUserInfoReceived(pagePartnershipWidget.init, this.socket, pagePartnershipWidget);
      });
    },

    "adware-prices"() {
      $(".main-wrapper").load("pages/" + lang.lName + "/adware-prices.html", () => {
        user.launchAfterUserInfoReceived(pageAdwarePrices.init, this.socket, pageAdwarePrices);
      });
    },

    'adware-companies'() {
      $(".main-wrapper").load("pages/" + lang.lName + "/adware-companies.html", () => {
        user.launchAfterUserInfoReceived(pageAdwareCompanies.init, this.socket, pageAdwareCompanies);
      });
    },
  }
};


/** First load force launch **/
$(document).ready(function () {
  // init sidebar menu
  sidebarMenu.init();
  $(window).trigger("hashchange");
});

/** If user logouts, redirect from login-visible pages to main **/
// handle logout
$(document).on('userLogout', function () {
  let page = urlHash.getState('page');

  if (page in privatePages) {
    urlHash.removeState('page');
    $(document).trigger('hashchange');
  }
});