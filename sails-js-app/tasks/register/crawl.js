var Sails = require('sails');
var Xray = require('x-ray');
var Promise = require('bluebird');
var watchArray = require('watch-array');
var elasticsearch = require('elasticsearch');

var x = new Xray();
var brand_map = {};

var client = new elasticsearch.Client({
    host: 'localhost:9200'
});


var url = 'http://www.myfitnesspal.com/food/calories/';
var url_id = 10000;
var url_id_limit = 90000;
var MAX_QUEUE = 10;

/**
*   FoodQueue stores the food objects in an array
*   and saves the food objects by bulk according
*   to the specified max queue length defined by
*   the user: default queue length is 20
*/
var FoodQueue = function() {
    'use strict';
    var food_queue = [];
    var queue_and_save = function(food_obj) {
        this.food_queue.push(food_obj);
    };


    /**
    * saves data_array to DB
    * TODO: should allow saving retries if errors occur
    */
    var save_data = function(data_array){
        return Food.create(data_array).exec(function(err, result) {
            if (!err) {
                console.log('Food data saved : ' + data_array.length + ' items');
                create_index(result);
            } else {
                console.log('Error in saving data');
            }
        });
    }

    var create_index = function(result) {
        console.log('creating index');
        var index_objects = create_index_objects(result)

        Promise.all(index_objects)
        .then(function(){
            client.bulk({body:index_objects}, function(err, response) {
                if (!err) console.log('items indexed');
            })
        })

    }

    var create_index_objects = function(data_array) {
        var index_objects = [];
        for (var i = 0, len = data_array.length; i < len; i++) {
            index_objects.push({ index:  { _index: 'holmusk', _type: 'food' } })
            index_objects.push({id: data_array[i].id, name: data_array[i].name})
        }

        return index_objects;
    }

    /**
    *   Watch changes in food_queue; calls save_data(food_queue)
    *   if the food_queue reaches the user defined max_queue length
    */
    watchArray(food_queue, function() {
        if (food_queue.length > MAX_QUEUE) {
            save_data(food_queue.splice(0, MAX_QUEUE));
        }

    });

    return {
        queue_and_save: queue_and_save,
        save_data: save_data,
        food_queue: food_queue
    }

}


module.exports = function(grunt) {

    var fq = new FoodQueue();

    grunt.registerTask('crawl', 'crawl the network and report', function() {
        var done = this.async()

        Sails.lift(function() {
            get_brands()
            .then(function(brands){
                brand_map = brands;
                scrape_data();
            })
            .catch(function(error){
                console.log(error)
            });
        })
    })



    /**
    *   scrape data from the given url and calls create_json_data
    *   CURRENT STATUS: currently, this is a recursive function that
    *   will not stop until the url_id limit is reached.
    *   This should be modified in the future so as to take advantage
    *   of javascript's async; allow multiple scraping operations in
    *   any given time.
    */
    var scrape_data = function () {

        console.log(url + url_id);

        x(url+url_id, 'html',
            [{
            foodname: '.food-description',
            name: ['#nutrition-facts tr .col-1'],
            value: ['#nutrition-facts tr .col-2'],
            brand: '#other-info h3.secondary-title'}])(function(err, content){
            if(!err){
                for (var i = 0, len = content.length; i < len; i++) {
                    create_json_data(content[i], url_id);
                }

            } else {
                console.log(err);
            }

            url_id++;
            if (url_id <= url_id_limit) scrape_data();
        })

    }

    /**
    *   creates a json data of the food object to be saved
    *   and then queues the created json object in the food queue
    */
    var create_json_data = function(raw_data, url_id){
        var food_obj = {}
        var nutrition_obj = {}

        Promise.props({
            name: raw_data['foodname'],
            nutrition_facts: create_nutrition_obj(raw_data['name'], raw_data['value']),
            brand: raw_data.brand ? extract_brand(raw_data.brand):null,
            url_id: url_id
        })
        .then(function(result){
            if (result['name']) fq.queue_and_save(result);
        })
        .catch(function(error){
            console.log(error);
        });

    }

    /**
    *   accepts the name and value arrays from the scraped data
    *   and creates a json obj to be stored on the nutrition column
    */
    var create_nutrition_obj = function(name, value) {
        var nutrition_obj = {};

        for (var i = 0, len = name.length; i < len; i++) {
            if(name[i] != false) nutrition_obj[name[i]] = value[i];
        }
        return nutrition_obj;
    }

    /**
    *   Extract brand from the scraped raw string.
    *   Returns: Brand ID
    *   This function attempts to extract the brand id
    *   from the in-memory brand map, if it does not get
    *   the id, it adds the current string to the db and
    *   also updates the brand_map with the corresponding variable
    */
    var extract_brand = function(raw_string) {
        return new Promise(function(resolve, reject){
            brand_str = raw_string.replace('More from', '').trim();

            if(typeof brand_map[brand_str] !== 'undefined'){
                return resolve(brand_map[brand_str]);
            } else {
                return Brand.findOrCreate({name:brand_str},{name:brand_str})
                .exec(function(err, result) {
                    if (err) return reject(err);
                    else {
                        brand_map[result.name] = result.id;
                        return resolve(result.id);
                    }
                });
            }
        });
    }

    /**
    *   Constructs the in memory brand map so that we don't have to
    *   hit the DB everytime we need to get a Brand ID
    */
    var get_brands = function (brand_map) {
        return new Promise(function(resolve, reject){
            Brand.query('SELECT name, id from brand', map_brand);

            function map_brand(err, result) {
                if (err) reject(err);
                else {
                    var brand_map = {};
                    result.forEach(function(item){
                        brand_map[item.name] = item.id;
                    });
                    resolve(brand_map);
                }
            }
        });
    }

}
