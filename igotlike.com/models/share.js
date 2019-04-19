let fs = require('fs');
const queryString = require('query-string');
const request = require('request').defaults({ encoding: null });

const db = require('./db');

const Helper = require('./helper');

let fb = require("fb");
const fbUpload = require('facebook-api-video-upload');

let twitterAPI = require('node-twitter-api');
const Twit = require('twit');

let Client = require('instagram-private-api').V1;
let filepreview = require('filepreview');

var FB = new fb.Facebook({version: 'v2.9', appId: '107702683118196', appSecret: 'f99677c52f89715752ffdbc044dd1e60'});

var twitter = new twitterAPI({
    consumerKey: 'tx5V2r1ld6vUrNy6dWGKYwIsW',
    consumerSecret: 'YSbNcWGVuB23yHLUQRTUUPsUaCV6EmPV3nhwaEeAiFTFzQ3xVx',
    callback: 'https://m.airybay.com/auth/twitter/callback'
});
Helper.capitalizeStringInit();

class Share {

    //Promise parts

    //Facebook keys
    facebookKeysCheckPromise(data){
        return new Promise((resolve, reject) => {
            db.query("SELECT " +
                "`facebookAccessToken`," +
                "`facebookId`" +
                "FROM `tbl_user` WHERE `userId` = " + data.userId + ";",function (err,rows) {
                if (err) {
                    console.log('Error in twitterSharePost.checkTwitKeys #1\n' + err);
                }
                else {
                    if(rows[0].facebookAccessToken.length > 0){
                        FB.api('me', { fields: ['id', 'name'], access_token: rows[0].facebookAccessToken }, function (res) {
                            if(!res || res.error) {
                                reject('error');
                            } else {
                                resolve({facebookAccessToken: rows[0].facebookAccessToken, facebookId: rows[0].facebookId});
                            }
                        });
                    } else {
                        reject('error');
                    }
                }
            });

        })
    }

    facebookKeysClearPromise(data){
        return new Promise((resolve, reject) => {
            db.query("UPDATE `tbl_user` SET " +
                "`facebookAccessToken` = '' " +
                "WHERE `userId` = " + data.userId + ";",function (err,rows) {
                if (err) {
                    console.log('Error in Share.facebookClearKeys #1\n' + err);
                    reject('error');
                }
                else {
                    resolve('success');
                }
            });
        })
    }

    //Twitter keys
    twitterKeysCheckPromise(data){
        return new Promise((resolve, reject) => {
            db.query("SELECT " +
                "`twitterAccessToken`," +
                "`twitterRefreshToken` " +
                "FROM `tbl_user` WHERE `userId` = " + data.userId + ";",function (err,rows) {
                if (err) {
                    console.log('Error in twitterSharePost.checkTwitKeys #1\n' + err);
                }
                else {
                    if(rows[0].twitterAccessToken.length > 0 && rows[0].twitterRefreshToken.length > 0){
                        twitter.verifyCredentials(rows[0].twitterAccessToken, rows[0].twitterRefreshToken, function(error, data, response) {
                            if (error) {
                                reject(error);
                            } else {
                                resolve({twitterAccessToken: rows[0].twitterAccessToken, twitterRefreshToken: rows[0].twitterRefreshToken});
                            }
                        });
                    } else {
                        reject('error');
                    }

                }
            });

        })
    }

    twitterKeysClearPromise(data){
        return new Promise((resolve, reject) => {
            db.query("UPDATE `tbl_user` SET " +
                "`twitterAccessToken` = '', " +
                "`twitterRefreshToken` = '' " +
                "WHERE `userId` = " + data.userId + ";",function (err,rows) {
                if (err) {
                    console.log('Error in Share.twitterKeysClearPromise #1\n' + err);
                    reject('error');
                }
                else {
                    resolve('success');
                }
            });
        })
    }

    //Instagram keys
    instagramKeysCheckPromise(data){
        return new Promise((resolve, reject) => {
            db.query("SELECT " +
                "`instagramUserName`," +
                "`instagramUserPass` " +
                "FROM `tbl_user` WHERE `userId` = " + data.userId + ";",function (err,rows) {
                if (err) {
                    console.log('Error in twitterSharePost.checkInstagramKeys #1\n' + err);
                }
                else {
                    if(rows[0].instagramUserName.length > 0 && rows[0].instagramUserPass.length > 0){
                        resolve({instagramUserName: rows[0].instagramUserName, instagramUserPass: rows[0].instagramUserPass});
                    } else {
                        reject('error');
                    }

                }
            });

        })
    }

