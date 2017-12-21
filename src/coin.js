var coinFactory = (function () {
  var krw = 0;
  var total = 0;
  var init = function () {
    // Workaround for bug in mouse item selection

    $.get("https://files.coinmarketcap.com/generated/search/quick_search.json", function(data){
      console.log(data)
      //https://files.coinmarketcap.com/static/img/coins/16x16/bitcoin-cash.png
      $('#coin-name').typeahead({
        source: data
      });
    },'json');

    $.get('https://api.fixer.io/latest?base=USD', function (r) {
      krw = r.rates.KRW;
      start();
    });
  };

  var start = function () {
    $('#contents').on('click', '.btn-delete', function () {
      if(confirm('Are you sure?')){
        var dataIdx = $(this).data('idx');
        var coins = Cookies.get('coins');
        coins = coins.split('###')
        var y = [];
        coins.forEach(function (item, idx) {
          if (idx != dataIdx) {
            y.push(item);
          }
        });
        Cookies.set('coins', y.join('###'), {
          expires: 3650
        });
        loadCoins();
      }
    });

    $('#coin-balance').on('keyup', function (e) {
      if(e.keyCode == 13){
        $('#btn-save').trigger('click');
      }
    })


    $('#btn-save').on('click', function () {
      var coinNm = $('#coin-name').val();
      if(coinNm == '') return;
      coinNm = coinNm.split(' ').join('-').split('.').join('-').toLowerCase();
      console.log(coinNm)
      var param = {
        coinNm: coinNm,
        coinBalance: $('#coin-balance').val()
      };

      $.ajax({
        url: 'https://api.coinmarketcap.com/v1/ticker/' + param.coinNm + '/?ref=widget&convert=ETH',
        success: function (data) {
          if (!$.isNumeric(param.coinBalance)) {
            param.coinBalance = 0;
          }

          if (param.coinNm != '') {
            var x = [];
            var coins = Cookies.get('coins');
            if (coins != null && coins != '') {
              x.push(coins);
            }
            x.push(param.coinNm + '|' + param.coinBalance)

            Cookies.set('coins', x.join('###'), {
              expires: 3650
            });
          }
          loadCoins();
          $('#btn-close').trigger('click');

        },
        error: function () {
          alert('알수없는 코인입니다.')
        }
      });
    });

    loadCoins();
  };

  var loadCoins = function () {
    total = 0;
    $('#contents').html('');
    var coins = Cookies.get('coins');
    if (coins != '' && coins != null) {
      coins = coins.split('###')
      coins.forEach(function (item, idx) {
        var x = item.split('|')
        get(idx, x[0], x[1]);
      });
    }
  };

  var get = function (idx, coinNm, balance) {
    $.ajax({
      url: 'https://api.coinmarketcap.com/v1/ticker/' + coinNm + '/?ref=widget&convert=ETH',
      success: function (data) {
        var r = data[0]
        var price = r.price_eth;
        var usd = r.price_usd;

        var percentChange1h = r.percent_change_1h;
        var percentChange1hColor = percentChange1h >= 0 ? '#093' : '#d14836';
        var percentChange24h = r.percent_change_24h
        var percentChange24hColor = percentChange24h >= 0 ? '#093' : '#d14836';
        var percentChangeStr = '<span style="color:' + percentChange1hColor + '"> (1H : ' + percentChange1h + '%)</span> <span style="color:' + percentChange24hColor + '">(24H : ' + percentChange24h + '%)</span>'

        var krwBalance = 0;
        krwBalance = usd * krw * balance;
        total = total + krwBalance
        $('#total').text('총 자산: ' + comma(total) + '원')

        var x = template({
          idx: idx,
          coinNm: coinNm,
          krwBalance: krwBalance,
          price: usd + ' USD' + percentChangeStr
        });
        $('#contents').append(x)
      }
    });
  };

  var template = function (data) {
    data.coinNm = data.coinNm.toLowerCase();
    var h = [],
      k = 0;
    h[k++] = '<div class="coinmarketcap-currency-widget">';
    h[k++] = '    <div style="border:2px solid #E4E6EB;border-radius: 10px;font-family: \'Helvetica Neue\',Helvetica,Arial,sans-serif;min-width:285px;">';
    h[k++] = '        <div>';
    h[k++] = '            <div style="float:right;width:77%;border: 0px solid #000;text-align:left;padding:5px 0px;line-height:30px;"> <span style="font-size: 18px;"><a href="http://coinmarketcap.com/currencies/' + data.coinNm + '/?utm_medium=widget&amp;utm_campaign=cmcwidget&amp;utm_source=mdev.spicus.com&amp;utm_content=' + data.coinNm + '" target="_blank" style="text-decoration: none; color: rgb(66, 139, 202);">' + data.coinNm.toUpperCase() + (data.krwBalance > 0 ? (" ( " + comma(data.krwBalance.toFixed(0)) + "원 )") : "") + '</a></span> <br> <span style="font-size: 13px;">' + data.price + '</span><button class="button button-caution button-circle button-small btn-delete" style="position: absolute;right: 0;" data-idx="' + data.idx + '"><i class="fa fa-times"></i></button>';
    h[k++] = '            </div>';
    h[k++] = '            <div style="text-align:center;padding:5px 0px;width:23%;"><img src="https://files.coinmarketcap.com/static/img/coins/64x64/' + data.coinNm + '.png"></div>';
    h[k++] = '        </div>';
    h[k++] = '    </div>';
    h[k++] = '</div>';
    return h.join('');
  }

  var timeSince = function (timeStamp) {
    var now = new Date(),
      secondsPast = (now.getTime() - timeStamp.getTime()) / 1000;
    if (secondsPast < 60) {
      return parseInt(secondsPast) + 's';
    }
    if (secondsPast < 3600) {
      return parseInt(secondsPast / 60) + 'm';
    }
    if (secondsPast <= 86400) {
      return parseInt(secondsPast / 3600) + 'h';
    }
    if (secondsPast > 86400) {
      day = timeStamp.getDate();
      month = timeStamp.toDateString().match(/ [a-zA-Z]*/)[0].replace(" ", "");
      year = timeStamp.getFullYear() == now.getFullYear() ? "" : " " + timeStamp.getFullYear();
      return day + " " + month + year;
    }
  };

  var comma = function (x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  return {
    init: init
  }
});