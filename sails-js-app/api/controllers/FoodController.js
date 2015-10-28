/**
 * FoodController
 *
 * @description :: Server-side logic for managing Foods
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var Promise = require('bluebird');
var elasticsearch = require('elasticsearch');

//elasticsearch client: an adapter should be written for this
var client = new elasticsearch.Client({
        host: 'localhost:9200'
    });

module.exports = {

    //create
    create: function (req, res) {
        var params = req.params.all();
        var json_params = {name: params.name,
                           nutrition_facts: params.nutrition_facts,
                           brand: Brand.getOrCreate(params.brand)};

        Promise.props(json_params)
        .then(function(params) {
            Food.create(params)
            .exec(function(err, result) {
                if (err) return res.badRequest(err);
                else create_es_index(result);

                return res.json(result);
            });
        })
        .catch(function(error) {
            return res.badRequest(error);
        });

        function create_es_index(result) {
            client.create({
              index: 'holmusk',
              type: 'food',
              body: {
                id: result.id,
                name: result.name
              }
            }, function(err, result){
                if (err) console.log(err);
                else console.log("Food Indexed");
            });
        }

    },


    get_nutrition: function (req, res) {
        var params = req.params.all();

        Food.findOne({id: params.id}).exec(function(err, result) {
            if (err) return res.badRequest(err);
            if (result) return res.json(result.nutrition_facts);
            return res.notFound();
        });
      },

    search: function (req, res) {
        var params = req.params.all();

        if (params.q !== 'undefined') {
            client.search({
                index: 'holmusk',
                q: 'name:' + params.q
            }, process_result);
        }
        else return res.json();

        function process_result(error, response) {
            if (!error) {
                var search_hits = response.hits.hits;
                var result_list = [];

                for (var i = 0, len = search_hits.length; i < len; i++) {
                    result_list.push({id: search_hits[i]['_source']['id'],
                                      name: search_hits[i]['_source']['name']})
                }
                return res.json(result_list);
            }
            else return res.serverError(error);
        }

      }

};