    instagramKeysClearPromise(data){
        return new Promise((resolve, reject) => {
            const self = this;
            self.instagramKeysCheckPromise(data).then(
                instData => {
                    db.query("UPDATE `tbl_user` SET " +
                        "`instagramUserName` = '', " +
                        "`instagramUserPass` = '' " +
                        "WHERE `userId` = " + data.userId + ";",
                        function (err,rows) {
                            if (err) {
                                console.log('Error in Share.instagramClearKeys #1\n' + err);
                                reject('error');
                            }
                            else {
                                if(fs.existsSync('./public/instagram_cookies/' + instData.instagramUserName + '.json')){
                                    fs.unlink('./public/instagram_cookies/' + instData.instagramUserName + '.json', function (err) {
                                        if (err)
                                            console.log("Error in Share.instagramClearKeys #2\n" + err);
                                        else
                                            resolve('success');
                                    });
                                } else {
                                    resolve('success');
                                }
                            }
                        });
                },
                error => {
                    resolve('success');
                }
            );
        })
    }
    //Promise parts end


    //Share logic
    shareSocialPost(sendOnce, data){
        const self = this;
        //TODO checkout for network names!

        data.postData.postSocialsArray.forEach(function (item) {
            self[item + 'SharePost'](sendOnce, data)
        });
    }

    //Facebook share
    uploadImgOnFb(postObj,postData,sendOnce){
        const self = this;
        var batchItems = [];
        postData.imgArr.forEach(function (imgSrc,index) {
            var opts = {
                url: postData.shareType === 'news' ? imgSrc : "https://m.airybay.com" + imgSrc,
                caption: "photo",
                published: false
            };
            var item = {
                method: 'POST',
                relative_url: 'me/photos',
                name: "post_photo" + index,
                body: decodeURIComponent(queryString.stringify(opts))
            };
            batchItems.push(item);
        });

        FB.api('', 'POST',
            {   access_token: postObj.access_token,
                batch: batchItems,
            },
            function (response) {
                if (!response || response.error) {
                    console.log('Error in Share.uploadImgOnFb #1\n' + JSON.stringify(response.error));
                } else {
                    var attached_media = [];
                    response.forEach(function (item) {
                        item.body = JSON.parse(item.body);
                        attached_media.push({"media_fbid": item.body.id})
                    });

                    postObj.attached_media = attached_media;

                    self.sendPostToFb(postObj,sendOnce);
                }
            });
    }

    uploadVidOnFb(facebookData,postData,sendOnce){
        const args = {
            token: facebookData.facebookAccessToken, // with the permission to upload
            id: facebookData.facebookId, //The id represent {page_id || user_id || event_id || group_id}
            stream: fs.createReadStream("public" + postData.postVideo), //path to the video
            title: postData.status ? postData.status : "My new video",
            description: postData.status ? postData.status : "Video description"
        };

        fbUpload(args).then((res) => {
            //console.log('res: ', res);
            //res:  { success: true, video_id: '1838312909759132' }
            sendOnce(null, 'facebookSharePost', JSON.stringify({message: "success"}));
        }).catch((e) => {
            console.error(e);
        });
    }

    sendPostToFb(postObj,sendOnce){
        FB.api('/me/feed', 'post', postObj,
            function (response) {
                if (!response || response.error) {
                    console.log('Error in Share.sendPostToFb #1\n' + JSON.stringify(response.error));
                } else {
                    sendOnce(null, 'facebookSharePost', JSON.stringify({message: "success"}));
                }
            });
    }

    facebookSharePost(sendOnce, data){
        const self = this;
        var postData = data.postData;
        self.facebookKeysCheckPromise(data).then(facebookData => {
            let status = postData.status ? postData.status : '';
                var postObj = {};
                postObj.access_token = facebookData.facebookAccessToken;
                if(status.length>0) {
                    postObj.message = status;
                }
                if(postData.imgArr){
                    self.uploadImgOnFb(postObj,postData,sendOnce)
                } else if(postData.postVideo) {
                    self.uploadVidOnFb(facebookData,postData,sendOnce)
                } else if(status.length>0) {
                    self.sendPostToFb(postObj,sendOnce);
                }

            },
            error => {
                sendOnce(null, 'facebookSharePost', JSON.stringify({error: '/auth/facebook'}));
            });

    }

    //Twitter share
    uploadTwitImgPromise(data) {
        return new Promise((resolve, reject) =>{
            twitter.uploadMedia(
                {media: data.image, isBase64:true},
                data.twitData.twitterAccessToken,
                data.twitData.twitterRefreshToken,
                function(err, data, res) {
                    if (err) console.log(err);
                    resolve(data.media_id_string);
                });
        })
    }

