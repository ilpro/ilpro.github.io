var urlHash = {
  init: function() {
    this.hash = {};

    var hash = window.location.hash.substring(1);
    hash = hash.split("&");

    var arr = [];
    for (var i = 0; i < hash.length; i++) {
      arr = hash[i].split("=");
      this.hash[arr[0]] = arr[1];
    }
  },
  getState: function(key) {
    this.init();
    return this.hash[key];
  },
  pushState: function(obj) {
    this.init();
    for(var key in obj)
      this.hash[key] = obj[key];
    this.setState();
  },
  removeState: function(arg) {
    this.init();
    if(typeof(arg) == "string")
      this.hash[arg] = undefined;
    else if(typeof(arg) == "object") {
      for (var i = 0; i < arg.length; i++) {
        this.hash[arg[i]] = undefined;
      }
    }
    this.setState();
  },
  setState: function() {
    var str = "";
    for(var key in this.hash)
      if(this.hash[key] != undefined)
        str += "&" + key + "=" + this.hash[key];
    window.location.hash = "#" + str.substring(1);
  }
};
