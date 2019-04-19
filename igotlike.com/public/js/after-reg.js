var updateRequiredData = false;

$(".step.info .gender-container").click(function () {
  var wrap = $(this).parent();
  wrap.find(".gender-container").removeClass("active");
  $(this).addClass("active");
});

$(".step.partner .gender-container").click(function () {
  $(this).toggleClass("active");
});

$(".after-reg-modal .btn.next").click(function () {
  if (!updateRequiredData) {
    updateRequiredData = true;

    var modal = $(".after-reg-modal .step.active");
    var step = modal.data("step");

    if (step == 1) {
      dataSocket.emit('updateRequiredData', JSON.stringify({
        "hash": userHash,
        "step": step,
        "email": $(".step.info .email").val(),
        "pass": $(".step.info .password").val(),
        "passRepeat": $(".step.info .password-confirm").val(),
        "day": $(".step.info .day").val(),
        "mounth": $(".step.info .mounth").val(),
        "year": $(".step.info .year").val(),
        "gender": $(".step.info .gender-container.active").data("val")
      }));
    }
    else if (step == 2) {
      dataSocket.emit('updateRequiredData', JSON.stringify({
        "hash": userHash,
        "step": step,
        "nickname": $(".step.photo .nickname").val()
      }));
    }
    else if (step == 3) {
      dataSocket.emit('updateRequiredData', JSON.stringify({hash: userHash, step: step}));
    }
    else if (step == 4) {

      var gender = [];
      $(".step.partner .gender-container.active").each(function () {
        gender.push($(this).data("val"));
      });

      dataSocket.emit('updateRequiredData', JSON.stringify({
        hash: userHash,
        step: step,
        searchSettings: {
          gender: gender,
          place: [1, 2],
          ageFrom: $(".step.partner input[name=ageFrom]").val(),
          ageTo: $(".step.partner input[name=ageTo]").val()
        }
      }));
    }
  }
});

dataSocket.on('updateRequiredData', function (data) {
  updateRequiredData = false;

  data = JSON.parse(data);

  if (!data.error) {
    var modal = $(".after-reg-modal .step.active");
    var step = modal.data("step");

    if (step == 1) {
      modal.removeClass("active");
      modal.next().addClass("active");
      $(".after-reg-modal .btn.prev").removeClass("hidden");
    }
    else if (step == 2) {
      if ($(".step.photo .upload-photo img").length) {
        modal.removeClass("active");
        modal.next().addClass("active");
      }
      else
        alert("Upload your main photo!");
    }
    else if (step == 3) {
      modal.removeClass("active");
      modal.next().addClass("active");
      $(".after-reg-modal .two-btn").removeClass("active");
      $(".after-reg-modal .one-btn").addClass("active");
    }
    else if (step == 4) {
      $(".after-reg-modal").hide();
      setCookie("search", JSON.stringify(data.search), {"path": "/", "expires": 31536000});
      window.location.href = "/travelers"
    }
  }
  else
    alert(data.error.text);
});

// загрузить изображение
$(".upload-photo").ajaxUpload({
  url: "/profile/upload-image",
  name: "image",
  onSubmit: function () {
    var size = $('input','.upload-photo')[0].files[0].size / 1000;
    // if(size >= 1000){
    //   return alert('Please upload photo up to 1mb');
    // }
    return true;
  },
  onComplete: function (data) {
    if(data.indexOf('413') === 1){
      return alert('Please upload photo up to 10mb');
    }

    data = JSON.parse(data);

    dataSocket.emit('fastCropUserImage', JSON.stringify({
      "hash": userHash,
      "imgUrl": data.image
    }));
  }
});

dataSocket.on('fastCropUserImage', function (data) {
  data = JSON.parse(data);
  $(".upload-photo").html('<img src="' + data.image + '" alt="" style="display: block; margin: 0 auto;">');
  $(".user-avatar img").attr("src", data.image);
});

$(".after-reg-modal .btn.prev").click(function () {
  var modal = $(".after-reg-modal .step.active");
  var step = modal.data("step");

  if (step == 2 || step == 3) {
    modal.removeClass("active");
    modal.prev().addClass("active");
    if (step == 2)
      $(".after-reg-modal .btn.prev").addClass("hidden");
  }
});

//variables
var $ageFrom_modal = $(".step.partner .from-age");
var $ageTo_modal = $(".step.partner .to-age");
var $ageSlider_modal = $('#ageSlider_modal');

//slider init
$ageSlider_modal.slider({
  range: true,
  min: 18,
  max: 50,
  values: [18, 100],
  slide: function (event, ui) {
    $ageFrom_modal.val(ui.values[0]);
    $ageTo_modal.val(ui.values[1]);
  }
});

$ageFrom_modal.val($ageSlider_modal.slider("values", 0));
$ageTo_modal.val($ageSlider_modal.slider("values", 1));

//change from field input
$ageFrom_modal.change(function () {
  var val1 = parseInt($ageFrom_modal.val());
  var val2 = parseInt($ageTo_modal.val());
  val1 = val1 < val2 ? val1 : val2;
  $ageSlider_modal.slider("values", 0, val1);
});

//change to field input
$ageTo_modal.change(function () {
  var val1 = parseInt($ageFrom_modal.val());
  var val2 = parseInt($ageTo_modal.val());
  val2 = val2 > val1 ? val2 : val1;
  $ageSlider_modal.slider("values", 1, val2);
});

dataSocket.on('getUserInfo', function (data){
  console.log(JSON.parse(data));
});