    uploadTwitVideo(postData) {
        const self = this;

        let oauth = {
            consumer_key: 'tx5V2r1ld6vUrNy6dWGKYwIsW',
            consumer_secret: 'YSbNcWGVuB23yHLUQRTUUPsUaCV6EmPV3nhwaEeAiFTFzQ3xVx',
            access_token: postData.twitData.twitterAccessToken,
            access_token_secret: postData.twitData.twitterRefreshToken
        };

        let T = new Twit(oauth);
        let PATH = "./public" + postData.postData.postVideo;
        T.postMediaChunked({ file_path: PATH },function (err, data, response) {
            if (err){
                console.log(err);
                postData.sendOnce(null, 'twitterSharePost', JSON.stringify({vid_error: "error"}));
            } else {
                const mediaIdStr = data.media_id_string;
                const meta_params = { media_id: mediaIdStr };
                T.post('media/metadata/create', meta_params, function (err, data, response) {
                    if (!err) {
                        postData.vidData = mediaIdStr;
                        self.postTwit(postData)
                    } else {
                        console.log(err)
                    }
                })
            }
        });
    }

    postTwit(data) {
        let postObj = {};
        if(data.status.length>0){
            postObj.status = data.status
        }
        if(data.imgData){
            postObj.media_ids = data.imgData.join(',');
        }
        if(data.vidData){
            postObj.media_ids = data.vidData;
        }
        twitter.statuses("update", postObj,
            data.twitData.twitterAccessToken,
            data.twitData.twitterRefreshToken,
            function(error, receivedData, response) {
                if (error) {
                    let errData = JSON.parse(error.data);
                    console.log(errData);
                } else {
                    data.sendOnce(null, 'twitterSharePost', JSON.stringify({message: "success"}));
                }
            }
        );
    }

    twitterSharePost(sendOnce, data){
        const self = this;
        var postData = data.postData;
        self.twitterKeysCheckPromise(data).then(twitData => {
                let status = postData.status ? postData.status : '';

                if(postData.imgArr){
                    let promiseArray = [];

                    if(postData.shareType === 'post'){
                        postData.imgArr.forEach(function (img) {
                            let image = fs.readFileSync('./public' + img, {encoding: 'base64'});
                            promiseArray.push(self.uploadTwitImgPromise({image,twitData}))
                        });

                        Promise.all(promiseArray).then(imgData => {
                            self.postTwit({imgData,status,twitData,sendOnce})
                        })
                    } else if (postData.shareType === 'news') {
                        request.get(postData.imgArr[0], function (error, response, body) {
                            let img = `/uploads/ribbon/tempPhoto-${Date.now()}`;
                            fs.writeFile(`./public` + img, body, function(error) {
                                if(error){
                                    console.log(error)
                                } else {
                                    let image = fs.readFileSync('./public' + img, {encoding: 'base64'});
                                    promiseArray.push(self.uploadTwitImgPromise({image,twitData}));
                                    Promise.all(promiseArray).then(imgData => {
                                        self.postTwit({imgData,status,twitData,sendOnce})
                                    })
                                }

                            })
                        })

                    }

                } else if (postData.postVideo) {
                    self.uploadTwitVideo({status,twitData,postData,sendOnce})
                } else {
                    self.postTwit({status,twitData,sendOnce})
                }
        },
            error => {
                sendOnce(null, 'twitterSharePost', JSON.stringify({error: '/auth/twitter'}));
            });

    }

    instagramPhotoUpload(data){
        const self = this;

        Client.Session.create(data.device, data.storage, data.username, data.userpass).then(
            function (session) {
                return Client.Upload.photo(session, '../mediastealer.com/public' + data.img)
                    .then(function (upload) {
                        // upload instanceof Client.Upload
                        // nothing more than just keeping upload id
                        return Client.Media.configurePhoto(session, upload.params.uploadId, data.caption);
                    })
                    .then(function (medium) {
                        // we configure medium, it is now visible with caption
                        data.sendOnce(null, 'instagramSharePost', JSON.stringify({message: 'success'}));
                    })
            }
        )
    }

