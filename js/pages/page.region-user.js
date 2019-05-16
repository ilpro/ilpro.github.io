'use strict';

const pageRegionUser = {

    init: function(params) {
        var self = this;
        var pageRegionUserData = [];
        self.socket = params.socket;

        self.socket.emit('getUsersRegionId', JSON.stringify({hash:user.hash}));

        self.socket.off("getUsersRegionId").on("getUsersRegionId", function(data) {
            data = JSON.parse(data);
            var pageSelectsEven = '';
            var pageSelectsOdd = '';
            var countEveness = 'even';

            data.rowData.forEach(function (item,index) {
                pageRegionUserData[index] = item;
                pageRegionUserData[index].userIdArr = item.userId.split(',');
                item.userIdArr = item.userId.split(',');
                item.orderId = index;
                if(countEveness === 'even'){
                    pageSelectsEven += formSelectHtml(item);
                    countEveness = 'odd';
                } else if(countEveness === 'odd'){
                    pageSelectsOdd += formSelectHtml(item);
                    countEveness = 'even';
                }
            });

            $(".region-user-page .constructor").html('<div class="controls">' + pageSelectsEven + '</div>').append('<div class="controls">' + pageSelectsOdd + '</div>');

            $('.chosen-select-deselect').each(function () {
                var select, chosen;

                // cache the select element as we'll be using it a few times
                select = $(this);


                // init the chosen plugin
                select.chosen({width: "400px", disable_search_threshold: 10,create_option: true,persistent_create_option: true,skip_no_results: true});

                // get the chosen object
                chosen = select.data('chosen');

                // Bind the keyup event to the search box input
                chosen.container.find('input').on('keyup', function(e)
                {
                    // if we hit Enter and the results list is empty (no matches) add the option
                    if (e.which == 13)
                    {
                        var option = $("<option>").val(this.value).text(this.value);

                        // add the new option
                        select.append(option);
                        // automatically select it
                        select.find(option).prop('selected', true);
                        // trigger the update
                        select.trigger("chosen:updated");
                    }
                });
            });

            function formSelectHtml(itemData) {
                var options = '';
                for(var i=0;i<itemData.userIdArr.length;i++){
                    options += '<option value="' + itemData.userIdArr[i] + '" class="one-option-item" selected>' + itemData.userIdArr[i] + '</option>'
                }

                return '<label data-cityid="' + itemData.userResidenceId + '">' + itemData.residenceTitle + '</label>\
                    <select data-orderid="' + itemData.orderId + '" data-cityid="' + itemData.userResidenceId + '" multiple class="one-option-select chosen-select-deselect" data-placeholder="--- id ---"> \
                    <option value="" class="one-option-item"></option>' + options + '</select>'
            }
        });

        $(".region-user-page").on("click", ".btn-add", function () {
            var sendData = [];
            $('.chosen-select-deselect').each(function () {
                var thisArr = $(this).val();
                var thisCityId = $(this).data("cityid");
                var thisOrderId = parseInt($(this).data("orderid"));
                var toDelete = [];
                var toPush = [];
                var thisCityObj = {
                    thisCityId: thisCityId,
                    addId: [],
                    removeId: []
                };

                for(var i=0;i<thisArr.length;i++){
                    if(!pageRegionUserData[thisOrderId].userIdArr.includes(thisArr[i])){
                        thisCityObj.addId.push(thisArr[i]);
                        toPush.push(thisArr[i]);
                    }
                }
                for(var j=0;j<pageRegionUserData[thisOrderId].userIdArr.length;j++){
                    if(!thisArr.includes(pageRegionUserData[thisOrderId].userIdArr[j])){
                        thisCityObj.removeId.push(pageRegionUserData[thisOrderId].userIdArr[j]);
                        toDelete.push(pageRegionUserData[thisOrderId].userIdArr[j]);
                    }
                }
                for(var k=0;k<toDelete.length;k++){
                    pageRegionUserData[thisOrderId].userIdArr.splice(pageRegionUserData[thisOrderId].userIdArr.indexOf(toDelete[k]),1)
                }
                for(var l=0;l<toPush.length;l++){
                    pageRegionUserData[thisOrderId].userIdArr.push(toPush[l]);
                }

                if(thisCityObj.removeId.length != 0 || thisCityObj.addId.length != 0){
                    sendData.push(thisCityObj)
                }
            });
            self.socket.emit('updateUsersRegionId', JSON.stringify({hash:user.hash, sendData:sendData}));
        });

        self.socket.off("updateUsersRegionId").on("updateUsersRegionId", function (data) {
            data = JSON.parse(data);
            if(data.result === 'error'){
                showNotify('danger','Помилка')
            } else if (data.result === 'success'){
                showNotify('success','Оновлено')
            }
        })
    }
};
