"use strict";

/******* COMMENTS WIDGET CONSTRUCTOR **********/
var pageAdwareCompanies = {
  socket: {},
  isFirstLoad: true,
  companies: [],

  init(socket) {
    var self = this;

    if (self.isFirstLoad) {
      self.socket = socket;
      self.initSocketHandlers();
      self.isFirstLoad = false;
    }
    setTodayDate();

    self.getDomainsWithBanners();
    self.getCompaniesStatistic();
    self.initEventHandlers();
  },

  /** Listeners **/
  initSocketHandlers() {
    var self = this;

    // handle register
    self.socket.on('getBannerCompaniesStatistics', function (data) {
      self.companies = JSON.parse(data).companies;

      self.insertCompaniesStatistic(self.companies)

      var activeCompanyId = $('#companies-table').attr('data-company-active');
      if (activeCompanyId) {
        $('#companies-table [data-company-id="' + activeCompanyId + '"]').addClass('active');
        self.showStatisticByDomain(activeCompanyId);
        self.showContents(self.companies[activeCompanyId].contents);
      }

      $('.multi-upload-container').show();
    });

    self.socket.off('saveBannerCompany').on('saveBannerCompany', (data) => {
      data = JSON.parse(data)
      if (!data.companyId) {
        return showNotify('danger', data.message);
      }

      showNotify('success', 'Кампания успешно добавлена');
      return self.getCompaniesStatistic();
    });

    self.socket.off('toggleBannerCompany').on('toggleBannerCompany', (data) => {
      data = JSON.parse(data);
      return data.message ? showNotify('danger', data.message) : showNotify('success', 'Кампания успешно обновлена');
    });

    self.socket.off('attachDomainToCompany').on('attachDomainToCompany', (data) => {
      data = JSON.parse(data);
      data.message ? showNotify('danger', data.message) : showNotify('success', 'Кампания успешно обновлена');
      self.getCompaniesStatistic();
    });

    self.socket.off('removeDomainFromCompany').on('removeDomainFromCompany', (data) => {
      data = JSON.parse(data);
      data.message ? showNotify('danger', data.message) : showNotify('success', 'Кампания успешно обновлена');
      self.getCompaniesStatistic();
    });

    self.socket.off('saveCompanyContent').on('saveCompanyContent', data => {
      data = JSON.parse(data);
      // { id, bannerSize, bannerSizeId, companyId, type, image, link }
      const $content = $('[data-company-id="' + data.companyId + '"][data-size-id="' + data.bannerSizeId + '"]');
      $content.attr('data-content-id', data.id);

      const isContent = data.content && data.content.length > 1

      if (isContent) {
        $content.find('.content-image-link').attr('href', data.content + getRandomHash());
        $content.find('.content-image').attr('src', data.content + getRandomHash());
        $content.find('.content-image').css({ display: 'inline' });
      }

      const backgroundColor = (data.link && isContent) ? '#F2F2F2' : '#FA8072';
      $content.find('.row-content-part').css({ backgroundColor: backgroundColor });
    });

    self.socket.off('saveCompanyContentMulti').on('saveCompanyContentMulti', data => {
      data = JSON.parse(data);
      if (data.message) {
        return showNotify('danger', data.message);
      }

      console.log(data);
      showNotify('success', `Были успешно обновлены изображения для размеров ${data.savedImages.map(image => `${image.width}x${image.height}`).join(', ')}`);

      if (data.invalidImages.length > 0) {
        showNotify('danger', `Изображения с размерами ${data.invalidImages.map(image => `${image.width}x${image.height}`).join(', ')} некорректны и не были обновлены`);
      }
      self.getCompaniesStatistic();
    });

    self.socket.off('getNonCompanyDomains').on('getNonCompanyDomains', data => {
      data = JSON.parse(data);
      const html = '<option>Домен</option>' + data.map(domain => `<option data-domain-id="${domain.domainId}">${domain.domain}</option>`).join(' ')

      $('#select-company-domain').html(html);
      $('.add-domains-to-company-container').show()
    });

    self.socket.off('getDomainsWithBanners').on('getDomainsWithBanners', data => {
      data = JSON.parse(data);

      const html = '<option>Домен</option>' + data.map(domain => `<option data-domain-id="${domain.domainId}">${domain.domain}</option>`).join(' ')
      $('#select-new-company-domain').html(html);
    });
  },

  /** Event handlers like click **/
  initEventHandlers() {
    var self = this;

    // create new company
    $(document).off('click', '#create-new-company').on('click', '#create-new-company', () => {
      self.saveCompany();
    });

    // get statistic by day\week\month\total
    $(document).on('click', '.filter-item', function () {
      $('.filter-item').removeClass('active').filter($(this)).addClass('active');
      self.getCompaniesStatistic();
    });

    // switch company active on/off
    $(document).off('click', '#companies-table .toggler-bool').on('click', '#companies-table .toggler-bool', function () {
      var companyId = +$(this).closest('.body-row ').attr('data-company-id');
      self.socket.emit('toggleBannerCompany', JSON.stringify({ hash: user.info.hash, companyId: companyId }));
      $(this).toggleClass('on');
    });

    // show more statistic about selected company
    $(document).on('click', '#companies-table .body-row', function () {
      var companyId = $(this).attr('data-company-id');
      $('#companies-table .body-row').removeClass('active').filter($(this)).addClass('active');
      $('#companies-table').attr('data-company-active', $('#companies-table .body-row.active').attr('data-company-id'));
      self.showStatisticByDomain(companyId);
      self.showContents(self.companies[companyId].contents);

      self.getNonCompanyDomains(companyId);

      // clear banners (if selected)
      $('#banners-table').empty();
      $('.add-domains-to-company-container').hide();
    });

    // show more statistic about selected domain
    $(document).on('click', '#domains-table .body-row', function () {
      const domainId = $(this).attr('data-domain-id');
      $('#domains-table .body-row').removeClass('active').filter($(this)).addClass('active');
      $('#domains-table').attr('data-domain-active', $('#domains-table .body-row.active').attr('data-domain-id'));

      const activeCompanyId = $('#companies-table .body-row.active').attr('data-company-id');
      const banners = self.companies[activeCompanyId].domains.domains[domainId].banners;
      self.showStatisticByBanner(banners);
    });

    // change company banner info
    $(document).on('input', '#formats-table .content-link', event => {
      self.saveContent($(event.target).closest('.body-row'));
    });
    $(document).on('change', '#formats-table .content-file', event => {
      self.saveContent($(event.target).closest('.body-row'));
    });
    $(document).on('change', '#file-multi', event => {
      self.saveContentMulti();
    });

    $('#add-domain-to-company').on('click', () => {
      self.attachDomainToCompany()
    });

    $('#select-new-company-domain').on('change', event => {
      const selectedOption = $("option:selected", '#select-new-company-domain');
      const domainId = selectedOption.attr('data-domain-id');
      const domainName = event.target.value;

      const selectedHtml = `<div data-domain-id="${domainId}">${domainName}</div>`;
      $('#added-domains').append(selectedHtml);

      selectedOption.remove();
    });

    // remove domain from company
    $(document).off('click', '.remove-from-company').on('click', '.remove-from-company', event => {
      const $elem = $(event.target).closest('.body-row');
      self.removeDomainFromCompany($elem);
    });
  },

  saveCompany() {
    const companyName = $('#new-company-name').val();
    const selectedDomains = $('#added-domains > div');

    if (!companyName) {
      return showNotify("danger", "Пожалуйста, придумайте название кампании");
    }

    if (selectedDomains.length === 0) {
      const answer = confirm('Вы не выбрали ни одного домена. Все существующие домены будут подключены к создаваемой кампании. Продолжить?');
      if (!answer) return
    }

    const domains = [];
    selectedDomains.each((i, elem) => domains.push(+elem.getAttribute('data-domain-id')));

    this.socket.emit('saveBannerCompany', JSON.stringify({ hash: user.info.hash, companyName, domains }));
  },

  getDomainsWithBanners() {
    this.socket.emit('getDomainsWithBanners', JSON.stringify({ hash: user.info.hash }));
  },

  getNonCompanyDomains(companyId) {
    this.socket.emit('getNonCompanyDomains', JSON.stringify({ hash: user.info.hash, companyId }));
  },

  saveContent($elem) {
    this.getUploadedFile($elem.find('.content-file').prop('files')[0], image => {

      const data = {
        contentId: $elem.attr('data-content-id') || null,
        bannerSize: $elem.attr('data-size'),
        bannerSizeId: $elem.attr('data-size-id'),
        companyId: $elem.attr('data-company-id'),
        type: 'image',
        image,
        link: $elem.find('.content-link').val(),
      }

      this.socket.emit('saveCompanyContent', JSON.stringify({ hash: user.info.hash, ...data }));
    });
  },

  getUploadedFile(file, callback) {
    if (!file) return callback(null)

    const reader = new FileReader();
    reader.loadend = () => { }
    reader.onload = (e) => callback({ file: e.target.result, fileName: file.name });
    reader.readAsDataURL(file);
  },

  saveContentMulti() {
    const files = $('#file-multi').prop('files');
    const companyId = $('#companies-table .body-row.active').attr('data-company-id');
    const link = $('#multi-content-link').val();
    const images = [];
    let fileIndexToHandle = 0;

    if (!link || link.trim().length === 0) {
      $('#file-multi').val('');
      return showNotify('danger', 'Пожалуйста, впишите ссылку для прикрепления к загружаемому контенту');
    }

    if (!files || files.length === 0) {
      $('#file-multi').val('');
      return showNotify('danger', 'Пожалуйста, выберите хотя бы одно изображение для загрузки');
    }

    const handleFilesLoop = () => {
      this.getUploadedFile(files[fileIndexToHandle], image => {
        images.push(image);
        fileIndexToHandle++;

        if (fileIndexToHandle < files.length) {
          return handleFilesLoop()
        }
        this.socket.emit('saveCompanyContentMulti', JSON.stringify({ hash: user.info.hash, images, companyId, link }));
      })
    }

    if (files.length > 0) handleFilesLoop();
  },

  attachDomainToCompany() {
    const companyId = $('#companies-table .body-row.active').attr('data-company-id');
    const domainId = $("#select-company-domain option:selected").attr('data-domain-id');
    this.socket.emit('attachDomainToCompany', JSON.stringify({ hash: user.info.hash, domainId, companyId }))
  },

  removeDomainFromCompany($elem) {
    const domainId = $elem.attr('data-domain-id');
    const domainName = $elem.find('.company-name').text();
    const companyName = $('#companies-table .body-row.active').find('.company-name').text();
    const isUserAgree = confirm(`Удалить сайт ${domainName} из кампании ${companyName}?`);

    if (!isUserAgree) return

    this.socket.emit('removeDomainFromCompany', JSON.stringify({ hash: user.info.hash, domainId }));
  },

  /** Get widget statistic for selected domain **/
  getCompaniesStatistic() {
    var self = this;
    var period = $('.filter-item.active').attr('data-filter');
    self.socket.emit('getBannerCompaniesStatistics', JSON.stringify({ hash: user.info.hash, period }));

    $('.multi-upload-container').hide();
    $('#loading-company-img').show();
    $('#companies-table, #domains-table').empty();
  },

  /** Insert statistic into html **/
  insertCompaniesStatistic(companies) {
    let togglerHtml = '';
    let companiesHtml = '';

    Object.values(companies).forEach(company => {
      if (!(+company.isDefault)) {
        togglerHtml =
          '<div class="table-row-item toggler"><div class="toggler toggler-bool ' + (!!company.isActive ? 'on' : '') + '"></div></div>'
      } else {
        $('#companies-table').attr('data-company-default', company.id)
      }

      var companyRowHtml =
        '<div class="body-row clickable" data-company-id="' + company.id + '">\
         <div class="row-content-part">\
           <div class="left-content-info">\
             '+ togglerHtml + '\
             <div class="table-row-item company-name">' + company.name + '</div>\
           </div>\
           <div class="right-content-fill">\
             <div class="table-row-item">\
               <div class="item-ico">\
                 ' + svg.requests + '\
               </div>\
               <div class="item-number">' + company.requests + '</div>\
             </div>\
             <div class="table-row-item">\
               <div class="item-ico">\
                 ' + svg.eye + '\
               </div>\
               <div class="item-number">' + company.views + '</div>\
             </div>\
             <div class="table-row-item">\
               <div class="item-ico">\
                 ' + svg.aim + '\
               </div>\
               <div class="item-number">' + company.viewsUnique + '</div>\
             </div>\
             <div class="table-row-item">\
               <div class="item-ico">\
                 ' + svg.pointerArrow + '\
               </div>\
               <div class="item-number">' + company.clicks + '</div>\
             </div>\
             <div class="table-row-item">\
               <div class="item-ico">\
                 ' + svg.pointerArrowInCircle + '\
               </div>\
               <div class="item-number">' + company.clicksUnique + '</div>\
             </div>\
             <div class="table-row-item">\
               <div class="item-ico">\
                 ' + svg.pointerFinger + '\
               </div>\
               <div class="item-number">' + +(company.ctr).toFixed(3) + '</div>\
             </div>\
             <div class="table-row-item">\
               <div class="item-ico">\
                 ' + svg.coinSmall + '\
               </div>\
               <div class="item-number">' + +(company.income).toFixed(3) + '</div>\
             </div>\
           </div>\
         </div>\
       </div>';

      companiesHtml += companyRowHtml;
    })

    $('#loading-company-img').hide();
    $('#companies-table').html(companiesHtml);
  },

  /** Calc and insert statistic by domain into html **/
  showStatisticByDomain(activeCompanyId) {
    var self = this;
    var domains = self.companies[activeCompanyId].domains.domains;
    const isCompanyDefault = +$('#companies-table').attr('data-company-default') === +activeCompanyId

    var allDomainsHtml = '';

    for (var domain in domains) {
      var percentage = (+domains[domain].views * 100) / +self.companies[activeCompanyId].domains.maxViews;
      var income = +domains[domain].income;
      var incomeFixed = income.toFixed(3);

      let removeFromCompanyButton = '';
      if (!isCompanyDefault) {
        removeFromCompanyButton = '<button class="remove-from-company" style="width: 25%">X<button/>';
      }

      allDomainsHtml +=
        '<div class="body-row clickable" data-domain-id="' + domains[domain].domainId + '">\
           <div class="row-content-part">\
             <div class="left-content-info">\
              '+ removeFromCompanyButton + '\
               <div class="table-row-item company-name company-name-padding">' + domains[domain].domainName + '</div>\
             </div>\
             <div class="right-content-fill">\
               <div class="filler" style="width: ' + percentage + '%"></div>\
               <div class="table-row-item">\
                 <div class="item-ico">\
                   ' + svg.requests + '\
               </div>\
               <div class="item-number">' + domains[domain].requests + '</div>\
             </div>\
             <div class="table-row-item">\
               <div class="item-ico">\
                 ' + svg.eye + '\
               </div>\
               <div class="item-number views">' + domains[domain].views + '</div>\
             </div>\
             <div class="table-row-item">\
               <div class="item-ico">\
                 ' + svg.aim + '\
               </div>\
               <div class="item-number">' + domains[domain].viewsUnique + '</div>\
             </div>\
             <div class="table-row-item">\
               <div class="item-ico">\
                 ' + svg.pointerArrow + '\
               </div>\
               <div class="item-number">' + domains[domain].clicks + '</div>\
             </div>\
             <div class="table-row-item">\
               <div class="item-ico">\
                 ' + svg.pointerArrowInCircle + '\
               </div>\
               <div class="item-number">' + domains[domain].clicksUnique + '</div>\
             </div>\
             <div class="table-row-item">\
               <div class="item-ico">\
                 ' + svg.pointerFinger + '\
               </div>\
               <div class="item-number ctr">' + +(domains[domain].ctr).toFixed(3) + '</div>\
             </div>\
             <div class="table-row-item">\
               <div class="item-ico">\
                 ' + svg.coinSmall + '\
               </div>\
             <div class="item-number price">' + incomeFixed + '</div>\
           </div>\
         </div>\
       </div>\
     </div>';
    }
    // insert html
    $('#domains-table').html(allDomainsHtml);

    // show header
    $('#domains-header').show();
  },

  showStatisticByBanner(banners) {
    var self = this;

    var bannersHtml = '';

    Object.values(banners.statistics).forEach(banner => {
      var percentage = (+banner.views * 100) / +banners.maxViews;
      var income = banner.income.toFixed(3);

      var bannerHtml =
        '<div class="body-row" \
            data-banner-id="' + +banner.bannerId + '" \
            data-banner-price="' + +banner.price + '" \
            data-banner-size-id="' + +banner.bannerSizeId + '">\
         <div class="row-content-part">\
           <div class="left-content-info">\
             <div class="table-row-item company-name">\
               <span class="resolution">' + banner.size + '</span>\
               <span class="bannerName">' + banner.bannerName + '</span>\
             </div>\
           </div>\
           <div class="right-content-fill">\
             <div class="filler" style="width: ' + percentage + '%"></div>\
             <div class="table-row-item">\
               <div class="item-ico">\
                 ' + svg.requests + '\
               </div>\
               <div class="item-number">' + +banner.requests + '</div>\
             </div>\
             <div class="table-row-item">\
               <div class="item-ico">\
                 ' + svg.eye + '\
               </div>\
               <div class="item-number views">' + +banner.views + '</div>\
             </div>\
             <div class="table-row-item">\
               <div class="item-ico">\
                 ' + svg.aim + '\
               </div>\
               <div class="item-number">' + +banner.viewsUnique + '</div>\
             </div>\
             <div class="table-row-item">\
               <div class="item-ico">\
                 ' + svg.pointerArrow + '\
               </div>\
               <div class="item-number">' + +banner.clicks + '</div>\
             </div>\
             <div class="table-row-item">\
               <div class="item-ico">\
                 ' + svg.pointerArrowInCircle + '\
               </div>\
               <div class="item-number">' + +banner.clicksUnique + '</div>\
             </div>\
             <div class="table-row-item">\
               <div class="item-ico">\
                 ' + svg.pointerFinger + '\
               </div>\
               <div class="item-number ctr">' + Number(banner.ctr).toFixed(3) + '</div>\
             </div>\
             <div class="table-row-item">\
               <div class="item-ico">\
                 ' + svg.coinSmall + '\
                 <div class="item-number price">' + income + '</div>\
               </div>\
             </div>\
           </div>\
         </div>\
       </div>';

      bannersHtml += bannerHtml;
    });

    // hide boot animation
    $('#loading-1').hide();
    $('#banners-table').html(bannersHtml);
  },

  showContents(contents) {
    let contentsHtml = '';

    contents.forEach(content => {
      const dataContentId = content.id ? 'data-content-id="' + content.id + '"' : ''
      const link = content.link || '';

      let src = '';
      let imageDisplay = 'none';
      if (content.content && content.content.length > 1) {
        src = content.content + getRandomHash()
        imageDisplay = 'inline';
      }

      const backgroundColor = (!link || !src) ? '#FA8072' : '#F2F2F2'

      const contentHtml =
        '<div class="body-row" \
              '+ dataContentId + '\
              data-size-id="'+ content.bannerSizeId + '" \
              data-size="'+ content.size + '" \
              data-company-id="'+ content.companyId + '" \
              style="height: 70px"\
          >\
          <div class="row-content-part" style="align-items: center; justify-content: space-between; background-color:'+ backgroundColor + '">\
            <div class="table-row-item company-name" style="width: 400px; overflow: hidden;">\
              <span class="resolution" style="width: 75px">'+ content.size + '</span >\
              <input\
                style="width: 350px; outline: none; padding: 5px; height: 100%"\
                type="text"\
                class="content-link"\
                title="' + link + '"\
                value="' + link + '"\
              />\
            </div>\
            <div style="display: flex; flex-direction: row; width: 400px; justify-content: space-between;">\
              <div style="width: 110px;">\
                <label for="file-'+ content.bannerSizeId + '" class="btn" \
                      style="width: 100px; height: 50px; border: 1px solid #c1c1c1; padding-top: 10px; margin-top: 10px;"\
                >\
                  загрузити\
                </label>\
                <input class="content-file" id="file-'+ content.bannerSizeId + '" style="visibility:hidden; height: 0; width: 0" type="file">\
              </div>\
              <a class="content-image-link" style="display: flex;flex-grow: 1; align-items: center;" href="'+ src + '" target="blank">\
                <img class="content-image" style="max-width: 100%; max-height: 70px" style="display: '+ imageDisplay + '" src="' + src + '">\
              </a>\
            </div>\
          </div>\
        </div> ';

      contentsHtml += contentHtml;
    });

    $('#formats-table').html(contentsHtml);
  }
};