    //Instagram share
    instagramSharePost(sendOnce, data) {
        const self = this;
        var postData = data.postData;
        self.instagramKeysCheckPromise(data).then(
            instData => {

                var username = instData.instagramUserName;
                var userpass = instData.instagramUserPass;

                var storage = new Client.CookieFileStorage('./public/instagram_cookies/' + username + '.json');
                var device = new Client.Device(username);

                if(postData.imgArr){
                    let caption = postData.status ? postData.status : 'photo';

                    if(postData.shareType === 'post'){
                        self.instagramPhotoUpload({device, storage, username, userpass, img: postData.imgArr[0], caption,sendOnce})
                    } else if (postData.shareType === 'news'){
                        request.get(postData.imgArr[0], function (error, response, body) {
                            let img = `/uploads/ribbon/tempPhoto-${Date.now()}`;
                            fs.writeFile(`./public` + img, body, function(error) {
                                if(error){
                                    console.log(error)
                                } else {
                                    self.instagramPhotoUpload({device, storage, username, userpass, img, caption,sendOnce})
                                }

                            })
                        })
                    }
                } else if (postData.postVideo.match(/([^\/]+)\.mp4/im)) {
                   let caption = postData.status ? postData.status : "My new video";

                   let name = postData.postVideo.match(/([^\/]+)\.mp4/im);

                    filepreview.generate("./public" + data.postData.postVideo, "./public/uploads/ribbon/" + name[1] + ".jpg", function(error) {
                        if (error) {
                            return console.log(error);
                        }
                        Client.Session.create(device, storage, username, userpass).then(
                            function (session) {
                                return Client.Upload.video(session, "public" + data.postData.postVideo, "./public/uploads/ribbon/" + name[1] + ".jpg")
                                    .then(function(upload) {
                                        return Client.Media.configureVideo(session, upload.uploadId, caption, upload.durationms);
                                    })
                                    .then(function(medium) {
                                        // we configure medium, it is now visible with caption
                                        sendOnce(null, 'instagramSharePost', JSON.stringify({message: 'success'}));
                                    })
                            }
                        )
                    });

                }

            },
            error => {
                sendOnce(null, 'instagramSharePost', JSON.stringify({message: 'error'}));
            })
    }


    //Social keys factory to check/clear keys
    socialKeysHandler(sendOnce, data, type) {
        const self = this;
        let PromisesArray = [];

        //TODO checkout for network names!

        if (data.keysList.indexOf('all') >=0){
            data.keysList = ['facebook','twitter','instagram']
        }

        data.keysList.forEach(function (item) {
            PromisesArray.push(self[item + 'Keys' + type.capitalize() + 'Promise'](data).catch(e => e))
        });

        Promise.all(PromisesArray).then(
            result => {
                let resultData = {};
                result.forEach(function (item,i) {
                    resultData[data.keysList[i]] = item !== 'error' ? 'success' : 'error';
                });
                sendOnce(null, type + 'SocialKeys', JSON.stringify({status: resultData}));
            },
            error => {
                sendOnce(null, type + 'SocialKeys', JSON.stringify({status: 'error'}));
            }
        ).catch(e => console.log('Error in Share.socialKeysHandler\n' + e));
    }

    checkSocialKeys(sendOnce, data) {
        const self = this;
        self.socialKeysHandler(sendOnce, data, 'check')
    }

    clearSocialKeys(sendOnce, data) {
        const self = this;
        self.socialKeysHandler(sendOnce, data, 'clear')
    }

    //Popup username/pass check
    checkInstagramLoginData(sendOnce,data,sendTo){
        var username = data.username;
        var userpass = data.userpass;
        var storage = new Client.CookieFileStorage('./public/instagram_cookies/' + username + '.json');
        var device = new Client.Device(username);

        Client.Session.create(device, storage, username, userpass).then(
            session =>{
                session.getAccount()
                    .then(function(account) {
                        db.query("UPDATE `tbl_user` SET " +
                            "`instagramUserName` = '" + username + "', " +
                            "`instagramUserPass` = '" + userpass + "' " +
                            "WHERE `userId` = " + data.userId + ";",
                            function (err,rows) {
                                if (err) {
                                    console.log('Error in Share.instagramClearKeys #1\n' + err);
                                }
                                else {
                                    sendOnce(null, 'checkInstagramLoginData', JSON.stringify({message: 'success'}));
                                    sendTo(null, JSON.stringify({message: 'finalized'}),'checkInstagramLoginData', data.userId)
                                }
                            });
                    })
            }, error => {
                if(fs.existsSync('./public/instagram_cookies/' + username + '.json')){
                    fs.unlink('./public/instagram_cookies/' + username + '.json', function (err) {
                        if (err)
                            console.log("Error in Share.instagramClearKeys #2\n" + err);
                        else
                            sendOnce(null, 'checkInstagramLoginData', JSON.stringify(error));
                    });
                } else {
                    sendOnce(null, 'checkInstagramLoginData', JSON.stringify(error));
                }
            }
        )
    }
}

module.exports = Share;