var request = require('request'),
    cheerio = require('cheerio'),
    fs = require('fs'),
    url = 'http://www.imdb.com/title/tt1229340';


request(url, function(error, response, html) {

    if(!error) {
        var $ = cheerio.load(html);

        var title, release, rating;
        var json = {title: "", release: "", rating: ""};

        $('.header').filter(function(){
            var data = $(this);
            title = data.children().first().text();
            release = data.children().last().children().text();

            json.title = title;

            // Once again, once we have the data extract it we'll save it to our json object

            json.release = release;
        })

        $('.star-box-giga-star').filter(function(){
            var data = $(this);

            // The .star-box-giga-star class was exactly where we wanted it to be.
            // To get the rating, we can simply just get the .text(), no need to traverse the DOM any further

            rating = data.text();

            json.rating = rating;
        })

        fs.writeFile('output.json', JSON.stringify(json, null, 4), function(err){

            console.log('File successfully written! - Check your project directory for the output.json file');

        })

    }
})