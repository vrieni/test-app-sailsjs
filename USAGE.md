
Prerequisites:
step 1: create mysql db: holmusk
step 2: install elastic search and use default port
step 3: create es index
     [PUT]   http://localhost:9200/holmusk/

     {
         "settings": {
             "number_of_shards": 1,
             "analysis": {
                 "filter": {
                     "autocomplete_filter": {
                         "type":     "edge_ngram",
                         "min_gram": 3,
                         "max_gram": 20
                     }
                 },
                 "analyzer": {
                     "autocomplete": {
                         "type":      "custom",
                         "tokenizer": "standard",
                         "filter": [
                             "lowercase",
                             "autocomplete_filter"
                         ]
                     }
                 }
             }
         }
     }

step 4: Assign analyzer for food
   [PUT] http://localhost:9200/holmusk/_mapping/food
   {
       "food": {
           "properties": {
               "name": {
                   "type":     "string",
                   "analyzer": "autocomplete"
               }
           }
       }
   }

step 5: On the same directory where the sails gruntfile is located, run "grunt crawl"
        to populate DB. Alternatively, you can manually input food data using the api provided
        by bluebird or the api stated below




#### Scraper
* To start scraper on cli : grunt crawl

#### API
* You have to build an end point to accept a query, q, which will return the 10 foods (return only name and "food_id") with the most similar name.[See: Autocomplete](http://en.wikipedia.org/wiki/Autocomplete)
The end point should return the food titles in JSON format

[GET] http://localhost:1337/api/food/search?q=<query_param>


get nutritional info : [GET] http://localhost:1337/api/food/nutrition/<id>

* There should also be an endpoint to manually insert data into the database.
**Aside from the custom made API below, we can also use the CRUD API of bluebird.

create brand: [POST] http://localhost:1337/api/brand/create
data: {"name": "<name>""}

create food: [POST] http://localhost:1337/api/food/create
data: {"name":"soup32", "nutrition_facts":{"calories":"100"}, "brand": 35}
      or {"name":"soup32", "nutrition_facts":{"calories":"100"}, "brand": {"name":"xyz"}}



Relevant scripts:

# Scraper
* /tasks/register/crawl.js

# Models
* /api/models/Brand.js
* /api/models/Food.js

# Controllers
* BrandController.js
* FoodController.js

