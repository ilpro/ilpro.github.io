'use strict';

const sidebarMenu = {
  pageNames: {clear:true}, // there will be pages from sidebar menu with attribute "data-menu"
  htmlPages: [], // HTML collection with pages

  /** Get all menu pages **/
  init () {
    this.htmlPages = document.querySelectorAll('.side-menu .menu-item[data-menu]');

    for(let i = 0; i < this.htmlPages.length; i++){
      let pageName = this.htmlPages[i].getAttribute('data-menu');
      this.pageNames[pageName] = true;
    }
  },

  /** Highlight selected page **/
  highlight (page) {
    // check if page exists
    if( !(page in this.pageNames) ) {
      return
    }

    // remove previously active pages
    for(let i = 0; i < this.htmlPages.length; i++){
      this.htmlPages[i].classList.remove('active');
    }

    // highlight selected page
	if(page != "clear")
		document.querySelector('.side-menu .menu-item[data-menu="'+ page +'"]').classList.add('active');
  }
};