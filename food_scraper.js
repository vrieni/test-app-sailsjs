var Xray = require('x-ray');
var x = Xray();


// x('https://dribbble.com', 'li.group', [{
//   title: '.dribbble-img strong',
//   image: '.dribbble-img [data-src]@data-src',
// }])
//   .paginate('.next_page@href')
//   .limit(3)
//   .write('results.json')

var whitelist = ['http://www.myfitnesspal.com/food/'];
var crawl_me = []


var follow_food_links = function (payload) {

    var food_links = payload.toString().split(",");

    for (var i = 0, len = food_links.length; i < len; i++) {
        if(food_links[i].indexOf("myfitnesspal.com/food/") > -1){
            scrape_food_data(food_links[i].replace(/"/g, ""));
        }

    }

}

var scrape_food_data = function(url) {

    try {
        x(url, '#nutrition-facts')(function(err, content){
            console.log(content);
        })
    } catch(err) {
        console.log(err);
    }

}


var save_data = function(err, content) {
    if (!err){
        console.log(content);
    }
}




// var scrape_details = x(url, [])(fn);

var url = 'http://www.myfitnesspal.com/food/search?page=495&search=a';
var follow_links = '.food_search_results li a:not(.brand)@href';



x(url, follow_links)
    .paginate('.next_page@href').write().on('data', function(data){
        console.log(data);
    })
